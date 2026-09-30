;;;; Application: the hexagonal use case orchestrator.
;;;;
;;;; Single role: executor. Works until done, validated by real evidence (git diff, exit codes).
;;;; No planner, no improver, no model swapping — those are commodity features per AGENTS.md rule 10.

(in-package :forgepair)

(defparameter *mock-step* 0)
(defparameter *max-tool-steps* 8
  "How many tool calls the executor may chain in a single run before the harness
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

(defun evidence-state (executor-message executor-output diff)
  "Build the text a decider (or a human) would read to judge whether real work
happened: the executor's own summary, the tail of its tool transcript (which
carries the [exit N] markers make-sandbox-command-port appends), and a git
diff taken in the project directory."
  (format nil "Executor message: ~A~%~%Tool transcript (tail):~%~A~%~%git diff --stat:~%~A"
          executor-message
          (let ((out (trim (or executor-output ""))))
            (if (> (length out) 2000) (subseq out (- (length out) 2000)) out))
          (trim (or diff ""))))

(defun validate-evidence (decider-port command-port executor-message executor-output)
  "Validate by real evidence. When a local decider is configured (see
make-local-decider-port), ask it a typed yes/no question grounded in a git
diff and the tool transcript, instead of guessing from a narrative — this is
rule 12 (judge by evidence, not a model guessing whether a role 'looked
busy'). Falls back to the non-empty-output heuristic when no decider answers
(llama-server not running, no .git in the work dir, etc.) so the session never
blocks on optional local infrastructure.
Returns (values executor-ok note)."
  (let* ((diff (and command-port
                    (ignore-errors (execute-command command-port "git diff --stat 2>/dev/null"))))
         (state (evidence-state executor-message executor-output diff))
         (answers (decide decider-port state
                          (list (list :question
                                      "O diff e o transcript mostram trabalho real: mudancas de codigo nao vazias, nao apenas leitura, e nao revertidas?"
                                      :options '("sim" "nao"))))))
    (if answers
        (let ((answer (first answers)))
          (values (string= (getf answer :choice) "sim")
                  (format nil "(decider: ~A, confianca ~,2F)"
                          (getf answer :choice) (or (getf answer :confidence) 0.0d0))))
        (values (and executor-output (not (string= (trim executor-output) "")))
                "(heuristica: saida do executor nao-vazia; decider indisponivel)"))))

(defun run-session (config provider provider-port executor-command-port decider-port
                    output-port notes-port prompt-port
                    &key cli mock session-port on-start)
  (let* ((rules (slurp (merge-pathnames "AGENTS.md" *root*)))
         (request (user-prompt prompt-port))
         (history "No executor action has happened yet.")
         (feedback "")
         (notes-port-started nil))
    (when (string= (trim (or request "")) "")
      (error "no user request provided; pass --prompt or pipe it on stdin"))
    (when mock (setf *mock-step* 0))
    (unless cli
      (funcall (notes-port-start notes-port))
      (setf notes-port-started t))
    (when on-start (funcall on-start))
    ;; Chat-style Telegram: echo the pedido
    (session-event session-port "voce" request)
    (session-event session-port "forgepair"
                   (format nil "executor=~A" (getf provider :label)))
    ;; Single executor loop until done or evidence validates
    (loop for attempt from 1 to 3
          with executor-message = "" with executor-output = ""
          do
          ;; Executor — a tool-calling agent in the project dir.
          (multiple-value-setq (executor-message executor-output)
            (run-executor mock provider-port provider rules request history
                          (notes-text notes-port) feedback executor-command-port session-port))
          ;; Validate by evidence (git diff, exit codes; local decider if configured)
          (multiple-value-bind (executor-ok note)
              (validate-evidence decider-port executor-command-port
                                 executor-message executor-output)
            (render-turn output-port
                         (format nil "Executor(~A)" (getf provider :label))
                         executor-message "[tool chain]" executor-output)
            (render-turn output-port "Validation"
                         (format nil "executor_ok=~A ~A"
                                 (if executor-ok "sim" "nao") note)
                         "" "[no command]")
            (session-event session-port
                           (format nil "executor (~A)" (getf provider :label))
                           (if (string= (trim executor-message) "")
                               "(sem mensagem)" executor-message))
            (unless (string= (trim executor-output) "")
              (session-event session-port "tool" executor-output))
            (session-event session-port "validation"
                           (format nil "executor_ok=~A ~A"
                                   (if executor-ok "sim" "nao") note))
            (setf history (format nil "~AMy action: ~A~%My command: [tool chain]~%My terminal result:~%~A~%"
                                  history executor-message executor-output))
            (when executor-ok
              (return)))
          ;; On failure, feedback to executor for retry
          (setf feedback "A execucao nao produziu resultado valido. Tente novamente.")))
    (format t "~&Concluido. Revise com: git diff~%")
    (session-event session-port "sessao" "concluida."))
