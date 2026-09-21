;;;; Application: the hexagonal use case orchestrator.
;;;;
;;;; Three roles:
;;;;   - planner:  the best model of the tier. It does not run commands; it
;;;;               orchestrates and, each turn, validates whether the executor
;;;;               fulfilled the user's request and whether the improver applied
;;;;               a real improvement to the Forgepair repo. On a failed
;;;;               validation it swaps the offending role's model and retries.
;;;;   - executor: model A, chosen for cost-benefit. Fulfills the user's request
;;;;               (one shell command per turn).
;;;;   - improver: model B. Improves ONLY the Forgepair repository itself.
;;;;
;;;; The use case depends only on ports (provider, command, output, notes,
;;;; prompt, session). The entrypoint wires concrete adapters and passes the
;;;; available tier pool for model-swapping. The mock path exercises the same
;;;; decisions with no external effects.

(in-package :forgepair)

(defparameter *mock-step* 0)
(defparameter *max-swaps* 2
  "How many times the planner may swap a role's model within a single turn.")

(defun mock-executor-call (user)
  (declare (ignore user))
  (incf *mock-step*)
  "{\"message\":\"Inspecionei o repositorio para atender o pedido.\",\"command\":\"printf 'forgepair-mock-ok\\n'\"}")

(defun mock-improver-call (prompt executor-message executor-command executor-output)
  (declare (ignore prompt executor-command))
  (unless (and (search "Inspecionei o repositorio" executor-message)
               (search "forgepair-mock-ok" executor-output)
               (search "[exit 0]" executor-output))
    (error "mock improver did not receive the executor result"))
  "{\"improvement\":\"Ajuste no prompt do executor do Forgepair.\",\"rationale\":\"Pequena melhoria verificavel no proprio repo.\",\"command\":\"\"}")

(defun mock-planner-call (executor-message improvement)
  (declare (ignore executor-message improvement))
  "{\"executor_ok\":true,\"improver_ok\":true,\"note\":\"ok\"}")

(defun notes-text (notes-port)
  (let ((notes (funcall (notes-port-take notes-port))))
    (if notes (format nil "~%Human observer notes (advice only):~%~{ - ~A~%~}" notes) "")))

(defun safe-provider-request (provider-port provider system user)
  "Call a provider, returning (values raw error-string). A transient provider
failure (rate limit, credit exhaustion, timeout) yields an empty raw plus the
error text so the session can log the turn and continue instead of aborting."
  (handler-case (values (provider-request provider-port provider system user) nil)
    (error (condition) (values "" (princ-to-string condition)))))

;;; Per-role turn execution. Each returns the parsed fields the planner needs.

(defun run-executor (mock provider-port executor rules request history notes)
  "Run the executor once. Returns (values message command output)."
  (let ((sys (executor-system request rules))
        (prompt (action-prompt request history notes)))
    (multiple-value-bind (raw err)
        (if mock (values (mock-executor-call prompt) nil)
            (safe-provider-request provider-port executor sys prompt))
      (let* ((reply (extract-object raw))
             (message (or (field "message" reply)
                          (and err (format nil "[executor indisponivel: ~A]" err)) ""))
             (command (or (field "command" reply) "")))
        (values message command)))))

(defun run-improver (mock provider-port improver rules request
                     executor-message executor-command executor-output improvements)
  "Run the improver once (Forgepair repo only). Returns (values improvement
rationale command)."
  (let ((sys (improver-system request rules))
        (prompt (improve-prompt request executor-message executor-command
                                executor-output improvements)))
    (multiple-value-bind (raw err)
        (if mock (values (mock-improver-call request executor-message
                                             executor-command executor-output) nil)
            (safe-provider-request provider-port improver sys prompt))
      (let* ((reply (extract-object raw))
             (improvement (or (field "improvement" reply)
                              (and err (format nil "[improver indisponivel: ~A]" err)) ""))
             (rationale (or (field "rationale" reply) ""))
             (command (or (field "command" reply) "")))
        (values improvement rationale command)))))

(defun run-planner (mock provider-port planner rules request
                    executor-message executor-command executor-output
                    improvement improver-command improver-output)
  "Ask the planner to validate the turn. Returns (values executor-ok improver-ok
note)."
  (let ((sys (planner-system request rules))
        (prompt (planner-prompt request executor-message executor-command executor-output
                                improvement improver-command improver-output)))
    (multiple-value-bind (raw err)
        (if mock (values (mock-planner-call executor-message improvement) nil)
            (safe-provider-request provider-port planner sys prompt))
      (if err
          ;; An unavailable planner cannot verify either role. Fail closed so
          ;; the turn is retried/swapped instead of being reported as valid.
          (values nil nil (format nil "[planner indisponivel: ~A]" err))
          (let ((reply (extract-object raw)))
            (values (field "executor_ok" reply)
                    (field "improver_ok" reply)
                    (or (field "note" reply) "")))))))

