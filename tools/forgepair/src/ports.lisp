;;;; Ports: application-facing contracts represented as callable objects.

(in-package :forgepair)

(defstruct provider-port call)
(defstruct command-port execute)
(defstruct output-port render-turn render-tui)
(defstruct (notes-port (:constructor %make-notes-port)) take start)
(defstruct (credential-port (:constructor %make-credential-port)) get)
(defstruct (prompt-port (:constructor %make-prompt-port)) get)
(defstruct (session-port (:constructor %make-session-port)) update)

(defun session-event (port kind text)
  "Post one chat event (kind + text) to the external chat, if any. A nil port or
nil updater is a no-op so the session runs the same with or without it."
  (when (and port (session-port-update port))
    (funcall (session-port-update port) kind text)))

(defun user-prompt (port)
  "Return the user's request that the executor must fulfill this session."
  (funcall (prompt-port-get port)))

(defun provider-request (port provider system user)
  (funcall (provider-port-call port) provider system user))

(defun execute-command (port command)
  (funcall (command-port-execute port) command))

(defun render-turn (port name conclusion command output)
  (funcall (output-port-render-turn port) name conclusion command output))
