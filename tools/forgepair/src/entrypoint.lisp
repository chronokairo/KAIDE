;;;; Composition root: wire adapters to the application and expose the CLI.

(load (merge-pathnames "package.lisp" (make-pathname :defaults *load-truename*)))
(load (merge-pathnames "domain.lisp" (make-pathname :defaults *load-truename*)))
(load (merge-pathnames "ports.lisp" (make-pathname :defaults *load-truename*)))
(load (merge-pathnames "providers.lisp" (make-pathname :defaults *load-truename*)))
(load (merge-pathnames "models.lisp" (make-pathname :defaults *load-truename*)))
(load (merge-pathnames "adapters.lisp" (make-pathname :defaults *load-truename*)))
(load (merge-pathnames "application.lisp" (make-pathname :defaults *load-truename*)))

(in-package :forgepair)

(defun load-config (&optional (dir *project-root*))
  "Read config.sexp for the project at DIR, falling back to the installation's.
Searching the project first is what makes Forgepair behave like the terminal
agents: each repository declares its own provider and its own verify command
instead of inheriting the ones baked into the installed program."
  (let ((path (find-project-file "config.sexp" dir)))
    (unless path
      (error "no config.sexp found; copy config.example.sexp to the project you opened"))
    (with-open-file (in path) (read in))))

(defun load-rules (&optional (dir *project-root*))
  "The constitution sent to the models: the project's own AGENTS.md when it has
one, otherwise Forgepair's. A project that writes its own rules gets them used;
one that does not still gets the shipped constitution rather than nothing."
  (let ((path (find-project-file "AGENTS.md" dir)))
    (cond (path (slurp path))
          ((probe-file (merge-pathnames "AGENTS.md" *root*))
           (slurp (merge-pathnames "AGENTS.md" *root*)))
          (t ""))))

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

