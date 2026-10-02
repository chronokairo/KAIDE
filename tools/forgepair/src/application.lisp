;;;; Application: the hexagonal use case orchestrator.
;;;;
;;;; Single role: executor. Works until done, validated by real evidence (git diff, exit codes).
;;;; No planner, no improver, no model swapping — those are commodity features per AGENTS.md rule 10.

(in-package :forgepair)

(defparameter *mock-step* 0)
(defparameter *max-tool-steps* 8
  "How many tool calls the executor may chain in a single run before the harness
forcibly treats the reply as final (prevents an infinite tool loop).")
(defparameter *max-executor-attempts* 3
  "How many times the executor may try before the session reports failure. Past
this the agent is not converging and another attempt just costs another model
call against the same unresolved defect.")

(defun mock-executor-call (context)
  (let ((step (incf *mock-step*)))
    (case step
      (1 (assert (search "User request" context))
         "{\"message\":\"Inspecionando o repositorio.\",\"tools\":[{\"name\":\"shell\",\"command\":\"printf 'forgepair-mock-ok\\n'\"}]}")
      (2 (unless (search "forgepair-mock-ok" context)
           (error "mock executor did not receive its own tool output"))
         "{\"done\":true,\"message\":\"Inspecionei o repositorio para atender o pedido.\"}")
      (otherwise (error "mock executor called too many times")))))

(defun notes-text (notes-port)
  (let ((notes (funcall (notes-port-take notes-port))))
    (if notes (format nil "~%Human observer notes (advice only):~%~{ - ~A~%~}" notes) "")))

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

(defun safe-provider-request (provider-port provider system user)
  "Call a provider, returning (values raw error-string). A transient provider
failure (rate limit, credit exhaustion, timeout) yields an empty raw plus the
error text so the session can log the attempt and continue instead of aborting."
  (handler-case (values (provider-request provider-port provider system user) nil)
    (error (condition) (values "" (princ-to-string condition)))))

;;; Per-role run. The executor is a tool-calling agent: it may chain several tool
;;; calls, seeing each result, until it emits a final JSON reply without tools.

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

(defun search-backwards (needle haystack)
  "Index of the last occurrence of NEEDLE in HAYSTACK, or NIL. Common Lisp has
no SEARCH-FROM-END, and the sandbox transcript can be 12000 characters, so scan
backwards from the end rather than searching the whole string per candidate."
  (let ((end (length haystack))
        (needle-length (length needle))
        (found nil))
    (loop while (and (not found) (>= end needle-length))
          for start = (- end needle-length)
          when (and (char= (char haystack start) (char needle 0))
                    (string= needle haystack :start2 start :end2 end))
            do (setf found start)
          do (decf end 1))
    found))

(defun command-exit-code (output)
  "Last [exit N] marker make-sandbox-command-port appends to OUTPUT, as an
integer, or NIL when the text carries no marker (empty output, or a port that
does not run through the sandbox)."
  (let ((marker (and (plusp (length (or output "")))
                     (search-backwards "[exit " output))))
    (when marker
      (let* ((end (or (position #\] output :start marker) (length output)))
             (digits (subseq output (+ marker 6) end)))
        (and (plusp (length digits))
             (ignore-errors (parse-integer digits)))))))

(defun tail-of (text limit)
  "Last LIMIT characters of TEXT (TRIMmed), or all of it when shorter."
  (let ((out (trim (or text ""))))
    (if (> (length out) limit) (subseq out (- (length out) limit)) out)))

(defun run-verification (command-port verify-command)
  "Run VERIFY-COMMAND (the repo's own check) through the sandbox and return
(values exit-code output). EXIT-CODE is NIL when no command port is available or
the command could not be run at all, which callers read as 'gate not
evaluated' rather than as a pass."
  (if (or (null command-port) (string= (trim (or verify-command "")) ""))
      (values nil "")
      (handler-case
          (let ((out (execute-command command-port verify-command)))
            (values (command-exit-code out) out))
        (error () (values nil "")))))

(defun conformance-state (request executor-message executor-output diff verify-output)
  "The text the decider reads to judge conformance: the FROZEN request first, so
the decision is graded against a spec fixed before the patch existed, then the
executor summary, the tail of the tool transcript, the git diff and the
verification output. Everything is truncated to keep the state inside the length
the decider's model card validated (prompts up to 1536 tokens; quantization
error grows with state size)."
  (format nil "Request (frozen before any edit):~%~A~%~%Executor message: ~A~%~%Tool transcript (tail):~%~A~%~%git diff --stat:~%~A~%~%Verification output (tail):~%~A"
          (tail-of request 1200)
          (tail-of executor-message 800)
          (tail-of executor-output 1200)
          (tail-of diff 800)
          (tail-of verify-output 1200)))

(defun verify-conformance (decider-port command-port verify-command request
                           executor-message executor-output)
  "Decide whether this attempt fulfills the request, by two independent kinds of
evidence rather than by a model reading its own prose.

Mechanical: VERIFY-COMMAND is the repository's own check (build, tests, lint).
Its exit code is evidence no model can argue with — see the VP-CONTROL
measurement that evidence-source diversity is worth 40.9 points against 11.3 for
model diversity.

Spec: the local decider grades the diff against the frozen REQUEST, never
against the executor's narrative.

Both must pass. Either one alone is enough when the other is genuinely absent,
but an attempt backed by neither is rejected: no exit code and no decider means
nothing was actually checked, and reporting that as success is the failure this
replaces. Returns (values ok note)."
  (multiple-value-bind (verify-code verify-output)
      (run-verification command-port verify-command)
    (let* ((diff (and command-port
                      (ignore-errors (execute-command command-port "git diff --stat 2>/dev/null"))))
           (answers (decide decider-port
                            (conformance-state request executor-message
                                               executor-output diff verify-output)
                            (list (list :question
                                        "A mudanca de codigo neste attempt atende o pedido congelado acima, sem trabalho nao pedido e sem revertido?"
                                        :options '("sim" "nao")))))
           (choice (getf (first answers) :choice))
           (verdict (and (stringp choice) (string= choice "sim"))))
      (cond
       ;; Verification ran and failed: mechanical evidence is decisive.
       ((and verify-code (not (zerop verify-code)))
        (values nil (format nil "(verificacao: ~A saiu ~D — a correcao esta no transcript do comando)"
                            verify-command verify-code)))
       ;; Decider answered and said no: block even if the command passed,
       ;; because a green build is not the same as the ask.
       ((and answers (not verdict))
        (values nil (format nil "(spec: decider reprova, confianca ~,2F — o comando passou mas o diff nao atende o pedido)"
                            (or (getf (first answers) :confidence) 0.0d0))))
       ;; Both gates agree.
       ((and verdict (eql verify-code 0))
        (values t (format nil "(spec + verificacao: ~A saiu 0, decider ~,2F — pedido atendido)"
                          verify-command (or (getf (first answers) :confidence) 0.0d0))))
       ;; Spec gate only.
       (verdict
        (values t (format nil "(spec: decider ~,2F — sem comando de verificacao configurado ou sem exit code)"
                          (or (getf (first answers) :confidence) 0.0d0))))
       ;; Mechanical gate only: it ran and exited 0.
       ((eql verify-code 0)
        (values t (format nil "(verificacao: ~A saiu 0; sem decider)" verify-command)))
;; A command port that produced output but no parseable exit marker.
        ;; Silence is not a pass: the command could not prove anything, so this
        ;; attempt is rejected and told why.
        ((and verify-output (not (string= (trim verify-output) "")))
         (values nil (format nil "(verificacao: ~A; sem exit code observavel, entao sem evidencia — configure :verify-command para um comando com codigo de saida)"
                             verify-command)))
        ;; No verdict and no evidence at all. The old fallback accepted any
        ;; non-empty executor output; that is exactly the unverified claim this
        ;; gate exists to remove (ADR-0011), so an attempt with nothing behind it
        ;; is rejected instead.
        (t
         (values nil "(sem evidencia: nenhum comando de verificacao com codigo de saida rodou, e o decider nao respondeu — configure :verify-command ou o decider"))))))

;;;; Executor attempts and the final report.
;;;;
;;;; The loop lives in RUN-EXECUTOR-ATTEMPTS, separate from this function, so
;;;; neither one nests deeply enough to hide a paren mistake. That mistake is
;;;; the defect this file's self-test is here to prevent: the gate and the
;;;; closing report must see the same ACCEPTED and LAST-NOTE values, so they
;;;; are returned as multiple values instead of closed over.

(defun run-executor-attempts (mock provider provider-port rules request verify-command
                              decider-port executor-command-port output-port
                              notes-port session-port initial-history initial-feedback)
  "Run the executor until the gate accepts or *max-executor-attempts* is spent.
Returns two values: ACCEPTED-P and LAST-NOTE."
  ;; ACCEPTED and LAST-NOTE are bound by a LET, not by LOOP ... WITH: a WITH
  ;; binding dies with the loop, so the values the caller needs afterwards
  ;; would be unbound here.
  (let ((accepted nil)
        (last-note ""))
    (loop for attempt from 1 to *max-executor-attempts*
          with executor-message = ""
          with executor-output = ""
          with history = initial-history
          with feedback = initial-feedback
          do
          ;; Executor — a tool-calling agent in the project dir.
          (multiple-value-setq (executor-message executor-output)
            (run-executor mock provider-port provider rules request history
                          (notes-text notes-port) feedback executor-command-port
                          session-port))
          ;; Conformance: the repo's own command plus the frozen request, never
          ;; the executor's narrative alone.
          (multiple-value-bind (executor-ok verdict)
              (verify-conformance decider-port executor-command-port verify-command
                                  request executor-message executor-output)
            (setf last-note verdict)
            (render-turn output-port
                         (format nil "Executor(~A)" (getf provider :label))
                         executor-message "[tool chain]" executor-output)
            (render-turn output-port
                         "Validation"
                         (format nil "executor_ok=~A ~A"
                                 (if executor-ok "sim" "nao") verdict)
                         ""
                         "[no command]")
            (session-event session-port
                           (format nil "executor (~A)" (getf provider :label))
                           (if (string= (trim executor-message) "")
                               "(sem mensagem)"
                               executor-message))
            (unless (string= (trim executor-output) "")
              (session-event session-port "tool" executor-output))
            (session-event session-port
                           "validation"
                           (format nil "executor_ok=~A ~A"
                                   (if executor-ok "sim" "nao") verdict))
            (setf history
                  (format nil "~AMy action: ~A~%My command: [tool chain]~%My terminal result:~%~A~%"
                          history executor-message executor-output))
            (when executor-ok
              (setf accepted t)
              (return (values accepted last-note))))
          ;; On failure, feed the executor the actual reason plus the failing
          ;; command's own output, so a retry addresses the defect instead of
          ;; repeating the same attempt.
          (setf feedback
                (format nil "A tentativa anterior foi reprovada: ~A~%~
    O comando de verificacao do repo roda com~%  ~A~%e o texto abaixo e a sua saida.~
    Corrija a causa, nao o sintoma.~%~A"
                        last-note
                        (if (string= (trim (or verify-command "")) "")
                          "(nenhum comando de verificacao configurado)"
                          verify-command)
                      (tail-of executor-output 1500))))
    (values accepted last-note)))

(defun run-session (config provider provider-port executor-command-port decider-port
                    output-port notes-port prompt-port
                    &key cli mock session-port on-start)
  (let* ((rules (load-rules))
         (request (user-prompt prompt-port))
         (verify-command (verify-command config)))
    (when (string= (trim (or request "")) "")
      (error "no user request provided; pass --prompt or pipe it on stdin"))
    (when mock (setf *mock-step* 0))
    (unless cli
      (funcall (notes-port-start notes-port)))
    (when on-start (funcall on-start))
    ;; Chat-style Telegram: echo the request.
    (session-event session-port "voce" request)
    (session-event session-port
                   "forgepair"
                   (format nil "executor=~A" (getf provider :label)))
    (multiple-value-bind (accepted last-note)
        (run-executor-attempts mock provider provider-port rules request verify-command
                              decider-port executor-command-port output-port
                              notes-port session-port
                              "No executor action has happened yet." "")
      ;; Report what actually happened. Reporting success after every attempt
      ;; was rejected is the one failure mode a coding agent must never have.
      (if accepted
          (progn
            (format t "~&Concluido. Revise com: git diff~%")
            (session-event session-port "sessao" "concluida."))
          (progn
            (format t "~&Nao concluido: nenhuma das ~D tentativas passou na verificacao.~%Ultima reprovacao: ~A~%"
                    *max-executor-attempts* last-note)
            (session-event session-port
                           "sessao"
                           (format nil "nao concluida: ~A" last-note)))))))
