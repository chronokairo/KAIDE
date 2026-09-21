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
  "How many times the planner may swap a role's model within the session.")
(defparameter *max-attempts* 6
  "How many executor+improver+planner cycles the session may run before giving
up on an unsatisfiable request (safety bound, not a visible turn counter).")
(defparameter *max-tool-steps* 8
  "How many tool calls one role may chain in a single run before the harness
forcibly treats the reply as final (prevents an infinite tool loop).")

(defun mock-executor-call (context)
  (let ((step (incf *mock-step*)))
    (case step
      (1 (assert (search "User request" context))
         "{\"message\":\"Inspecionando o repositorio.\",\"tools\":[{\"name\":\"shell\",\"command\":\"printf 'forgepair-mock-ok\\n'\"}]}")
      (2 (unless (search "forgepair-mock-ok" context)
           (error "mock executor did not receive its own tool output"))
         "{\"done\":true,\"message\":\"Inspecionei o repositorio para atender o pedido.\"}")
      (otherwise (error "mock executor called too many times")))))

(defun mock-improver-call (prompt)
  (let ((step (incf *mock-step*)))
    (case step
      (3 (unless (and (search "Inspecionei o repositorio" prompt)
                      (search "forgepair-mock-ok" prompt))
           (error "mock improver did not receive the executor result"))
         "{\"done\":true,\"improvement\":\"Ajuste no prompt do executor do Forgepair.\",\"rationale\":\"Pequena melhoria verificavel no proprio repo.\"}")
      (otherwise (error "mock improver called too many times")))))

(defun mock-planner-call ()
  "{\"executor_ok\":true,\"improver_ok\":true,\"note\":\"ok\"}")

(defun notes-text (notes-port)
  (let ((notes (funcall (notes-port-take notes-port))))
    (if notes (format nil "~%Human observer notes (advice only):~%~{ - ~A~%~}" notes) "")))

(defun safe-provider-request (provider-port provider system user)
  "Call a provider, returning (values raw error-string). A transient provider
failure (rate limit, credit exhaustion, timeout) yields an empty raw plus the
error text so the session can log the attempt and continue instead of aborting."
  (handler-case (values (provider-request provider-port provider system user) nil)
    (error (condition) (values "" (princ-to-string condition)))))

;;; Per-role run. Each role is a small coding agent: it may chain several tool
;;; calls, seeing each result, until it emits a final JSON reply without tools.

(defun tool-to-command (tool)
  "Translate a tool call object into the shell command the sandbox runs.
Unsupported tool names degrade to their :command (or empty) rather than
signalling, so a model quoting a wrong name still produces something."
  (let ((name (or (field "name" tool) "")))
    (case name
      ("shell" (or (field "command" tool) ""))
      ("read" (format nil "cat -- ~A" (or (field "path" tool) "")))
      ("list" (format nil "ls -la -- ~A" (or (field "path" tool) ".")))
      (t (or (field "command" tool) "")))))

(defun run-role-tool-loop (mock-fn provider-port provider system-fn context command-port
                           session-port)
  "Run one role as a tool-calling agent. SYSTEM-FN builds the system prompt, the
mock path uses MOCK-FN on the growing context. Executes every :tools entry in
order, appending each result to the context, until a reply has no :tools list.
Returns (values done-fields tool-transcript), where done-fields is the alist of
the final JSON reply (or NIL if the tool budget was exhausted)."
  (let ((transcript ""))
    (dotimes (step *max-tool-steps*)
      (multiple-value-bind (raw err)
          (if mock-fn (values (funcall mock-fn context) nil)
              (safe-provider-request provider-port provider (funcall system-fn) context))
        (let ((reply (extract-object raw)))
          (let ((tools (field "tools" reply)))
            (if (and tools (listp tools) (plusp (length tools)))
                (dolist (tool tools)
                  (let* ((command (tool-to-command tool))
                         (out (if (string= (trim command) "") ""
                                  (execute-command command-port command)))
                         (block (format nil "~%~%Tool: $ ~A~%Result:~%~A" command out)))
                    (setf transcript (format nil "~A~A" transcript block))
                    (setf context (format nil "~A~A" context block))
                    (session-event session-port "tool" block)))
                (return-from run-role-tool-loop
                  (values (if err nil reply) transcript)))))))
    (values nil transcript)))

(defun run-executor (mock provider-port executor rules request history notes feedback
                     command-port session-port)
  "Run the executor as a tool-calling agent until it reports done. Returns
(values message tool-transcript)."
  (let ((system (lambda () (executor-system request rules)))
        (context (action-prompt request history notes feedback)))
    (multiple-value-bind (reply transcript)
        (run-role-tool-loop (when mock (lambda (c) (mock-executor-call c)))
                            provider-port executor system context command-port session-port)
      (values (or (field "message" reply)
                  "[executor limite de ferramentas atingido, sem resposta final]")
              transcript))))

(defun run-improver (mock provider-port improver rules request
                     executor-message executor-command executor-output improvements
                     command-port session-port)
  "Run the improver as a tool-calling agent (Forgepair repo only). Returns
(values improvement rationale tool-transcript)."
  (let ((system (lambda () (improver-system request rules)))
        (context (improve-prompt request executor-message executor-command
                                 executor-output improvements)))
    (multiple-value-bind (reply transcript)
        (run-role-tool-loop (when mock (lambda (p) (mock-improver-call p)))
                            provider-port improver system context command-port session-port)
      (values (or (field "improvement" reply) "")
              (or (field "rationale" reply) "")
              transcript))))

(defun run-planner (mock provider-port planner rules request
                    executor-message executor-command executor-output
                    improvement improver-command improver-output)
  "Ask the planner to validate the attempt. Returns (values executor-ok improver-ok
note)."
  (let ((sys (planner-system request rules))
        (prompt (planner-prompt request executor-message executor-command executor-output
                                improvement improver-command improver-output)))
    (multiple-value-bind (raw err)
        (if mock (values (mock-planner-call) nil)
            (safe-provider-request provider-port planner sys prompt))
      (if err
          ;; An unavailable planner cannot verify either role. Fail closed so
          ;; the session retries/swaps instead of reporting the result valid.
          (values nil nil (format nil "[planner indisponivel: ~A]" err))
          (let ((reply (extract-object raw)))
            (values (field "executor_ok" reply)
                    (field "improver_ok" reply)
                    (or (field "note" reply) "")))))))

(defun run-session (config planner-provider executor-provider improver-provider pool
                    provider-port executor-command-port improver-command-port
                    output-port notes-port prompt-port
                    &key cli mock session-port on-start)
  (let* ((rules (slurp (merge-pathnames "AGENTS.md" *root*)))
         (request (user-prompt prompt-port))
         (history "No executor action has happened yet.")
         (feedback "")
         (improvements "")
         (executor executor-provider)
         (improver improver-provider)
         (executor-swaps 0)
         (improver-swaps 0)
         (executor-ok nil)
         (improver-ok nil)
         (note "")
         (tried-executor (list (getf executor :model)))
         (tried-improver (list (getf improver :model))))
    (unless planner-provider
      (error "planner provider is required"))
    (when (string= (trim (or request "")) "")
      (error "no user request provided; pass --prompt or pipe it on stdin"))
    (when mock (setf *mock-step* 0))
    (unless cli (funcall (notes-port-start notes-port)))
    ;; Startup hook — called once the prompt is known (chat-id is captured).
    (when on-start (funcall on-start))
    ;; Chat-style Telegram: echo the pedido and the chosen pairing first.
    (session-event session-port "voce" request)
    (session-event session-port "forgepair"
                   (format nil "planner=~A | executor(A)=~A | improver(B)=~A"
                           (getf planner-provider :label) (getf executor :label)
                           (getf improver :label)))
    ;; Continuous agent loop: executor works (chaining tools) until done, the
    ;; improver improves only Forgepair, then the planner validates. On a failed
    ;; validation the failing role's model is swapped and the loop retries with
    ;; the planner's guidance, bounded by *max-attempts* and *max-swaps*.
    (loop for attempt from 1
          with executor-message = "" with executor-output = ""
          with improvement = "" with rationale = "" with improver-output = ""
          do
          ;; Executor (model A) — a tool-calling agent in the project dir.
          (multiple-value-setq (executor-message executor-output)
            (run-executor mock provider-port executor rules request history
                          (notes-text notes-port) feedback executor-command-port session-port))
          ;; Improver (model B) — a tool-calling agent, Forgepair repo only.
          (multiple-value-setq (improvement rationale improver-output)
            (run-improver mock provider-port improver rules request
                          executor-message "[tool chain]" executor-output improvements
                          improver-command-port session-port))
          ;; Planner validation.
          (multiple-value-setq (executor-ok improver-ok note)
            (run-planner mock provider-port planner-provider rules request
                         executor-message "[tool chain]" executor-output
                         improvement "[tool chain]" improver-output))
          ;; Render the accepted attempt.
          (render-turn output-port
                       (format nil "Executor(~A)" (getf executor :label))
                       executor-message "[tool chain]" executor-output)
          (render-turn output-port
                       (format nil "Improver(~A)" (getf improver :label))
                       (format nil "~A (motivo: ~A)" improvement rationale)
                       "[tool chain]" improver-output)
          (render-turn output-port "Planner"
                       (format nil "executor_ok=~A improver_ok=~A ~A"
                               (if executor-ok "sim" "nao")
                               (if improver-ok "sim" "nao") note)
                       "" "[no command]")
          (setf history (format nil "~AMy action: ~A~%My command: [tool chain]~%My terminal result:~%~A~%"
                                history executor-message executor-output))
          (when (and improver-ok (not (string= (trim improvement) "")))
            (setf improvements (format nil "~A - ~A~%" improvements improvement)))
          ;; Chat-style: post the accepted attempt as separate messages so the
          ;; user watches the conversation and tool calls unfold (chat app).
          (session-event session-port
                         (format nil "executor (~A)" (getf executor :label))
                         (if (string= (trim executor-message) "")
                             "(sem mensagem)" executor-message))
          (session-event session-port "tool" executor-output)
          (session-event session-port
                         (format nil "improver (~A)" (getf improver :label))
                         (format nil "~A~@[~%motivo: ~A~]" improvement
                                 (unless (string= (trim rationale) "") rationale)))
          (unless (string= (trim improver-output) "")
            (session-event session-port "tool" improver-output))
          (session-event session-port "planner"
                         (format nil "executor_ok=~A improver_ok=~A~@[ — ~A~]"
                                 (if executor-ok "sim" "nao") (if improver-ok "sim" "nao")
                                 (unless (string= (trim note) "") note)))
          ;; Exit conditions: both roles validated, or one/both swap budgets used
          ;; up, or the whole loop bound reached.
          (when (or (and executor-ok improver-ok)
                    (>= attempt *max-attempts*)
                    (and (>= executor-swaps *max-swaps*)
                         (>= improver-swaps *max-swaps*)))
            (return))
          ;; Swap the model(s) the planner rejected and retry with its guidance.
          (unless executor-ok
            (if (< executor-swaps *max-swaps*)
                (let ((new (swap-model executor :executor pool
                                       :exclude-models tried-executor)))
                  (render-turn output-port "Planner"
                               (format nil "executor nao implementou; trocando ~A -> ~A"
                                       (getf executor :label) (getf new :label)) "" note)
                  (session-event session-port "planner"
                                 (format nil "executor nao implementou; trocando ~A -> ~A"
                                         (getf executor :label) (getf new :label)))
                  (setf executor new)
                  (incf executor-swaps)
                  (pushnew (getf executor :model) tried-executor :test #'string=))
                (setf feedback note)))
          (unless improver-ok
            (if (< improver-swaps *max-swaps*)
                (let ((new (swap-model improver :improver pool
                                       :exclude-models tried-improver)))
                  (render-turn output-port "Planner"
                               (format nil "improver nao implementou; trocando ~A -> ~A"
                                       (getf improver :label) (getf new :label)) "" note)
                  (session-event session-port "planner"
                                 (format nil "improver nao implementou; trocando ~A -> ~A"
                                         (getf improver :label) (getf new :label)))
                  (setf improver new)
                  (incf improver-swaps)
                  (pushnew (getf improver :model) tried-improver :test #'string=))
                (setf feedback note))))
    (unless (and executor-ok improver-ok)
      (render-turn output-port "Planner"
                   "request nao validado dentro do limite de tentativas" "" note))
    (format t "~&Concluido. Revise com: git diff~%")
    (unless (string= improvements "")
      (format t "~%Melhorias no repo Forgepair identificadas nesta sessao:~%~A" improvements))
    (session-event session-port "sessao"
                   (format nil "concluida. Melhorias no repo Forgepair:~%~A"
                           (if (string= improvements "") " (nenhuma)" improvements)))))