;; A decider that always answers the same way, so the gate's combining rules
;; can be tested without a real model.
(defun make-verdict-port ()
  (lambda (choice confidence)
    (make-decider-port
     :call (lambda (state questions)
             (declare (ignore state questions))
             (list (list :question "?" :choice choice
                         :confidence confidence))))))

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
    ;; Verify command resolution: explicit config wins, else the default
    (assert (string= (verify-command '(:verify-command "make test")) "make test"))
    (assert (string= (verify-command '(:verify-command "")) ""))
    ;; Decider: prompt shape
    (let ((prompt (decider-prompt "state text" "pergunta?" '("sim" "nao"))))
      (assert (search "Question: pergunta?" prompt))
      (assert (search "(A) sim" prompt))
      (assert (search "(B) nao" prompt))
      (assert (search "Answer: (" prompt)))
    ;; Exit-code extraction from the sandbox marker
    (assert (= (command-exit-code "saida\n[exit 0]") 0))
    (assert (= (command-exit-code "a\n[exit 3]\n[exit 7]") 7))
    (assert (= (command-exit-code "sobrou\n[exit 126]") 126))
    (assert (null (command-exit-code "sem marcador")))
    (assert (null (command-exit-code "")))
    (assert (null (command-exit-code nil)))
    ;; An attempt with neither an exit code nor a decider is rejected: the old
    ;; "non-empty output means success" fallback is what ADR-0011 removed.
    (multiple-value-bind (ok note)
        (verify-conformance nil nil nil "fazer X" "fiz algo" "saida nao vazia")
      (assert (not ok))
      (assert (search "sem evidencia" note)))
    (multiple-value-bind (ok note)
        (verify-conformance nil nil nil "fazer X" "" "")
      (declare (ignore note))
      (assert (not ok)))
    ;; Output without an exit marker is not a pass either.
    (multiple-value-bind (ok note)
        (verify-conformance nil (make-command-port
                                 :execute (lambda (c)
                                            (declare (ignore c))
                                            "compilou mas nao sei se passou"))
                             "make test" "fazer X" "mudei" "saida")
      (assert (not ok))
      (assert (search "sem exit code observavel" note)))
;; A failing verify command blocks even with no decider configured.
    (let ((failing (make-command-port
                    :execute (lambda (command)
                               (if (search "git diff" command)
                                   "src/x.lisp | 2 +-\n[exit 0]"
                                   "boom: undefined function\n[exit 1]")))))
      (multiple-value-bind (ok note)
          (verify-conformance nil failing "sbcl --load test"
                              "fazer X" "mudei" "saida")
        (assert (not ok))
        (assert (search "verificacao" note))
        (assert (search "saiu 1" note))))
    ;; A passing verify command is accepted with no decider.
    (let ((passing (make-command-port
                    :execute (lambda (command)
                               (if (search "git diff" command)
                                   "src/x.lisp | 2 +-\n[exit 0]"
                                   "ok\n[exit 0]")))))
      (multiple-value-bind (ok note)
          (verify-conformance nil passing "sbcl --load test"
                              "fazer X" "mudei" "saida")
        (assert ok)
        (assert (search "verificacao" note)))
      ;; A decider that rejects the spec blocks an otherwise green command.
      (let ((verdict (make-verdict-port)))
        (multiple-value-bind (ok note)
            (verify-conformance (funcall verdict "nao" 0.91) passing
                                "sbcl --load test" "fazer X" "mudei" "saida")
          (assert (not ok))
          (assert (search "spec" note))
          (assert (search "0.91" note)))
        ;; Both agreeing is the only path to accepted.
        (multiple-value-bind (ok note)
            (verify-conformance (funcall verdict "sim" 0.88) passing
                                "sbcl --load test" "fazer X" "mudei" "saida")
          (assert ok)
          (assert (search "atendido" note)))
        ;; A decider alone accepts, since there is no verify command to run.
        (multiple-value-bind (ok note)
            (verify-conformance (funcall verdict "sim" 0.8) nil ""
                                "fazer X" "mudei" "saida")
          (assert ok)
          (assert (search "spec" note)))
        ;; A decider that stays silent does not veto a green command.
        (multiple-value-bind (ok note)
            (verify-conformance (make-decider-port
                                 :call (lambda (s q)
                                         (declare (ignore s q))
                                         nil))
                                passing "sbcl --load test"
                                "fazer X" "mudei" "saida")
          (assert ok)
          (assert (search "sem decider" note)))))

    ;; verify-command never guesses: no config means no command, and the
    ;; default is nil precisely so another repo's gate is never assumed.
    (assert (string= "" (verify-command nil)))
    (assert (null *default-verify-command*))
    (assert (string= "make test" (verify-command '(:verify-command "make test"))))

    ;; --- Installed-agent behaviour: work in the folder you opened ---
    ;; These assertions fail on the pre-fix code. load-config read
    ;; config.sexp from *root* (the install directory), so running Forgepair
    ;; inside another repo silently used Forgepair's own :verify-command and
    ;; its own .env. A PATH-installed agent must read the project it was
    ;; invoked in, not the directory it happens to live in.
    (let ((project (make-temp-project "self-test-project")))
      (unwind-protect
           (progn
             (write-project-file project "config.sexp" "(:verify-command \"project-gate\")")
             (assert (string= (verify-command (load-config project)) "project-gate"))
             ;; A project without its own config falls back to the install one.
             (let ((bare (make-temp-project "self-test-bare")))
               (unwind-protect
                    (progn
                      (assert (string= (verify-command (load-config bare))
                                       (verify-command (load-config *root*)))))
                 (delete-directory bare :recursive t)))
             ;; Project rules win; install rules are the fallback, never the
             ;; only source (otherwise every repo inherits Forgepair's
             ;; constitution and the project's own AGENTS.md is ignored).
             (write-project-file project "AGENTS.md" "project rules")
             (assert (string= (load-rules project) "project rules"))
             (assert (> (length (load-rules *root*)) 0))
             ;; A project with no AGENTS.md still gets the shipped constitution.
             (let ((bare (make-temp-project "self-test-bare")))
               (unwind-protect
                    (progn (assert (> (length (load-rules bare)) 0)))
                 (delete-directory bare :recursive t)))
        (delete-directory project :recursive t))))

    ;; Project root is discovered by walking up, the way git and npm do, so
    ;; running the agent in a subdirectory still edits the whole project.
    (let* ((project (make-temp-project "self-test-root"))
           (nested (merge-pathnames "src/deep/" project)))
      (unwind-protect
           (progn
             (ensure-directories-exist nested)
             (ensure-directories-exist (merge-pathnames ".forgepair/probe" project))
             (assert (string= (namestring (truename project))
                              (namestring (truename
                                           (resolve-project-root
                                            (namestring (truename nested))))))))
        (delete-directory project :recursive t)))

    ;; --- Dynamic model consumption with a 24h cache ---
    (assert (string= "https://openrouter.ai/api/v1/models"
                     (models-endpoint '(:url "https://openrouter.ai/api/v1/chat/completions"))))
    (assert (string= "http://127.0.0.1:1234/v1/models"
                     (models-endpoint '(:url "http://127.0.0.1:1234/v1/chat/completions"))))
    ;; An explicit :models-url wins, for providers whose listing is elsewhere.
    (assert (string= "https://x.test/list"
                     (models-endpoint '(:url "https://x.test/v1/chat/completions"
                                        :models-url "https://x.test/list"))))

    ;; Fresh for 24h, stale after. The TTL is the point of the cache: a stale
    ;; entry must still be usable when the network is down, never silently
    ;; dropped.
    (let ((now (get-universal-time)))
      (assert (cache-fresh-p now))
      (assert (cache-fresh-p (- now 86399)))
      (assert (not (cache-fresh-p (- now 86401))))
      (assert (not (cache-fresh-p nil))))

    ;; Alias resolution: OpenRouter serves variant suffixes (:free, :thinking)
    ;; and canonical slugs separately, so a configured variant resolves to the
    ;; real entry instead of looking "not found".
    (let ((catalog (list (list (cons "id" "acme/thinker"))
                         (list (cons "id" "acme/thinker:free")))))
      (assert (string= "acme/thinker" (resolve-model "acme/thinker:free" catalog)))
      (assert (string= "acme/thinker" (resolve-model "acme/thinker" catalog)))
      ;; Unknown ids are returned as configured: Forgepair must not invent or
      ;; substitute a model (rule 13 - no routing, no catalogue).
      (assert (string= "acme/ghost" (resolve-model "acme/ghost" catalog)))
      ;; No catalogue at all (offline, first run) leaves the model untouched.
      (assert (string= "acme/thinker" (resolve-model "acme/thinker" nil))))

    ;; Deprecation is visible before the first token is spent.
    (let ((catalog (list (list (cons "id" "acme/old")
                               (cons "deprecation_date" "2026-12-01"))
                         (list (cons "id" "acme/new")))))
      (assert (model-deprecated-p "acme/old" catalog))
      (assert (not (model-deprecated-p "acme/new" catalog)))
      ;; Tools support: unknown is not "unsupported".
      (assert (model-supports-tools-p "acme/new" nil))
      (assert (model-supports-tools-p
               "acme/new"
               (list (list (cons "id" "acme/new")
                           (cons "supported_parameters" (list "tools" "json"))))))
      (assert (not (model-supports-tools-p
                    "acme/new"
                    (list (list (cons "id" "acme/new")
                                (cons "supported_parameters" (list "json"))))))))

    ;; The catalogue survives a round trip through the cache file, which is what
    ;; makes the 24h TTL worth anything: the fetch happens once, not per request.
    (let* ((path (merge-pathnames "forgepair-cache-test/" *cache-dir*))
           (cache-path (merge-pathnames "roundtrip.json" path)))
      (unwind-protect
           (progn
             (ensure-directories-exist cache-path)
             (with-open-file (out cache-path :direction :output :if-exists :supersede)
               (write-string
                (format nil "{\"fetched_at\":~D,\"data\":[{\"id\":\"acme/a\",\"deprecation_date\":null,\"supported_parameters\":[\"tools\"],\"context_length\":4096,\"pricing\":{\"prompt\":\"0\"}}]}"
                        (get-universal-time))
                out))
             (multiple-value-bind (catalog fetched-at)
                 (handler-case
                     (let* ((document (parse-json (slurp cache-path)))
                            (data (field "data" document)))
                       (values data (field "fetched_at" document)))
                   (error () (values nil nil)))
               (assert (consp catalog))
               (assert (cache-fresh-p fetched-at))
               (assert (string= "acme/a" (field "id" (first catalog))))
               (assert (model-supports-tools-p "acme/a" catalog))))
        (delete-directory path :recursive t)))

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
