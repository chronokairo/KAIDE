;;;; Provider configuration (single provider, zero commodity catalog).
;;;; The provider is read from config.sexp or environment.

(in-package :forgepair)

(defparameter *default-provider*
  '(:name "openrouter"
    :url "https://openrouter.ai/api/v1/chat/completions"
    :key-env "OPENROUTER_API_KEY"
    :model "deepseek/deepseek-v4.1-flash"))

(defun provider-definition (config)
  "Return provider plist from CONFIG or *DEFAULT-PROVIDER*."
  (or (getf config :provider) *default-provider*))

(defparameter *default-verify-command* nil
  "The command Forgepair runs after each executor attempt to decide whether the
attempt is acceptable. It must belong to the repository being worked on, not to
the model: its exit code is evidence a model cannot argue with. Set
:verify-command in config.sexp; set it to \"\" to run no mechanical gate (then
conformance rests on the decider alone, if one is configured).

NIL by default on purpose. A verification command guessed from the wrong
repository is worse than none: it fails for reasons unrelated to the patch, and
the agent burns every attempt chasing a defect that is not in its own diff.
Guessing \"sbcl --script src/entrypoint.lisp\" would only be correct inside
Forgepair itself, and Forgepair's config.sexp now states it explicitly.")

(defun verify-command (config)
  "Resolve the repository's own verification command from CONFIG, falling back to
*DEFAULT-VERIFY-COMMAND*. Returns \"\" when none is configured, which callers read
as 'no mechanical gate' rather than as a pass."
  (let ((value (getf config :verify-command)))
    (or (and (stringp value) value)
        (or *default-verify-command* ""))))

(defun current-year ()
  (nth 5 (multiple-value-list (decode-universal-time (get-universal-time)))))

(defun model-year (entry)
  (let ((created (field "created" entry))
        (date (or (field "created_at" entry) (field "modified_at" entry))))
    (cond ((and (numberp created) (> created 1000000000))
           (nth 5 (multiple-value-list
                   (decode-universal-time (+ created 2208988800)))))
          ((and date (>= (length date) 4))
           (ignore-errors (parse-integer date :end 4))))))

(defun current-year-model-p (entry)
  (= (or (model-year entry) 0) (current-year)))

;;; Local decider (evidence-based validation). Not a remote provider and not a
;;; commodity catalog (rule 10) — a single local endpoint, opt-in, that the
;;; session falls back from when it is not reachable. See ADR-0010 and
;;; docs/decider.md for what to run and why.

(defparameter *default-decider-url* "http://127.0.0.1:8080/completion"
  "Endpoint of a local llama.cpp server hosting a Mapika \"decider\" GGUF
(https://huggingface.co/Mapika/decider-2b-GGUF). Start it separately, e.g.:

  llama-server -hf Mapika/decider-2b-GGUF:Q8_0 --port 8080

Q8_0 (2.0 GB) is recommended over Q4_K_M (1.3 GB): the model card reports it
as statistically equal to the unquantized weights, and it still leaves
headroom on a 4 GB card. decider-0.8b-GGUF is a lighter fallback if VRAM is
shared with another local model. Override with the DECIDER_URL environment
variable; leave the server stopped to disable the decider entirely (validate-
evidence then falls back to its non-decider heuristic — see
application.lisp).")

(defun decider-url (credentials)
  "Resolve the decider endpoint from DECIDER_URL, or *DEFAULT-DECIDER-URL*
when unset or empty."
  (let ((value (ignore-errors (funcall (credential-port-get credentials) "DECIDER_URL"))))
    (if (and value (> (length (trim value)) 0)) value *default-decider-url*)))
