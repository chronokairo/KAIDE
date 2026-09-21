;;;; Forgepair -- intentionally dependency-free SBCL program.

(defpackage :forgepair
  (:use :cl))
(in-package :forgepair)

(defparameter *root*
  (namestring
   (truename
    (merge-pathnames "../"
                     (make-pathname :name nil :type nil :defaults *load-truename*)))))
(defparameter *runtime* (merge-pathnames ".forgepair/runtime/" *root*))
(defparameter *dotenv* nil)
(defparameter *human-notes* nil)
(defparameter *human-lock* (sb-thread:make-mutex :name "human-notes"))
(defparameter *conversation* nil)
(defparameter *conversation-lock* (sb-thread:make-mutex :name "conversation"))
(defparameter *mock-step* 0)

(defun fail (format-control &rest args)
  (apply #'format *error-output* (concatenate 'string "forgepair: " format-control "~%") args)
  (sb-ext:exit :code 1))

(defun slurp (path)
  (with-open-file (in path :direction :input)
    (with-output-to-string (out)
      (let ((buffer (make-string 4096)))
        (loop for count = (read-sequence buffer in)
              while (plusp count)
              do (write-string buffer out :end count))))))

(defun spit (path text)
  (ensure-directories-exist path)
  (with-open-file (out path :direction :output :if-exists :supersede
                            :if-does-not-exist :create)
    (write-string text out)))

(defun trim (text)
  (string-trim '(#\Space #\Tab #\Return #\Newline) text))

(defun load-dotenv ()
  "Read simple KEY=VALUE entries without exporting secrets to child processes."
  (let ((path (merge-pathnames ".env" *root*)))
    (setf *dotenv* nil)
    (when (probe-file path)
      (with-open-file (in path)
        (loop for raw = (read-line in nil nil) while raw
              for line = (trim raw)
              unless (or (string= line "") (char= (char line 0) #\#)) do
                (let ((equals (position #\= line)))
                  (when equals
                    (let* ((key (trim (subseq line 0 equals)))
                           (value (trim (subseq line (1+ equals))))
                           (last (1- (length value))))
                      (when (and (> (length value) 1)
                                 (member (char value 0) '(#\" #\'))
                                 (char= (char value 0) (char value last)))
                        (setf value (subseq value 1 last)))
                      (push (cons key value) *dotenv*)))))))))

(defun credential (name)
  (let ((value (or (sb-ext:posix-getenv name)
                   (cdr (assoc name *dotenv* :test #'string=)))))
    (if (and value (> (length value) 0)) value
        (fail "credential ~A is missing; set it in .env or the environment" name))))

(defun json-escape (s)
  (with-output-to-string (out)
    (loop for c across s do
      (case c
        (#\" (write-string "\\\"" out)) (#\\ (write-string "\\\\" out))
        (#\Newline (write-string "\\n" out)) (#\Return (write-string "\\r" out))
        (#\Tab (write-string "\\t" out))
        (t (if (< (char-code c) 32)
               (format out "\\u~4,'0X" (char-code c))
               (write-char c out)))))))

(defun json-string (s) (format nil "\"~A\"" (json-escape s)))

;; Small complete-enough JSON reader: objects become alists, arrays become lists.
(defun parse-json (text)
  (let ((i 0) (n (length text)))
    (labels ((ws () (loop while (and (< i n)
                                    (member (char text i)
                                            '(#\Space #\Tab #\Return #\Newline)))
                            do (incf i)))
             (peek () (ws) (and (< i n) (char text i)))
             (take () (prog1 (char text i) (incf i)))
             (str ()
               (unless (char= (take) #\") (error "expected string"))
               (with-output-to-string (out)
                 (loop for c = (take) do
                   (cond ((char= c #\") (return))
                         ((char= c #\\)
                          (let ((e (take)))
                            (write-char (case e (#\n #\Newline) (#\r #\Return)
                                               (#\t #\Tab) (#\b #\Backspace)
                                               (#\f #\Page) (otherwise e)) out)))
                         (t (write-char c out))))))
             (number ()
               (let ((start i))
                 (loop while (and (< i n) (find (char text i) "-+0123456789.eE")) do (incf i))
                 (read-from-string (subseq text start i))))
             (literal (word value)
               (unless (and (<= (+ i (length word)) n)
                            (string= word text :start2 i :end2 (+ i (length word))))
                 (error "bad JSON literal"))
               (incf i (length word)) value)
             (array ()
               (take) (ws) (when (eql (peek) #\]) (take) (return-from array nil))
               (let ((items nil))
                 (loop (push (value) items) (ws)
                       (case (take) (#\] (return (nreverse items))) (#\, nil)
                                    (otherwise (error "bad array"))))))
             (object ()
               (take) (ws) (when (eql (peek) #\}) (take) (return-from object nil))
               (let ((members nil))
                 (loop for key = (progn (ws) (str))
                       do (ws) (unless (char= (take) #\:) (error "expected colon"))
                          (push (cons key (value)) members)
                          (ws)
                       (case (take) (#\} (return (nreverse members))) (#\, nil)
                                    (otherwise (error "bad object"))))))
             (value ()
               (ws) (case (peek) (#\" (str)) (#\{ (object)) (#\[ (array))
                     (#\t (literal "true" t)) (#\f (literal "false" nil))
                     (#\n (literal "null" nil)) (otherwise (number)))))
      (prog1 (value) (ws) (unless (= i n) (error "trailing JSON"))))))

(defun field (name object)
  (cdr (assoc name object :test #'string=)))

(defun run (program args &key output error)
  (let ((p (sb-ext:run-program program args :search t :wait t
                               :output (or output *standard-output*)
                               :error (or error *error-output*))))
    (sb-ext:process-exit-code p)))

(defun provider-call (provider system user)
  (let* ((url (getf provider :url))
         (key (credential (getf provider :key-env)))
         (model (getf provider :model))
         (request (merge-pathnames "request.json" *runtime*))
         (response (merge-pathnames "response.json" *runtime*))
         (err (merge-pathnames "curl.err" *runtime*)))
    (spit request
          (format nil "{\"model\":~A,\"temperature\":0.2,\"messages\":[{\"role\":\"system\",\"content\":~A},{\"role\":\"user\",\"content\":~A}]}"
                  (json-string model) (json-string system) (json-string user)))
    (with-open-file (out response :direction :output :if-exists :supersede :if-does-not-exist :create)
      (with-open-file (e err :direction :output :if-exists :supersede :if-does-not-exist :create)
        (unless (zerop (run "curl" (list "--fail-with-body" "--silent" "--show-error"
                                           "--retry" "3" "--retry-all-errors" "--retry-delay" "2"
                                           "--connect-timeout" "20" "--max-time" "180"
                                           "-H" (format nil "Authorization: Bearer ~A" key)
                                           "-H" "Content-Type: application/json" "--data-binary"
                                           (format nil "@~A" (namestring request)) url)
                            :output out :error e))
          (spit (merge-pathnames "provider-error.json" *runtime*) (slurp response))
          (error "provider request failed: ~A~%~A" (slurp err) (slurp response)))))
    (handler-case
        (let* ((doc (parse-json (slurp response)))
               (choice (first (field "choices" doc)))
               (content (field "content" (field "message" choice))))
          (or content (error "provider returned no assistant content")))
      (error (e) (error "invalid provider response: ~A" e)))))

(defun telegram-test ()
  "Validate the configured Telegram bot token without sending a message."
  (let* ((token (credential "TELEGRAM_BOT_TOKEN"))
         (response (merge-pathnames "telegram.json" *runtime*))
         (err (merge-pathnames "telegram.err" *runtime*))
         (url (format nil "https://api.telegram.org/bot~A/getMe" token)))
    (with-open-file (out response :direction :output :if-exists :supersede
                         :if-does-not-exist :create)
      (with-open-file (e err :direction :output :if-exists :supersede
                         :if-does-not-exist :create)
        (unless (zerop (run "curl" (list "--fail" "--silent" "--show-error"
                                           "--connect-timeout" "20" "--max-time" "30"
                                           url)
                            :output out :error e))
          (error "Telegram request failed: ~A" (slurp err)))))
    (let* ((doc (parse-json (slurp response)))
           (user (field "result" doc)))
      (unless (eq (field "ok" doc) t)
        (error "Telegram rejected the bot token"))
      (format t "telegram: ok (@~A)~%" (or (field "username" user) "unnamed")))))

(defun extract-object (text)
  "Parse the final complete JSON object, ignoring fences and reasoning preambles."
  (let* ((marker (or (search "{\"message\"" text :from-end t)
                     (position #\{ text :from-end t)))
         (start (and marker (position #\{ text :end (1+ marker) :from-end t))))
    (unless start (error "response contains no JSON object"))
    (let ((depth 0) (in-string nil) (escaped nil))
      (loop for i from start below (length text)
            for c = (char text i) do
              (cond (escaped (setf escaped nil))
                    ((and in-string (char= c #\\)) (setf escaped t))
                    ((char= c #\") (setf in-string (not in-string)))
                    ((not in-string)
                     (cond ((char= c #\{) (incf depth))
                           ((char= c #\})
                            (decf depth)
                            (when (zerop depth)
                              (return-from extract-object
                                (parse-json (subseq text start (1+ i)))))))))
            finally (error "unterminated JSON object")))))

(defun sandbox-command (command)
  (let ((out (merge-pathnames "command.out" *runtime*)))
    (let ((code
            (with-open-file (stream out :direction :output :if-exists :supersede
                                        :if-does-not-exist :create)
              (run "bwrap"
                   (list "--die-with-parent" "--unshare-all" "--unshare-net" "--new-session"
                         "--ro-bind" "/usr" "/usr" "--ro-bind" "/bin" "/bin"
                         "--ro-bind" "/lib" "/lib" "--ro-bind-try" "/lib64" "/lib64"
                         "--proc" "/proc" "--dev" "/dev" "--tmpfs" "/tmp"
                         "--bind" *root* *root*
                         "--ro-bind" (namestring (merge-pathnames ".git/" *root*))
                                     (namestring (merge-pathnames ".git/" *root*))
                         "--ro-bind" (namestring (merge-pathnames "AGENTS.md" *root*))
                                     (namestring (merge-pathnames "AGENTS.md" *root*))
                         "--ro-bind" "/dev/null" (namestring (merge-pathnames ".env" *root*))
                         "--chdir" *root* "--clearenv"
                         "--setenv" "HOME" *root* "--setenv" "PATH" "/usr/bin:/bin"
                         "/bin/sh" "-lc" command)
                   :output stream :error stream))))
      ;; Append only after closing the descriptor inherited by RUN-PROGRAM.
      (with-open-file (stream out :direction :output :if-exists :append)
        (format stream "~%[exit ~D]~%" code)))
    (let ((text (slurp out)))
      (if (> (length text) 12000) (subseq text (- (length text) 12000)) text))))

(defun load-config ()
  (let ((path (merge-pathnames "config.sexp" *root*)))
    (unless (probe-file path)
      (fail "copy config.example.sexp to config.sexp and choose models"))
    (with-open-file (in path) (read in))))

(defun configured-agents (config)
  "Build two conversational roles from either auto routing or manual agents."
  (if (eq (getf config :mode) :auto)
      (let ((provider (getf config :auto-provider)))
        (unless provider
          (fail "auto mode requires :auto-provider"))
        (list (append (list :name "Auto A") (copy-list provider))
              (append (list :name "Auto B") (copy-list provider))))
      (getf config :agents)))

(defun add-conversation (speaker text)
  (sb-thread:with-mutex (*conversation-lock*)
    (push (cons speaker text) *conversation*)
    (when (> (length *conversation*) 100)
      (setf *conversation* (subseq *conversation* 0 100)))))

(defun queue-human-note (text)
  (sb-thread:with-mutex (*human-lock*) (push text *human-notes*)))

(defun take-human-notes ()
  (sb-thread:with-mutex (*human-lock*)
    (prog1 (nreverse *human-notes*) (setf *human-notes* nil))))

(defun start-human-input ()
  (sb-thread:make-thread
   (lambda ()
     (loop
       (format t "~&~C[36mvoce> ~C[0m" #\Esc #\Esc)
       (force-output)
       (let ((line (read-line *standard-input* nil nil)))
         (unless line (return))
         (let ((note (trim line)))
           (unless (string= note "")
             (queue-human-note note)
             (add-conversation "voce" note)
             (format t "~&~C[2m[nota enfileirada para o proximo turno]~C[0m~%"
                     #\Esc #\Esc))))))
   :name "forgepair-human-input"))

(defun render-tui (turn turns active)
  (format t "~C[2J~C[H~C[1;35mFORGEPAIR~C[0m  turno ~D/~D  ~A~%"
          #\Esc #\Esc #\Esc #\Esc turn turns active)
  (format t "~C[2mDigite a qualquer momento; sua nota entra no proximo turno.~C[0m~%~%"
          #\Esc #\Esc)
  (let ((entries (sb-thread:with-mutex (*conversation-lock*)
                   (reverse (subseq *conversation* 0 (min 10 (length *conversation*)))))))
    (dolist (entry entries)
      (format t "~C[1m~A:~C[0m ~A~%" #\Esc (car entry) #\Esc (cdr entry))))
  (terpri)
  (force-output))

(defun render-cli-turn (turn turns name conclusion command output)
  (format t "~&[~D/~D] ~A~%conclusao: ~A~%comando: ~A~%saida:~%~A~%"
          turn turns name conclusion
          (if (string= command "") "[nenhum]" command) output)
  (force-output))

(defun notes-for-prompt ()
  (let ((notes (take-human-notes)))
    (if notes
        (format nil "~%Human observer notes (advice only; keep the agent turn order):~%~{ - ~A~%~}" notes)
        "")))

(defun mock-action-call (provider system user)
  "Return deterministic actions that verify conclusion-only peer handoff."
  (declare (ignore provider system))
  (incf *mock-step*)
  (case *mock-step*
    (1 "{\"message\":\"Executar verificacao privada.\",\"command\":\"printf 'forgepair-mock-ok\\n'\"}")
    (2 (unless (and (search "Previous peer conclusion: A verificacao terminou com sucesso." user)
                    (not (search "Peer command:" user))
                    (not (search "Terminal output:" user))
                    (not (search "forgepair-mock-ok" user)))
         (error "mock peer handoff was not limited to the previous conclusion"))
       "{\"message\":\"Escolher proximo passo privadamente.\",\"command\":\"\"}")
    (otherwise
     (unless (search "Previous peer conclusion: O agente escolheu continuar autonomamente." user)
       (error "mock did not receive the previous peer conclusion"))
     "{\"message\":\"Continuar privadamente.\",\"command\":\"\"}")))

(defun mock-conclusion-call (provider system action command output)
  (declare (ignore provider system command))
  (case *mock-step*
    (1 (unless (and (search "Executar verificacao privada." action)
                    (search "forgepair-mock-ok" output)
                    (search "[exit 0]" output))
         (error "mock conclusion did not receive the private action result"))
       "A verificacao terminou com sucesso.")
    (otherwise
     "O agente escolheu continuar autonomamente.")))

(defun conclusion-call (provider action command output)
  (let* ((system "Privately review the completed action and its terminal result. Return only one JSON object with a concise, factual conclusion for the next agent: {\"conclusion\":\"...\"}. Do not reveal the command, raw output, or private reasoning. Do not use Markdown.")
         (prompt (format nil "Private action summary: ~A~%Private command: ~A~%Private terminal result:~%~A"
                         action command output))
         (raw (provider-call provider system prompt))
         (reply (extract-object raw)))
    (or (field "conclusion" reply)
        (error "provider returned no conclusion"))))

(defun fallback-conclusion (command output)
  (cond ((string= command "")
         "The agent completed an autonomous turn without executing a command.")
        ((search "[exit 0]" output)
         "The agent completed its chosen action successfully.")
        (t "The agent's chosen action did not complete successfully.")))

(defun main (&key cli mock turns-override)
  (let* ((config (load-config))
         (rules (slurp (merge-pathnames "AGENTS.md" *root*)))
         (system (format nil "You are one of two autonomous agents researching iterative self-improvement in this repository.~%~A~%Decide for yourself what action, if any, is useful. You are not required to read files or execute a command. Your message is a private action summary and is not sent to your peer. Never use markdown around the JSON." rules))
         (transcript "No previous peer conclusion. Choose your next step autonomously.")
         (agents (mapcar (lambda (agent) (cons (getf agent :name) agent))
                         (configured-agents config)))
         (turns (or turns-override (getf config :turns) 6)))
    (ensure-directories-exist *runtime*)
    (load-dotenv)
    (unless (= (length agents) 2)
      (fail "configuration must resolve to exactly two agents"))
    (when mock (setf *mock-step* 0))
    (unless cli (start-human-input))
    (dotimes (turn turns)
      (let* ((agent (nth (mod turn 2) agents))
             (name (car agent)))
        (unless cli
          (render-tui (1+ turn) turns (format nil "~A pensando..." name)))
        (let* ((prompt (concatenate 'string transcript (notes-for-prompt)))
               (raw (if mock
                        (mock-action-call (cdr agent) system prompt)
                        (handler-case (provider-call (cdr agent) system prompt)
                          (error (e)
                            (format nil "{\"message\":~A,\"command\":\"\"}"
                                    (json-string
                                     (format nil "~A unavailable this turn: ~A" name e)))))))
               (reply (handler-case (extract-object raw)
                        (error () (list (cons "message" (trim raw))
                                        (cons "command" "")))))
               (message (or (field "message" reply) ""))
               (command (or (field "command" reply) ""))
               (output (if (string= command "") "[no command]" (sandbox-command command)))
               (conclusion
                 (if mock
                     (mock-conclusion-call (cdr agent) system message command output)
                     (handler-case (conclusion-call (cdr agent) message command output)
                       (error (e)
                         (format *error-output* "forgepair: ~A conclusion unavailable: ~A~%"
                                 name e)
                         (fallback-conclusion command output))))))
          (when (and mock (not (string= command ""))
                     (not (search "[exit 0]" output)))
            (error "mock command did not complete successfully"))
          (add-conversation name conclusion)
          (add-conversation "terminal" (format nil "$ ~A~%~A" command output))
          (if cli
              (render-cli-turn (1+ turn) turns name conclusion command output)
              (render-tui (1+ turn) turns name))
          (setf transcript
                (format nil "Previous peer conclusion: ~A~%Choose your next step autonomously."
                        conclusion)))))
    (format t "~&Concluido. Revise com: git diff~%")))

(defun parse-options (args)
  (let ((cli nil) (mock nil) (turns nil))
    (loop while args do
      (let ((arg (pop args)))
        (cond
          ((string= arg "--cli") (setf cli t))
          ((string= arg "--mock") (setf mock t cli t))
          ((string= arg "--turns")
           (unless args (error "--turns requires a positive integer"))
           (let ((value (parse-integer (pop args) :junk-allowed t)))
             (unless (and value (> value 0))
               (error "--turns requires a positive integer"))
             (setf turns value)))
          ((or (string= arg "--help") (string= arg "-h"))
           (format t "Usage: bin/forgepair [--cli] [--mock] [--telegram-test] [--turns N]~%~%  --cli             plain, non-interactive output~%  --mock            offline deterministic session (implies --cli)~%  --telegram-test   validate TELEGRAM_BOT_TOKEN with getMe~%  --turns N         override configured turn count~%")
           (sb-ext:exit :code 0))
          (t (error "unknown option: ~A" arg)))))
    (list :cli cli :mock mock :turns-override turns)))

(defun self-test ()
  (let* ((doc (parse-json "{\"s\":\"line\\ntext\",\"a\":[true,false,null,3]}"))
         (action (extract-object "{\"message\":\"draft\",\"command\":\"\"}</think>```json\n{\"message\":\"ok\",\"command\":\"printf '{x}'\"}\n```")))
    (assert (string= (field "s" doc) (format nil "line~%text")))
    (assert (= (fourth (field "a" doc)) 3))
    (assert (string= (field "message" action) "ok"))
    (assert (string= (field "command" action) "printf '{x}'"))
    (format t "forgepair self-test: ok~%")))

(handler-case (let ((args (cdr sb-ext:*posix-argv*)))
                (cond
                  ((member "--self-test" args :test #'string=)
                   (self-test))
                  ((member "--telegram-test" args :test #'string=)
                   (ensure-directories-exist *runtime*)
                   (load-dotenv)
                   (telegram-test))
                  (t (apply #'main (parse-options args)))))
  (error (e) (fail "~A" e)))
