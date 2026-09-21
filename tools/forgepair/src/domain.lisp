;;;; Domain: pure protocol and session decisions.

(in-package :forgepair)

(defun trim (text)
  (string-trim '(#\Space #\Tab #\Return #\Newline) text))

(defun json-escape (text)
  (with-output-to-string (out)
    (loop for character across text do
      (case character
        (#\" (write-string "\\\"" out))
        (#\\ (write-string "\\\\" out))
        (#\Newline (write-string "\\n" out))
        (#\Return (write-string "\\r" out))
        (#\Tab (write-string "\\t" out))
        (otherwise (if (< (char-code character) 32)
                       (format out "\\u~4,'0X" (char-code character))
                       (write-char character out)))))))

(defun json-string (text) (format nil "\"~A\"" (json-escape text)))

(defun parse-json (text)
  (let ((index 0) (length (length text)))
    (labels ((whitespace ()
               (loop while (and (< index length)
                                (member (char text index)
                                  '(#\Space #\Tab #\Return #\Newline)))
                     do (incf index)))
             (peek () (whitespace) (and (< index length) (char text index)))
             (take () (prog1 (char text index) (incf index)))
             (string-value ()
               (unless (char= (take) #\") (error "expected JSON string"))
               (with-output-to-string (out)
                 (loop for character = (take) do
                   (cond ((char= character #\") (return))
                         ((char= character #\\)
                          (let ((escaped (take)))
                            (write-char (cond ((char= escaped #\n) #\Newline)
                                              ((char= escaped #\r) #\Return)
                                              ((char= escaped #\t) #\Tab)
                                              ((char= escaped #\b) #\Backspace)
                                              ((char= escaped #\f) #\Page)
                                              (t escaped)) out)))
                         (t (write-char character out))))))
             (literal (word value)
               (unless (and (<= (+ index (length word)) length)
                            (string= word text :start2 index
                                          :end2 (+ index (length word))))
                 (error "bad JSON literal"))
               (incf index (length word)) value)
             (number-value ()
               (let ((start index))
                 (loop while (and (< index length)
                                  (find (char text index) "-+0123456789.eE"))
                       do (incf index))
                 (read-from-string (subseq text start index))))
             (array-value ()
               (take) (whitespace)
               (when (char= (peek) #\]) (take) (return-from array-value nil))
               (let ((values nil))
                 (loop (push (value) values) (whitespace)
                       (case (take)
                         (#\] (return (nreverse values)))
                         (#\, nil)
                         (otherwise (error "bad JSON array"))))))
             (object-value ()
               (take) (whitespace)
               (when (char= (peek) #\}) (take) (return-from object-value nil))
               (let ((members nil))
                 (loop for key = (progn (whitespace) (string-value)) do
                   (whitespace)
                   (unless (char= (take) #\:) (error "expected JSON colon"))
                   (push (cons key (value)) members)
                   (whitespace)
                   (case (take)
                     (#\} (return (nreverse members)))
                     (#\, nil)
                     (otherwise (error "bad JSON object"))))))
             (value ()
               (let ((character (peek)))
                 (cond ((char= character #\") (string-value))
                       ((char= character #\{) (object-value))
                       ((char= character #\[) (array-value))
                       ((char= character #\t) (literal "true" t))
                       ((char= character #\f) (literal "false" nil))
                       ((char= character #\n) (literal "null" nil))
                       (t (number-value))))))
      (prog1 (value) (whitespace)
        (unless (= index length) (error "trailing JSON"))))))

(defun field (name object) (cdr (assoc name object :test #'string=)))

(defun extract-object (text)
  ;; Anchor on the first known protocol key so we lock onto the intended object
  ;; even when the model precedes it with reasoning prose (which may contain
  ;; stray braces). Returns NIL on any failure so callers degrade to "no action"
  ;; instead of crashing the session.
  (when (and text (> (length text) 0))
(let* ((marker (or (search "{\"executor_model\"" text)
                        (search "{\"message\"" text)
                        (search "{\"improvement\"" text)
                        (search "{\"executor_ok\"" text)
                        (search "{ \"message\"" text)
                        (search "{ \"improvement\"" text)
                        (search "{ \"executor_ok\"" text)
                        (search "{\"analysis\"" text)
                        (position #\{ text)))
           (start (and marker (position #\{ text :start marker))))
      (when start
        (let ((depth 0) (in-string nil) (escaped nil))
          (loop for index from start below (length text)
                for character = (char text index) do
            (cond (escaped (setf escaped nil))
                  ((and in-string (char= character #\\)) (setf escaped t))
                  ((char= character #\") (setf in-string (not in-string)))
                  ((not in-string)
                   (case character
                     (#\{ (incf depth))
                     (#\} (decf depth)
                           (when (zerop depth)
                             (return-from extract-object
                               (ignore-errors
                                 (parse-json (subseq text start (1+ index)))))))))))
          nil)))))

;;; System prompts for the three roles.
;;;
;;; The planner is the best model of the tier: it orchestrates, and after each
;;; turn validates whether the executor fulfilled the user's request and whether
;;; the improver applied a real improvement to Forgepair itself. The executor
;;; (model A, picked for cost-benefit) works ON the user's request. The improver
;;; (model B) improves ONLY the Forgepair repository (its own coding agent).

(defun planner-system (user-prompt rules)
  (format nil "You are the planner: the lead model orchestrating a coding agent. ~
You do not run commands. Given the user's request and the latest results of the ~
executor and the improver, judge STRICTLY whether each did real, verifiable work. ~
Reply with only one JSON object:~%~
{\"executor_ok\":true|false,\"improver_ok\":true|false,\"note\":\"one line of guidance\"}~%~
executor_ok is true only if the executor actually advanced the user's request. ~
improver_ok is true only if the improver applied a concrete improvement to the ~
Forgepair repository itself. If a role did not implement, set its flag false so ~
its model is swapped.~%User request:~%~A~%Rules:~%~A"
          user-prompt rules))

(defun executor-system (user-prompt rules)
  (format nil "You are the executor coding agent (model chosen by the planner for ~
cost-benefit). Fulfill the user's request by inspecting the repository and, when ~
useful, running exactly one shell command per turn. Reply with only one JSON object:~%~
{\"message\":\"what you did or found\",\"command\":\"one shell command or empty string\"}~%~
User request:~%~A~%Rules:~%~A"
          user-prompt rules))

(defun improver-system (user-prompt rules)
  (format nil "You are the improver meta-agent (model chosen by the planner). You ~
do NOT work on the user's request. You improve ONLY the Forgepair repository ~
itself — its own prompts, rules, config, or behavior as a coding agent. Never ~
touch the user's target project. Watching how the executor handles the user's ~
requests, identify one concrete improvement to Forgepair; if small and ~
verifiable, apply it with exactly one shell command, otherwise leave command ~
empty and describe it. Reply with only one JSON object:~%~
{\"improvement\":\"the improvement to the Forgepair repo\",\"rationale\":\"why the user's prompts justify it\",\"command\":\"one shell command or empty string\"}~%~
User request being served:~%~A~%Rules:~%~A"
          user-prompt rules))

;;; Turn prompts.

(defun action-prompt (user-prompt history notes)
  "Executor sees the user's request, its own prior work, and human notes."
  (format nil "User request:~%~A~%~%Your work so far:~%~A~A"
          user-prompt history notes))

(defun improve-prompt (user-prompt executor-message executor-command executor-output
                       improvements)
  "Improver sees the user's request, the executor's latest turn, and the
improvements already accumulated this session (Forgepair repo only)."
  (format nil "User request:~%~A~%~%Executor's latest action: ~A~%Executor's command: ~A~%Executor's terminal result:~%~A~%~%Improvements to Forgepair accepted so far:~%~A"
          user-prompt executor-message
          (if (string= executor-command "") "[none]" executor-command)
          executor-output
          (if (string= improvements "") "[none yet]" improvements)))

(defun planner-prompt (user-prompt executor-message executor-command executor-output
                       improvement improver-command improver-output)
  "Planner validates the executor and improver results of the current turn."
  (format nil "User request:~%~A~%~%Executor said: ~A~%Executor command: ~A~%Executor result:~%~A~%~%Improver said: ~A~%Improver command: ~A~%Improver result:~%~A~%~%Did each role implement real work? Answer with the JSON validation object."
          user-prompt executor-message
          (if (string= executor-command "") "[none]" executor-command)
          executor-output
          improvement
          (if (string= improver-command "") "[none]" improver-command)
          improver-output))
