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
  (let ((cli nil) (mock nil) (turns nil) (list-providers nil) (prompt nil)
        (telegram-test nil) (verify-models nil))
    (loop while args do
      (let ((arg (pop args)))
        (cond ((string= arg "--cli") (setf cli t))
              ((string= arg "--mock") (setf mock t cli t))
              ((string= arg "--prompt")
               (unless args (error "--prompt requires a request string"))
               (setf prompt (pop args)))
              ((string= arg "--telegram-test") (setf telegram-test t cli t))
              ((string= arg "--verify-models") (setf verify-models t cli t))
              ((string= arg "--list-providers") (setf list-providers t cli t))
              ((string= arg "--turns")
               (unless args (error "--turns requires a positive integer"))
               (setf turns (parse-integer (pop args))))
              ((or (string= arg "--help") (string= arg "-h"))
               (format t "Usage: bin/forgepair [--prompt REQUEST] [--cli] [--mock] [--telegram-test] [--verify-models] [--list-providers] [--turns N]~%~
Model selection is automatic: the planner picks the best available model from the Akita coding tier, the executor (model A) is chosen by best cost-benefit and works in the project folder where the binary was opened, and the improver (model B, best capability) works only on the Forgepair repo.~%")
               (sb-ext:exit :code 0))
              (t (error "unknown option: ~A" arg)))))
        (list :cli cli :mock mock :turns-override turns
          :prompt prompt :telegram-test telegram-test :verify-models verify-models
          :list-providers list-providers)))

