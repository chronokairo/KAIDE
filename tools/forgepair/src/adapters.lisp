;;;; Adapters: filesystem, curl, Bubblewrap, terminal and dotenv integrations.

(in-package :forgepair)

(defun fail (format-control &rest args)
  (apply #'format *error-output* (concatenate 'string "forgepair: " format-control "~%") args)
  (sb-ext:exit :code 1))

(defun slurp (path)
  (with-open-file (in path :direction :input)
    (with-output-to-string (out)
      (let ((buffer (make-string 4096)))
        (loop for count = (read-sequence buffer in)
              while (plusp count) do (write-string buffer out :end count))))))

(defun spit (path text)
  (ensure-directories-exist path)
  (with-open-file (out path :direction :output :if-exists :supersede
                            :if-does-not-exist :create)
    (write-string text out)))

(defun run-process (program args &key output error)
  (let ((process (sb-ext:run-program program args :search t :wait t
                                     :output (or output *standard-output*)
                                     :error (or error *error-output*))))
    (sb-ext:process-exit-code process)))

(defun load-dotenv (&optional (path (merge-pathnames ".env" *root*)))
  (let ((values nil))
    (when (probe-file path)
      (with-open-file (in path)
        (loop for raw = (read-line in nil nil) while raw
              for line = (trim raw)
              unless (or (string= line "") (char= (char line 0) #\#)) do
                (let ((equals (position #\= line)))
                  (when equals
                    (let* ((key (trim (subseq line 0 equals)))
                           (value (trim (subseq line (1+ equals)))))
                      (when (and (> (length value) 1)
                                 (member (char value 0) '(#\" #\'))
                                 (char= (char value 0) (char value (1- (length value)))))
                        (setf value (subseq value 1 (1- (length value)))))
                      (push (cons key value) values)))))))
    values))

(defun make-credential-port (&optional (dotenv (load-dotenv)))
  (%make-credential-port
   :get (lambda (name)
          (let ((value (or (sb-ext:posix-getenv name)
                           (cdr (assoc name dotenv :test #'string=)))))
            (if (and value (> (length value) 0)) value
                (error "credential ~A is missing" name))))))

(defun make-http-provider-port (credentials)
  (make-provider-port
   :call (lambda (provider system user)
           (let* ((url (getf provider :url))
                  (key (funcall (credential-port-get credentials) (getf provider :key-env)))
                  (request (merge-pathnames "request.json" *runtime*))
                  (response (merge-pathnames "response.json" *runtime*))
                  (err (merge-pathnames "curl.err" *runtime*)))
             (spit request
                   (format nil "{\"model\":~A,\"temperature\":0.2,\"max_tokens\":1024,\"messages\":[{\"role\":\"system\",\"content\":~A},{\"role\":\"user\",\"content\":~A}]}"
                           (json-string (getf provider :model))
                           (json-string system) (json-string user)))
             (with-open-file (out response :direction :output :if-exists :supersede :if-does-not-exist :create)
               (with-open-file (error-stream err :direction :output :if-exists :supersede :if-does-not-exist :create)
                 (unless (zerop (run-process "curl"
                                             (list "--fail-with-body" "--silent" "--show-error"
                                                   "--retry" "3" "--retry-all-errors" "--retry-delay" "2"
                                                   "--connect-timeout" "20" "--max-time" "180"
                                                   "-H" (format nil "Authorization: Bearer ~A" key)
                                                   "-H" "Content-Type: application/json" "--data-binary"
                                                   (format nil "@~A" (namestring request)) url)
                                             :output out :error error-stream))
                   (error "provider request failed: ~A~%~A" (slurp error-stream) (slurp response)))))
             (let* ((document (parse-json (slurp response)))
                    (choice (first (field "choices" document)))
                    (message (field "message" choice))
                    (content (field "content" message))
                    (reasoning (field "reasoning" message)))
               ;; Reasoning models sometimes leave content empty (all budget spent
               ;; on the reasoning field). Fall back to reasoning so the protocol
               ;; extractor can still find a JSON object; never signal here.
               (cond ((and content (> (length content) 0)) content)
                     ((and reasoning (> (length reasoning) 0)) reasoning)
                     (t "")))))))

(defun list-provider-models (provider credentials)
  "Return the researched current-year snapshot, with live /models fallback."
  (or (getf provider :models)
      (let* ((key (funcall (credential-port-get credentials) (getf provider :key-env)))
             (response (merge-pathnames "models.json" *runtime*)))
        (with-open-file (out response :direction :output :if-exists :supersede
                             :if-does-not-exist :create)
          (unless (zerop (run-process "curl"
                                      (list "--fail-with-body" "--silent" "--show-error"
                                            "--connect-timeout" "20" "--max-time" "60"
                                            "-H" (format nil "Authorization: Bearer ~A" key)
                                            (getf provider :models-url))
                                      :output out))
            (error "provider model catalog request failed for ~A" (getf provider :name))))
        (let* ((document (parse-json (slurp response)))
               (entries (remove-if-not #'current-year-model-p
                                       (or (field "data" document)
                                           (field "models" document)))))
          (remove nil
                  (mapcar (lambda (entry)
                            (or (field "id" entry)
                                (field "name" entry)))
                          entries))))))

(defun env-mask-args ()
  "Return bwrap args masking every .env* file with /dev/null so agent commands
cannot read credentials, whatever the suffix (.env, .env.local, .env.dev...).
Filters by name prefix because pathname wildcards treat the suffix as a type."
  (loop for path in (directory (merge-pathnames "*.*" *root*))
        for name = (file-namestring path)
        when (and name (>= (length name) 4) (string= (subseq name 0 4) ".env"))
          append (list "--ro-bind" "/dev/null" (namestring path))))

(defun readonly-self-args ()
  "Make the coding agent's own machinery read-only inside the sandbox so a
command cannot rewrite the sources, config, launcher, or constitution that
define its behavior (protects rule 4: do not weaken the sandbox)."
  (loop for rel in '("src/" "config.sexp" "config.example.sexp"
                     "forgepair.asd" "bin/" ".forgepair/RULES.md")
        for path = (merge-pathnames rel *root*)
        when (probe-file path)
          append (list "--ro-bind" (namestring path) (namestring path))))

(defun make-sandbox-command-port ()
  (make-command-port
   :execute (lambda (command)
              (let ((out (merge-pathnames "command.out" *runtime*)))
                (let ((code (with-open-file (stream out :direction :output :if-exists :supersede :if-does-not-exist :create)
                              (run-process "bwrap"
                                           (append
                                            (list "--die-with-parent" "--unshare-all" "--unshare-net" "--new-session"
                                                  "--ro-bind" "/usr" "/usr" "--ro-bind" "/bin" "/bin"
                                                  "--ro-bind" "/lib" "/lib" "--ro-bind-try" "/lib64" "/lib64"
                                                  "--proc" "/proc" "--dev" "/dev" "--tmpfs" "/tmp"
                                                  "--bind" *root* *root*
                                                  "--ro-bind" (namestring (merge-pathnames ".git/" *root*))
                                                              (namestring (merge-pathnames ".git/" *root*)))
                                            (readonly-self-args)
                                            (env-mask-args)
                                            (list "--chdir" *root* "--clearenv" "--setenv" "HOME" *root*
                                                  "--setenv" "PATH" "/usr/bin:/bin" "/bin/sh" "-lc" command))
                                           :output stream :error stream))))
                  (with-open-file (stream out :direction :output :if-exists :append)
                    (format stream "~%[exit ~D]~%" code)))
                (let ((text (slurp out)))
                  (if (> (length text) 12000) (subseq text (- (length text) 12000)) text))))))

(defun make-cli-output-port ()
  (make-output-port
   :render-turn (lambda (turn turns name conclusion command output)
                  (format t "~&[~D/~D] ~A~%conclusao: ~A~%comando: ~A~%saida:~%~A~%"
                          turn turns name conclusion
                          (if (string= command "") "[nenhum]" command) output)
                  (force-output))))

;;; Live model availability probe (zero-lib: reuses the http provider port).

(defun probe-model (credentials provider-name model)
  "Send a tiny real request to PROVIDER-NAME's MODEL. Returns t if the endpoint
answers with assistant content, nil otherwise. Never prints the credential."
  (let ((provider (append (list :model model)
                          (copy-list (provider-definition provider-name)))))
    (handler-case
        (let ((content (funcall (provider-port-call (make-http-provider-port credentials))
                                provider
                                "You are a probe. Reply with the single word ok."
                                "ok")))
          (and content (> (length content) 0)))
      (error () nil))))

(defun verify-models (credentials)
  "Probe every candidate model and report which actually work with the present
credentials. Use the output to prune *akita-tier* to real availability."
  (format t "~&Verificando disponibilidade real dos modelos (chamada minima por modelo)...~%")
  (dolist (pair *verify-candidates*)
    (destructuring-bind (provider-name model) pair
      (if (credential-available-p credentials
                                  (getf (provider-definition provider-name) :key-env))
          (format t "  [~A] ~A -> ~A~%"
                  provider-name model
                  (if (probe-model credentials provider-name model) "OK" "FALHOU"))
          (format t "  [~A] ~A -> sem credencial~%" provider-name model)))))

;;; Telegram integration (zero-lib: plain curl to the Bot API).

(defun telegram-api (token method &optional data-json)
  "Call a Telegram Bot API method with curl. Returns the parsed JSON document.
Signals on transport failure; the caller inspects the \"ok\" field."
  (let ((url (format nil "https://api.telegram.org/bot~A/~A" token method))
        (response (merge-pathnames "telegram.json" *runtime*))
        (err (merge-pathnames "telegram.err" *runtime*)))
    (with-open-file (out response :direction :output :if-exists :supersede :if-does-not-exist :create)
      (with-open-file (error-stream err :direction :output :if-exists :supersede :if-does-not-exist :create)
        (let ((args (list "--silent" "--show-error"
                          "--connect-timeout" "20" "--max-time" "30" url)))
          (when data-json
            (setf args (append (list "-H" "Content-Type: application/json"
                                     "--data-binary" data-json)
                               args)))
          (run-process "curl" args :output out :error error-stream))))
    (parse-json (slurp response))))

(defun telegram-send (token chat-id text)
  "Send a message to a chat. Returns the new message_id on success, nil otherwise."
  (let ((doc (telegram-api token "sendMessage"
                           (format nil "{\"chat_id\":~A,\"text\":~A}"
                                   (json-string chat-id) (json-string text)))))
    (and (field "ok" doc) (field "message_id" (field "result" doc)))))

(defun telegram-edit (token chat-id message-id text)
  "Edit an existing message (the session bubble). Returns t on success. Telegram
rejects edits whose text is byte-identical to the current one (400); we treat
that as success so an unchanged turn is a no-op."
  (let ((doc (telegram-api token "editMessageText"
                           (format nil "{\"chat_id\":~A,\"message_id\":~A,\"text\":~A}"
                                   (json-string chat-id)
                                   (if (stringp message-id) (json-string message-id)
                                       (princ-to-string message-id))
                                   (json-string text)))))
    (or (and (field "ok" doc) t)
        (let ((desc (field "description" (field "error" doc))))
          (and desc (search "not modified" desc) t))
        (let ((desc (field "description" doc)))
          (and desc (search "not modified" desc) t)))))

(defun telegram-chat-id (token &optional credentials)
  "Resolve the chat id for the session bubble: prefer TELEGRAM_CHAT_ID from the
environment, else fall back to the most recent chat that messaged the bot via
getUpdates. Returns the id as a string, or nil if none can be determined."
  (or (and credentials
           (handler-case (funcall (credential-port-get credentials) "TELEGRAM_CHAT_ID")
             (error () nil)))
      (let* ((doc (telegram-api token "getUpdates"))
             (updates (and (field "ok" doc) (field "result" doc)))
             (last (car (last updates))))
        (when last
          (let* ((msg (or (field "message" last) (field "channel_post" last)))
                 (chat (and msg (field "chat" msg)))
                 (id (and chat (field "id" chat))))
            (and id (princ-to-string id)))))))

(defun make-telegram-session (credentials)
  "Create a Telegram session bubble (one message per Forgepair session) and
return a closure (lambda (compact-text)) that edits that same bubble with the
compact text each turn. Returns nil when Telegram is unavailable (no token or no
chat id) so the session runs normally without notifications."
  (handler-case
      (let* ((token (funcall (credential-port-get credentials) "TELEGRAM_BOT_TOKEN"))
             (chat-id (and token (telegram-chat-id token credentials))))
        (when (and token chat-id (> (length token) 0))
          (let ((message-id (telegram-send token chat-id "Forgepair: iniciando sessao...")))
            (when message-id
              (lambda (compact-text)
                (handler-case (telegram-edit token chat-id message-id compact-text)
                  (error () nil)))))))
    (error () nil)))

(defun telegram-test (credentials)
  "Validate TELEGRAM_BOT_TOKEN via getMe without sending any message."
  (handler-case
      (let* ((token (funcall (credential-port-get credentials) "TELEGRAM_BOT_TOKEN"))
             (doc (telegram-api token "getMe")))
        (if (field "ok" doc)
            (let ((me (field "result" doc)))
              (format t "telegram getMe: ok (bot=@~A, id=~A)~%"
                      (or (field "username" me) "?")
                      (or (field "id" me) "?")))
            (format t "telegram getMe: FALHOU (~A)~%"
                    (or (field "description" doc) "resposta sem ok"))))
    (error (condition)
      (format t "telegram-test: ~A~%" condition))))

(defun make-prompt-port (fixed-prompt)
  "User-request channel. Uses --prompt when given, otherwise reads stdin once.
The value is captured lazily and cached so the request is stable across turns."
  (let ((cached nil) (loaded nil))
    (%make-prompt-port
     :get (lambda ()
            (unless loaded
              (setf cached
                    (cond ((and fixed-prompt (> (length (trim fixed-prompt)) 0))
                           fixed-prompt)
                          (t
                           (with-output-to-string (out)
                             (loop for line = (read-line *standard-input* nil nil)
                                   while line do (write-line line out))))))
              (setf loaded t))
            cached))))

(defun make-notes-port ()
  (let ((notes nil) (lock (sb-thread:make-mutex :name "human-notes")))
    (%make-notes-port
     :take (lambda ()
             (sb-thread:with-mutex (lock)
               (prog1 (nreverse notes) (setf notes nil))))
     :start (lambda ()
              (sb-thread:make-thread
               (lambda ()
                 (loop
                   (format t "~&~C[36mvoce> ~C[0m" #\Esc #\Esc)
                   (force-output)
                       (let ((line (read-line *standard-input* nil nil)))
                         (unless line (return))
                         (let ((note (trim line)))
                           (unless (string= note "")
                             (sb-thread:with-mutex (lock)
                               (push note notes)))))))
               :name "forgepair-human-input")))))
