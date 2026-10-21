;;;; Dynamic model consumption: read the provider's catalogue at run time instead
;;;; of trusting a hard-coded id, and keep it for 24 hours.
;;;;
;;;; This is not routing and not a catalogue (rule 13). One model is used, the
;;;; same one the operator configured. What changes is *when* Forgepair learns
;;;; that the id is real, what it actually resolves to, and whether it still
;;;; exists: an id that was deprecated yesterday fails at request time with an
;;;; opaque 404, whereas here it is reported before the first token is spent.

(in-package :forgepair)

(defparameter *model-cache-ttl* 86400
  "How long a fetched catalogue stays fresh, in universal-time units (24 hours).

A day is long enough that a normal session never re-fetches, and short enough
that a model retired this morning is not still believed next week. The clock is
a TTL rather than a date on purpose: it survives a clock change, and a stale
entry is still *usable*, just not trusted (see cached-model-catalog).")

(defun trim-trailing-slash (url)
  (if (and (> (length url) 0) (char= (char url (1- (length url))) #\/))
      (subseq url 0 (1- (length url)))
      url))

(defun ends-with-p (prefix text)
  "True when TEXT ends with PREFIX."
  (let ((gap (- (length text) (length prefix))))
    (and (>= gap 0) (string= prefix text :start2 gap :end2 (length text)))))

(defun models-endpoint (provider)
  "The catalogue URL implied by PROVIDER's chat endpoint, or NIL. OpenRouter and
every OpenAI-compatible API publish the list beside the completion call;
:models-url overrides the derivation for providers that put it elsewhere."
  (or (getf provider :models-url)
      (let ((url (getf provider :url)))
        (when (and url (> (length url) 0))
          (let ((suffix "chat/completions"))
            (if (ends-with-p suffix url)
                (concatenate 'string
                             (subseq url 0 (- (length url) (length suffix))) "models")
                (concatenate 'string (trim-trailing-slash url) "/models")))))))

(defun cache-fresh-p (fetched-at &optional (now (get-universal-time)))
  "True when FETCHED-AT is younger than *MODEL-CACHE-TTL*. NIL is never fresh:
no timestamp means no claim of freshness. A timestamp in the future counts as
fresh rather than invalid, because a clock that jumped forward is not evidence
that the data is bad."
  (and (numberp fetched-at)
       (< (- now fetched-at) *model-cache-ttl*)))

(defun base-model-id (id)
  "ID without its variant suffix. OpenRouter serves \"acme/thinker\" and
\"acme/thinker:free\" as separate catalogue entries for one model."
  (if (null id) id
      (let ((colon (position #\: id)))
        (if colon (subseq id 0 colon) id))))

(defun catalog-ids (catalog)
  (remove nil (mapcar (lambda (entry) (field "id" entry)) catalog)))

(defun resolve-model (id catalog)
  "The id to actually send, given configured ID and CATALOG.

A variant suffix resolves to its base model, because that is the model the
variant actually is and the rest of the catalogue describes. An id the
catalogue does not know is returned unchanged: Forgepair does not substitute or
choose a model, so a typo stays a typo instead of becoming a silent downgrade."
  (if (or (null catalog) (null id) (null (length id)))
      id
      (let* ((ids (catalog-ids catalog))
             (base (base-model-id id)))
        (cond ((and (not (string= base id))
                    (member base ids :test #'string=))
               base)
              ((member id ids :test #'string=) id)
              (t id)))))

(defun catalog-entry (id catalog)
  (and catalog (find id catalog :key (lambda (entry) (field "id" entry))
                             :test #'string=)))

(defun model-deprecated-p (id catalog)
  (let ((entry (catalog-entry id catalog)))
    (and entry
         (let ((date (field "deprecation_date" entry)))
           (and (stringp date) (> (length (trim date)) 0))))))

(defun model-supports-tools-p (id catalog)
  "True when CATALOG says the model accepts tool definitions, or when the
catalogue does not say (NIL means unknown, not unsupported)."
  (let ((entry (catalog-entry id catalog)))
    (or (null entry)
        (let ((parameters (field "supported_parameters" entry)))
          (and (consp parameters)
               (some (lambda (p) (string= p "tools")) parameters))))))

(defun cache-slug (url)
  "A readable, collision-resistant filename for URL's cache entry. sxhash is the
Common Lisp standard's own hash; no library is involved."
  (let ((safe (remove-if-not (lambda (ch) (or (alphanumericp ch) (char= ch #\-)))
                             url)))
    (subseq (concatenate 'string (subseq safe 0 (min 40 (length safe)))
                        (format nil "-~D" (sxhash url)))
            0)))

(defun models-cache-file (url)
  (merge-pathnames (format nil "models/~A.json" (cache-slug url)) *cache-dir*))

(defun read-model-cache (url)
  "Return (values CATALOG FETCHED-AT) for URL's cache file, or (values NIL NIL)
when it is absent or unreadable."
  (let ((path (models-cache-file url)))
    (if (not (probe-file path))
        (values nil nil)
        (handler-case
            (let* ((document (parse-json (slurp path)))
                   (fetched-at (field "fetched_at" document))
                   (data (field "data" document)))
              (values (if (consp data) data nil) fetched-at))
          (error () (values nil nil))))))

(defun write-model-cache (url catalog)
  (let ((path (models-cache-file url)))
    (ensure-directories-exist path)
    (with-open-file (out path :direction :output :if-exists :supersede
                           :if-does-not-exist :create)
      (format out "{\"fetched_at\":~D,\"source\":~A,\"data\":~A}"
              (get-universal-time)
              (json-string url)
              (format nil "[~{~A~^,~}]"
                      (mapcar (lambda (entry)
                                (format nil "{\"id\":~A,\"name\":~A,\"deprecation_date\":~A,\"supported_parameters\":~A,\"context_length\":~A,\"pricing\":~A}"
                                        (json-string (or (getf entry :id) ""))
                                        (json-string (or (field "name" entry) ""))
                                        (if (field "deprecation_date" entry)
                                            (json-string (field "deprecation_date" entry))
                                            "null")
                                        (let ((parameters (field "supported_parameters" entry)))
                                          (if (consp parameters)
                                              (format nil "[~{~S~^,~}]" parameters)
                                              "null"))
                                        (or (field "context_length" entry) "null")
                                        (format nil "~S" (or (field "pricing" entry)
                                                             (list :prompt "0" :completion "0")))))
                              catalog))))
    path))

(defun fetch-model-catalog (url credentials)
  "GET URL with the provider's bearer token and return the parsed catalogue, or
NIL on any failure. Caching is the caller's business; this only does the I/O."
  (let* ((path (merge-pathnames "models-response.json" *runtime*))
         (err (merge-pathnames "models.err" *runtime*))
         (key (handler-case (funcall (credential-port-get credentials)
                                     (or (getf (provider-definition nil) :key-env)
                                         "OPENROUTER_API_KEY"))
                (error () nil))))
    (ensure-directories-exist path)
    (handler-case
        (with-open-file (out path :direction :output :if-exists :supersede
                               :if-does-not-exist :create)
          (with-open-file (error-stream err :direction :output :if-exists :supersede
                                         :if-does-not-exist :create)
            (unless (zerop (run-process
                            "curl"
                            (list "--fail-with-body" "--silent" "--show-error"
                                  "--connect-timeout" "20" "--max-time" "60"
                                  "-H" (format nil "Authorization: Bearer ~A" (or key ""))
                                  "-H" "Accept: application/json" url)
                            :output out :error error-stream))
              (error "model catalogue request failed: ~A" (trim (slurp error-stream))))))
      (error () nil))
    (handler-case
        (let ((data (field "data" (parse-json (slurp path)))))
          (if (consp data) data nil))
      (error () nil))))

(defun cached-model-catalog (url credentials &key force)
  "The catalogue for URL, fetched at most once per *MODEL-CACHE-TTL*.

A refresh that fails falls back to the stale entry rather than to NIL: the point
of a cache is that a flaky network does not change what Forgepair knows. FORCE
refreshes and is what --models uses."
  (multiple-value-bind (catalog fetched-at) (read-model-cache url)
    (cond ((and catalog (not force) (cache-fresh-p fetched-at)) catalog)
          (t
           (let ((fresh (fetch-model-catalog url credentials)))
             (cond (fresh (write-model-cache url fresh) fresh)
                   (catalog catalog)
                   (t nil)))))))

(defun provider-model-report (provider credentials &key force)
  "Resolve PROVIDER's model against the live catalogue.
Returns (values MODEL-ID NOTE) where MODEL-ID is what to send and NOTE is a line
of plain text for the user, or NIL when the catalogue says nothing useful."
  (let* ((configured (getf provider :model))
         (url (models-endpoint provider))
         (catalog (and url (cached-model-catalog url credentials :force force)))
         (resolved (resolve-model configured catalog)))
    (values resolved
            (cond ((null catalog)
                   (format nil "~A (catalogo indisponivel; usando o id configurado)" resolved))
                  ((not (string= resolved configured))
                   (format nil "~A -> ~A (variante resolvida pelo catalogo)"
                           configured resolved))
                  ((not (find configured (catalog-ids catalog) :test #'string=))
                   (format nil "~A (o catalogo do provider nao lista este id)" resolved))
                  ((model-deprecated-p resolved catalog)
                   (format nil "~A (DEPRECADO pelo provider: ~A)"
                           resolved
                           (field "deprecation_date" (catalog-entry resolved catalog))))
                  ((not (model-supports-tools-p resolved catalog))
                   (format nil "~A (o catalogo nao lista suporte a ferramentas)"
                           resolved))
                  (t (format nil "~A" resolved))))))