(defun print-provider-catalogs (credentials)
  (dolist (provider *model-providers*)
    (handler-case
        (let ((models (list-provider-models provider credentials)))
          (format t "~&/~A (~D modelos):~%  ~{~A~^~%  ~}~%"
                  (getf provider :name) (length models) (subseq models 0 (min 20 (length models)))))
      (error (condition)
        (format t "~&/~A: indisponivel (~A)~%" (getf provider :name) condition)))))

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
    (assert (search "improver meta-agent" (improver-system "do X" "rules")))
    (assert (search "Forgepair repository" (improver-system "do X" "rules")))
    (assert (search "planner" (planner-system "do X" "rules")))
    (assert (search "User request" (action-prompt "do X" "history" "")))
    (assert (search "validation object" (planner-prompt "r" "m" "c" "o" "i" "ic" "io")))
    ;; Planner validation object parses booleans.
    (let ((pv (extract-object "{\"executor_ok\":true,\"improver_ok\":false,\"note\":\"x\"}")))
      (assert (eq (field "executor_ok" pv) t))
      (assert (null (field "improver_ok" pv)))
      (assert (string= (field "note" pv) "x")))
    (assert (string= (getf (provider-definition "groq") :key-env) "GROQ_API_KEY"))
    (assert (string= (getf (provider-definition "gemini") :key-env) "GEMINI_API_KEY"))
    (assert (member "qwen/qwen3.8-27b" (getf (provider-definition "groq") :models)
            :test #'string=))
    (assert (member "nvidia/nemotron-3.5-lightning-30b-a3b"
            (getf (provider-definition "nvidia") :models)
            :test #'string=))
    ;; Akita tier: entries are well-formed, have score+cost, map to real providers.
    (assert (plusp (length *akita-tier*)))
    (dolist (entry *akita-tier*)
      (assert (provider-definition (getf entry :provider)))
      (assert (getf entry :model))
      (assert (getf entry :label))
      (assert (numberp (getf entry :score)))
      (assert (numberp (getf entry :cost))))
    ;; The tier entry's model must override the provider default via getf.
    (let ((rp (tier-entry->role-provider (first *akita-tier*) :executor)))
      (assert (string= (getf rp :model) (getf (first *akita-tier*) :model))))
    ;; cost-benefit favours higher score per cost.
    (assert (> (cost-benefit (list :score 80 :cost 1))
               (cost-benefit (list :score 88 :cost 5))))
    ;; Planner-driven selection: three roles + a pool for swapping.
    (let ((creds (%make-credential-port
                  :get (lambda (name)
                         (if (member name '("GROQ_API_KEY" "NVIDIA_API_KEY")
                                     :test #'string=)
                             "x"
                             (error "missing ~A" name))))))
      (multiple-value-bind (planner executor improver pool) (auto-select-roles creds)
        (assert (string= (getf planner :name) "planner"))
        (assert (string= (getf executor :name) "executor"))
        (assert (string= (getf improver :name) "improver"))
        ;; Planner must be the top of the available tier (highest score).
        (let ((top-score (reduce #'max pool :key (lambda (e) (or (getf e :score) 0)))))
          (assert (= (or (getf planner :score) 0) top-score)))
        ;; Pool must be non-empty and contain well-formed entries.
        (assert (plusp (length pool)))
        (assert (getf executor :model))
        (assert (getf improver :model))
        ;; swap-model for :executor returns a role-named provider.
        (let ((swapped (swap-model executor :executor pool)))
          (assert (string= (getf swapped :name) "executor")))
        ;; swap-model for :improver returns a role-named provider.
        (let ((swapped (swap-model improver :improver pool)))
          (assert (string= (getf swapped :name) "improver")))
        ;; A later validation failure must not cycle back to a rejected model.
        (let* ((first-swap (swap-model executor :executor pool))
               (second-swap (swap-model first-swap :executor pool
                                        :exclude-models
                                        (list (getf executor :model)
                                              (getf first-swap :model)))))
          (assert (not (string= (getf second-swap :model)
                                (getf executor :model)))))))
    ;; Available entries are ranked by score, even when the curated source
    ;; list is not in score order.
    (let ((creds (%make-credential-port
                  :get (lambda (name)
                         (if (member name '("GEMINI_API_KEY" "NVIDIA_API_KEY")
                                     :test #'string=)
                             "x"
                             (error "missing ~A" name))))))
      (multiple-value-bind (planner executor improver pool) (auto-select-roles creds)
        (declare (ignore executor improver))
        (assert (= (getf planner :score)
                   (reduce #'max pool :key (lambda (entry) (getf entry :score)))))))
    ;; With a single provider credential, selection still yields all roles (the
    ;; planner may reuse a provider when the pool is small).
    (let ((solo (%make-credential-port
                 :get (lambda (name)
                        (if (string= name "GROQ_API_KEY") "x" (error "missing ~A" name))))))
      (multiple-value-bind (planner executor improver pool) (auto-select-roles solo)
        (assert (getf planner :model))
        (assert (getf executor :model))
        (assert (getf improver :model))
        (assert (plusp (length pool)))))
    ;; No distinct-provider rule: executor/improver come from the whole rest
    ;; pool ranked purely by cost-benefit / score, not filtered by provider.
    (let ((groq-nvidia (%make-credential-port
                        :get (lambda (name)
                               (if (member name '("GROQ_API_KEY" "NVIDIA_API_KEY")
                                           :test #'string=)
                                   "x"
                                   (error "missing ~A" name))))))
      (multiple-value-bind (planner executor improver pool) (auto-select-roles groq-nvidia)
        (let ((rest (remove (getf planner :model) pool :key (lambda (e) (getf e :model))
                            :test #'string=)))
          (let ((best-cb (reduce #'max rest :key #'cost-benefit))
                (best-score (reduce #'max rest
                                    :key (lambda (e) (or (getf e :score) 0)))))
            (assert (= (cost-benefit executor) best-cb))
            (assert (= (or (getf improver :score) 0) best-score))))))
    ;; No credentials at all must fail with a clear error.
    (let ((none (%make-credential-port :get (lambda (name) (error "missing ~A" name)))))
      (assert (nth-value 1 (ignore-errors (auto-select-roles none)))))
    (let ((entry (list (cons "modified_at"
                 (format nil "~D-01-01T00:00:00Z" (current-year))))))
      (assert (= (model-year entry) (current-year))))
    (format t "forgepair self-test: ok~%")))

(defun run-entrypoint ()
  (handler-case
      (let ((args (cdr sb-ext:*posix-argv*)))
        (if (member "--self-test" args :test #'string=)
            (self-test)
            (let* ((options (parse-options args))
                   (credentials (make-credential-port (load-dotenv))))
              (ensure-directories-exist *runtime*)
              (cond
                ((getf options :telegram-test)
                 (telegram-test credentials))
                ((getf options :verify-models)
                 (verify-models credentials))
                ((getf options :list-providers)
                 (print-provider-catalogs credentials))
                (t
                 (let ((config (load-config)))
                   (multiple-value-bind (planner executor improver pool)
                       (auto-select-roles credentials)
                     (format t "~&Selecao automatica (tier Akita):~%  planner=~A (~A)~%  executor A=~A (~A)~%  improver B=~A (~A)~%"
                             (getf planner :label) (getf planner :model)
                             (getf executor :label) (getf executor :model)
                             (getf improver :label) (getf improver :model))
                     (let* ((session-config (list :mode :pipeline :turns (getf config :turns)))
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
                                            (make-cli-output-port))))
                       (when tg-token
                         (format t "~&Telegram: modo chat ativo — cada turno vira uma nova mensagem.~%")
                         (force-output))
                       (unwind-protect
                            (apply #'run-session
                                   session-config
                                   planner executor improver pool
                                   (make-http-provider-port credentials)
                                   (make-sandbox-command-port *work-dir*)
                                   (make-sandbox-command-port *root*)
                                   output-port
                                   (make-notes-port)
                                   prompt-port
                                   (list :cli (getf options :cli)
                                         :mock (getf options :mock)
                                         :turns-override (getf options :turns-override)
                                         :session-port nil
                                         :on-start (lambda ()
                                                      (telegram-notify
                                                       tg-token tg-chat-id-fn
                                                       (format nil
                                                               "Forgepair ativo~%Planner: ~A~%Executor A: ~A~%Improver B: ~A~%Turnos: ~A"
                                                               (getf planner :label)
                                                               (getf executor :label)
                                                               (getf improver :label)
                                                               (or (getf config :turns) 6))))))
                         ;; Cleanup: runs on normal end, error, or Ctrl-C.
                         (telegram-notify tg-token tg-chat-id-fn
                                          "Forgepair encerrado."))))))))))
     (sb-sys:interactive-interrupt (e)
      (declare (ignore e))
      (format t "~&Interrompido.~%")
      (sb-ext:exit :code 0))
    (error (condition) (fail "~A" condition))))

(run-entrypoint)
