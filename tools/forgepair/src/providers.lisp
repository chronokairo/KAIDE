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