;;;; Composition root: wire adapters to the application and expose the CLI.

(load (merge-pathnames "package.lisp" (make-pathname :defaults *load-truename*)))
(load (merge-pathnames "domain.lisp" (make-pathname :defaults *load-truename*)))
(load (merge-pathnames "ports.lisp" (make-pathname :defaults *load-truename*)))
(load (merge-pathnames "providers.lisp" (make-pathname :defaults *load-truename*)))
(load (merge-pathnames "adapters.lisp" (make-pathname :defaults *load-truename*)))
(load (merge-pathnames "application.lisp" (make-pathname :defaults *load-truename*)))

(in-package :forgepair)

(defun load-config ()
  (let ((path (merge-pathnames "config.sexp" *root*)))
    (unless (probe-file path) (error "copy config.example.sexp to config.sexp"))
    (with-open-file (in path) (read in))))

(defun parse-options (args)
  (let ((cli nil) (mock nil) (prompt nil) (telegram-test nil))
    (loop while args do
      (let ((arg (pop args)))
        (cond ((string= arg "--cli") (setf cli t))
              ((string= arg "--mock") (setf mock t cli t))
              ((string= arg "--prompt")
               (unless args (error "--prompt requires a request string"))
               (setf prompt (pop args)))
              ((string= arg "--telegram-test") (setf telegram-test t cli t))
              ((or (string= arg "--help") (string= arg "-h"))
               (format t "Usage: forgepair.sh [--prompt REQUEST] [--cli] [--mock] [--telegram-test]~%~
Single provider from config.sexp. The executor works in the project folder where the binary was opened.~%~
Optional local decider (evidence-based validation): set DECIDER_URL or run~%~
llama-server on the default http://127.0.0.1:8080/completion; see docs/decider.md.~%")
               (sb-ext:exit :code 0))
              (t (error "unknown option: ~A" arg)))))
    (list :cli cli :mock mock
          :prompt prompt :telegram-test telegram-test)))

(defun self-test ()
  (let* ((document (parse-json "{\"s\":\"line\\ntext\",\"a\":[true,false,null,3]}"))
         (action (extract-object "```json\n{\"message\":\"ok\",\"command\":\"\"}\n```"))
         (improve (extract-object "reasoning...\n{\"improvement\":\"tighten prompt\",\"rationale\":\"user asked twice\",\"command\":\"\"}")))
    (assert (string= (field "s" document) (format nil "line~%text")))
    (assert (= (fourth (field "a" document)) 3))
    (assert (string= (field "message" action) "ok"))
    (assert (string= (field "improvement" improve) "tighten prompt"))
    (assert (string= (field "rationale" improve) "user asked twice"))
    (assert (search "executor coding agent" (executor-system "do X" "rules")))
    (assert (search "User request" (action-prompt "do X" "history" "")))
    ;; Provider config from defaults
    (let ((provider (provider-definition nil)))
      (assert (string= (getf provider :key-env) "OPENROUTER_API_KEY"))
      (assert (string= (getf provider :model) "deepseek/deepseek-v4.1-flash")))
    ;; Decider: prompt shape and graceful degradation with no server configured
    (let ((prompt (decider-prompt "state text" "pergunta?" '("sim" "nao"))))
      (assert (search "Question: pergunta?" prompt))
      (assert (search "(A) sim" prompt))
      (assert (search "(B) nao" prompt))
      (assert (search "Answer: (" prompt)))
    (multiple-value-bind (ok note)
        (validate-evidence nil nil "fiz algo" "saida nao vazia")
      (assert ok)
      (assert (search "heuristica" note)))
    (multiple-value-bind (ok note)
        (validate-evidence nil nil "" "")
      (declare (ignore note))
      (assert (not ok)))
    (format t "forgepair self-test: ok~%")))

(defun run-entrypoint ()
  (handler-case
      (let ((args (cdr sb-ext:*posix-argv*)))
        (if (member "--self-test" args :test #'string=)
            (self-test)
            (let* ((options (parse-options args))
                   (credentials (make-credential-port (load-dotenv)))
                   (config (load-config))
                   (provider (provider-definition config)))
              (ensure-directories-exist *runtime*)
              (cond
                ((getf options :telegram-test)
                 (telegram-test credentials))
                (t
                 (format t "~&Provider: ~A (~A)~%"
                         (getf provider :label) (getf provider :model))
                 (let* ((session-config (list :mode :single))
                        (tg-token (handler-case
                                      (funcall (credential-port-get credentials)
                                               "TELEGRAM_BOT_TOKEN")
                                    (error () nil)))
                        ;; Prompt port: Telegram (lazy) or CLI/stdin.
                        (tg-prompt-plist (and tg-token (make-telegram-prompt-port tg-token)))
                        (tg-prompt-port  (and tg-prompt-plist
                                              (getf tg-prompt-plist :prompt-port)))
                        (tg-chat-id-fn   (and tg-prompt-plist
                                              (getf tg-prompt-plist :chat-id-fn)))
                        (prompt-port (if (getf options :prompt)
                                        (make-prompt-port (getf options :prompt))
                                        (or tg-prompt-port (make-prompt-port nil))))
                        ;; Output: always CLI; fan to Telegram when token present.
                        (tg-out-port (and tg-token tg-chat-id-fn
                                         (make-telegram-output-port tg-token tg-chat-id-fn)))
                        (output-port (if tg-out-port
                                        (make-combined-output-port
                                         (make-cli-output-port) tg-out-port)
                                        (make-cli-output-port)))
                        ;; Session: the SAME Telegram chat as the output.
                        (session-port (and tg-token tg-chat-id-fn
                                          (make-telegram-session-port tg-token
                                                                      tg-chat-id-fn)))
                        ;; Local decider (evidence-based validation). Opt-in and
                        ;; silent: if nothing answers at decider-url, validate-
                        ;; evidence falls back to its non-decider heuristic.
                        (decider-port (make-local-decider-port (decider-url credentials))))
                   (when tg-token
                     (format t "~&Telegram: modo chat ativo — a conversa (voce, turnos e ferramentas) vai para o mesmo chat.~%")
                     (force-output))
                   (unwind-protect
                        (apply #'run-session
                               session-config
                               provider
                               (make-http-provider-port credentials)
                               (make-sandbox-command-port *work-dir*)
                               decider-port
                               output-port
                               (make-notes-port)
                               prompt-port
                               (list :cli (getf options :cli)
                                     :mock (getf options :mock)
                                     :session-port session-port
                                     :on-start (lambda ()
                                                 (telegram-notify
                                                  tg-token tg-chat-id-fn
                                                  (format nil
                                                          "Forgepair ativo~%Executor: ~A"
                                                          (getf provider :label))))))
                     ;; Cleanup: runs on normal end, error, or Ctrl-C.
                     (telegram-notify tg-token tg-chat-id-fn
                                      "Forgepair encerrado."))))))))
    (sb-sys:interactive-interrupt (e)
      (declare (ignore e))
      (format t "~&Interrompido.~%")
      (sb-ext:exit :code 0))
    (error (c) (fail "~A" c))))

(run-entrypoint)