(defun compact-session-text (request planner executor improver
                             turn turns executor-message improvement improvements note)
  "Single-bubble Telegram view: only the essentials, re-rendered each turn."
  (format nil "Forgepair — sessao~%~
Pedido: ~A~%~
Planner: ~A~%Executor(A): ~A | Improver(B): ~A~%~
Turno ~D/~D~%~
Acao executor: ~A~%~
Melhorias (repo Forgepair):~%~A~%~
Planner: ~A"
          request (getf planner :label) (getf executor :label) (getf improver :label)
          turn turns
          (if (string= (trim executor-message) "") "(sem mensagem)" executor-message)
          (if (string= improvements "")
              (if (string= (trim improvement) "") " (nenhuma ainda)"
                  (format nil " - Turno ~D: ~A" turn improvement))
              improvements)
          (if (string= (trim note) "") "(ok)" note)))

(defun run-session (config planner-provider executor-provider improver-provider pool
                    provider-port command-port output-port notes-port prompt-port
                    &key cli mock turns-override session-port)
  (let* ((rules (slurp (merge-pathnames ".forgepair/RULES.md" *root*)))
         (request (user-prompt prompt-port))
         (history "No executor action has happened yet.")
         (improvements "")
         (executor executor-provider)
         (improver improver-provider)
         (turns (or turns-override (getf config :turns) 6)))
    (unless planner-provider
      (error "planner provider is required"))
    (when (string= (trim (or request "")) "")
      (error "no user request provided; pass --prompt or pipe it on stdin"))
    (when mock (setf *mock-step* 0))
    (unless cli (funcall (notes-port-start notes-port)))
    (dotimes (turn turns)
      (let* ((notes (notes-text notes-port))
             (executor-message "") (executor-command "") (executor-output "")
             (improvement "") (rationale "") (improver-command "") (improver-output "")
             (executor-ok nil) (improver-ok nil) (note "") (swaps 0)
             (tried-executor (list (getf executor :model)))
             (tried-improver (list (getf improver :model))))
        ;; Executor + improver run, then the planner validates. On a failed
        ;; validation the planner swaps that role's model and the turn retries
        ;; (bounded by *max-swaps*).
        (loop
          ;; Executor (model A).
          (multiple-value-setq (executor-message executor-command)
            (run-executor mock provider-port executor rules request history notes))
          (setf executor-output
                (if (string= executor-command "") "[no command]"
                    (execute-command command-port executor-command)))
          ;; Improver (model B) — Forgepair repo only.
          (multiple-value-setq (improvement rationale improver-command)
            (run-improver mock provider-port improver rules request
                          executor-message executor-command executor-output improvements))
          (setf improver-output
                (if (string= improver-command "") "[no command]"
                    (execute-command command-port improver-command)))
          ;; Planner validation.
          (multiple-value-setq (executor-ok improver-ok note)
            (run-planner mock provider-port planner-provider rules request
                         executor-message executor-command executor-output
                         improvement improver-command improver-output))
          (when (or (and executor-ok improver-ok) (>= swaps *max-swaps*))
            (return))
          ;; Swap the model(s) the planner rejected and retry this turn.
          (incf swaps)
          (unless executor-ok
            (let ((new (swap-model executor :executor pool
                                   :exclude-models tried-executor)))
              (render-turn output-port (1+ turn) turns "Planner"
                           (format nil "executor nao implementou; trocando ~A -> ~A"
                                   (getf executor :label) (getf new :label)) "" note)
              (setf executor new)
              (pushnew (getf executor :model) tried-executor :test #'string=)))
          (unless improver-ok
            (let ((new (swap-model improver :improver pool
                                   :exclude-models tried-improver)))
              (render-turn output-port (1+ turn) turns "Planner"
                           (format nil "improver nao implementou; trocando ~A -> ~A"
                                   (getf improver :label) (getf new :label)) "" note)
              (setf improver new)
              (pushnew (getf improver :model) tried-improver :test #'string=))))
        ;; Render the accepted turn.
        (render-turn output-port (1+ turn) turns
                     (format nil "Executor(~A)" (getf executor :label))
                     executor-message executor-command executor-output)
        (render-turn output-port (1+ turn) turns
                     (format nil "Improver(~A)" (getf improver :label))
                     (format nil "~A (motivo: ~A)" improvement rationale)
                     improver-command improver-output)
        (render-turn output-port (1+ turn) turns "Planner"
                     (format nil "executor_ok=~A improver_ok=~A ~A"
                             (if executor-ok "sim" "nao") (if improver-ok "sim" "nao") note)
                     "" "[no command]")
        (setf history (format nil "~AMy action: ~A~%My command: ~A~%My terminal result:~%~A~%"
                              history executor-message
                              (if (string= executor-command "") "[none]" executor-command)
                              executor-output))
        (when (and improver-ok (not (string= (trim improvement) "")))
          (setf improvements (format nil "~A - Turn ~D: ~A~%" improvements (1+ turn) improvement)))
        (session-update session-port
                        (compact-session-text request planner-provider executor improver
                                              (1+ turn) turns executor-message
                                              improvement improvements note))))
    (format t "~&Concluido. Revise com: git diff~%")
    (unless (string= improvements "")
      (format t "~%Melhorias no repo Forgepair identificadas nesta sessao:~%~A" improvements))
    (session-update session-port
                    (format nil "Forgepair — sessao concluida~%Pedido: ~A~%Planner: ~A~%Melhorias (repo Forgepair):~%~A"
                            request (getf planner-provider :label)
                            (if (string= improvements "") " (nenhuma)" improvements)))))
