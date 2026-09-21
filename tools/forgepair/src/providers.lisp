;;;; Provider catalog and selection policy.
;;;; 2026 snapshot researched from provider /models catalogs and
;;;; https://build.nvidia.com/models (NVIDIA catalog updated 2026-08-06).

(in-package :forgepair)

(defparameter *model-providers*
  '((:name "openrouter"
     :models-url "https://openrouter.ai/api/v1/models"
     :url "https://openrouter.ai/api/v1/chat/completions"
    :key-env "OPENROUTER_API_KEY"
    :model "deepseek/deepseek-v4.1-flash"
    :models ("anthropic/claude-opus-5"
          "anthropic/claude-sonnet-5"
          "deepseek/deepseek-v4.1-flash"
          "deepseek/deepseek-v4-flash-0731"
          "google/gemma-4-26b-a4b-it"
          "google/gemma-4-31b-it"
          "inference-net/schematron-v2-turbo"
          "nvidia/nemotron-3.5-lightning"
          "openai/gpt-5.5"))
    (:name "nvidia"
     :models-url "https://integrate.api.nvidia.com/v1/models"
     :url "https://integrate.api.nvidia.com/v1/chat/completions"
    :key-env "NVIDIA_API_KEY"
    :model "nvidia/nemotron-3.5-lightning-30b-a3b"
    :models ("deepseek-ai/deepseek-v4-flash-0731"
         "google/gemma-4-31b-it"
         "moonshotai/kimi-k2.6"
         "moonshotai/kimi-k3"
         "nvidia/nemotron-3-super-120b-a12b"
         "nvidia/nemotron-3-ultra-550b-a55b"
         "nvidia/nemotron-3.5-lightning-30b-a3b"
         "nvidia/nemotron-4-340b-instruct"
         "z-ai/glm-5.3"
         "z-ai/glm-5.3-flash"))
    (:name "groq"
     :models-url "https://api.groq.com/openai/v1/models"
     :url "https://api.groq.com/openai/v1/chat/completions"
    :key-env "GROQ_API_KEY"
    :model "qwen/qwen3.8-27b"
    :models ("qwen/qwen3.8-27b"))
    (:name "ollama"
     :models-url "https://ollama.com/v1/models"
     :url "https://ollama.com/v1/chat/completions"
    :key-env "OLLAMA_API_KEY"
    :model "deepseek-v4.1-flash"
    :models ("deepseek-v4-flash:0731"
          "deepseek-v4-pro:0813"
          "deepseek-v4.1-flash"
          "gemma4:31b"
          "glm-5.1"
          "glm-5.2"
          "glm-5.3"
          "glm-5.3-flash"
          "kimi-k2.6"
          "kimi-k2.7-code"
          "kimi-k3"
          "minimax-m2.7"
          "minimax-m3"
          "nemotron-3-super"
          "nemotron-3-ultra"
          "qwen3.5:397b"))
    (:name "gemini"
     :models-url "https://generativelanguage.googleapis.com/v1beta/openai/models"
     :url "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
     :key-env "GEMINI_API_KEY"
     :model "gemini-3.6-flash"
     :models ("gemini-3.6-flash"
              "gemini-3.5-flash"))))

(defun provider-definition (name)
  (find (string-downcase name) *model-providers*
        :key (lambda (provider) (getf provider :name))
        :test #'string=))

;;; Curated tier from Fabio Akita's LLM coding benchmark (akitaonrails/
;;; llm-coding-benchmark, docs/success_report*.md): a 0-100 holistic rubric with
;;; runtime-viability validation. This list is further filtered to ONLY models
;;; that were live-verified to return HTTP 200 with these credentials (probe run
;;; 2026-09-21; re-run any time with `bin/forgepair --verify-models`). Models
;;; that Akita rates highly but which are unavailable here (OpenRouter monthly
;;; limit, NVIDIA/Gemini per-account gating) are intentionally excluded so the
;;; agent never selects a model that will fail. Ordered best-first by capability
;;; (larger/stronger coding models first).
(defparameter *akita-tier*
  '((:label "GPT-OSS 120B"       :score 88 :cost 5 :provider "groq"   :model "openai/gpt-oss-120b")
    (:label "Gemini 3.6 Flash"   :score 82 :cost 2 :provider "gemini" :model "gemini-3.6-flash")
    (:label "Nemotron 3.5 Lightning 30B" :score 81 :cost 3 :provider "nvidia" :model "nvidia/nemotron-3.5-lightning-30b-a3b")
    (:label "Qwen3.8 27B"        :score 80 :cost 2 :provider "groq"   :model "qwen/qwen3.8-27b")
    (:label "Gemini 3.5 Flash"   :score 78 :cost 1 :provider "gemini" :model "gemini-3.5-flash")
    (:label "Nemotron 3 Super 120B" :score 84 :cost 6 :provider "nvidia" :model "nvidia/nemotron-3-super-120b-a12b")
    (:label "GPT-OSS 20B"        :score 76 :cost 1 :provider "groq"   :model "openai/gpt-oss-20b"))
  "Best-first coding models per Akita's benchmark, filtered to live-verified
STABLE working models (probe 2026-09-21): Groq, NVIDIA and Gemini. :score is the
Akita coding rubric (0-100); :cost is a relative price index (1=cheapest). The
planner uses the top of this tier; the executor is chosen by cost-benefit
(score/cost); the improver by capability. OpenRouter is excluded here because
this account's credits are exhausted (HTTP 402/403). Each entry's :model is
exactly what gets sent to the provider. Re-audit with `bin/forgepair
--verify-models`.")

;;; Candidate pool for `--verify-models`: superset of Akita Tier A mapped to the
;;; providers wired here. The verifier probes each and reports which respond, so
;;; *akita-tier* above can be regenerated from real availability.
(defparameter *verify-candidates*
  '(("openrouter" "anthropic/claude-opus-5")
    ("openrouter" "anthropic/claude-sonnet-5")
    ("openrouter" "openai/gpt-5.6-terra")
    ("openrouter" "deepseek/deepseek-v4-pro-0813")
    ("openrouter" "moonshotai/kimi-k3")
    ("openrouter" "z-ai/glm-5.3")
    ("nvidia" "nvidia/nemotron-3-super-120b-a12b")
    ("nvidia" "nvidia/nemotron-3.5-lightning-30b-a3b")
    ("nvidia" "moonshotai/kimi-k2.6")
    ("nvidia" "deepseek-ai/deepseek-v4-flash-0731")
    ("gemini" "gemini-3.8-flash")
    ("gemini" "gemini-3.6-flash")
    ("gemini" "gemini-3.5-flash")
    ("gemini" "gemini-3.1-pro-preview")
    ("groq" "openai/gpt-oss-120b")
    ("groq" "openai/gpt-oss-20b")
    ("groq" "qwen/qwen3.8-27b")))

(defun credential-available-p (credentials key-env)
  "True when the credential is present without signaling; never prints it."
  (handler-case (progn (funcall (credential-port-get credentials) key-env) t)
    (error () nil)))

(defun tier-entry->role-provider (entry role)
  "Turn a tier entry into a role provider plist the http port understands.
The entry's :model and :label are placed FIRST so getf returns them instead of
the provider's default :model. :score and :cost are also carried over so the
planner can inspect them after selection."
  (let ((provider (provider-definition (getf entry :provider))))
    (append (list :name (string-downcase (string role))
                  :model (getf entry :model)
                  :label (getf entry :label)
                  :score (getf entry :score)
                  :cost  (getf entry :cost))
            (copy-list provider))))

(defun available-tier (credentials)
  "Tier entries whose provider credential is present, best-first by capability.

The source list is a curated snapshot, not a guarantee that entries are
ordered by score (newer entries may be appended). Sort a copy here so the
planner really receives the best available model."
  (sort
   (remove-if-not
    (lambda (entry)
      (credential-available-p credentials
                              (getf (provider-definition (getf entry :provider)) :key-env)))
    (copy-list *akita-tier*))
   (lambda (left right)
     (or (> (or (getf left :score) 0) (or (getf right :score) 0))
         (and (= (or (getf left :score) 0) (or (getf right :score) 0))
              (< (or (getf left :cost) most-positive-fixnum)
                 (or (getf right :cost) most-positive-fixnum)))))))

(defun cost-benefit (entry)
  "Higher is better: Akita score per unit of relative cost."
  (/ (float (or (getf entry :score) 1)) (max 1 (or (getf entry :cost) 1))))

(defun auto-select-roles (credentials)
  "Planner-driven automatic selection. Returns (values planner executor improver
pool), where:
  - planner  = best model of the tier (top score available) — orchestrates.
  - executor = model A, chosen by best cost-benefit (score/cost).
  - improver = model B, chosen by capability (score).
  - pool     = the full available tier (best-first) for model-swapping on
               failed validation.
No provider-distinctness constraint: the executor and improver may share the
planner's provider (each role keeps its own model and system prompt). Signals a
clear error if no provider credential is present."
  (let ((available (available-tier credentials)))
    (unless available
      (error "automatic selection needs at least one provider credential in .env ~
(OPENROUTER_API_KEY, NVIDIA_API_KEY, GEMINI_API_KEY, GROQ_API_KEY)."))
    (let* ((planner (first available))
           ;; Everything below the planner, best-first. No provider filtering.
           (rest (or (remove planner available) available))
           (executor (first (sort (copy-list rest) #'> :key #'cost-benefit)))
           (improver (first (sort (copy-list rest) #'>
                                  :key (lambda (e) (or (getf e :score) 0))))))
      (values (tier-entry->role-provider planner :planner)
              (tier-entry->role-provider executor :executor)
              (tier-entry->role-provider improver :improver)
              available))))

(defun swap-model (current-role-provider role pool &key exclude-models)
  "Pick the next candidate from POOL for ROLE, skipping the model currently in
CURRENT-ROLE-PROVIDER (used when the planner rejects a result). Candidates are
ordered by the same criterion used at initial selection:
  - :executor  -> best cost-benefit (score/cost)
  - :improver  -> highest score
  - any other  -> pool order (best-first)
Falls back to any other model when the preferred candidate was already tried.
EXCLUDE-MODELS contains candidates already tried in this turn, preventing a
failed validation from cycling back to an earlier model. Returns the current
role provider unchanged if the pool offers no alternative."
  (let* ((current-model (getf current-role-provider :model))
         (alternatives (remove current-model pool
                               :key (lambda (e) (getf e :model)) :test #'string=))
         (alternatives (remove-if
                        (lambda (entry)
                          (member (getf entry :model) exclude-models :test #'string=))
                        alternatives))
         (sorted (cond ((eq role :executor)
                        (sort (copy-list alternatives) #'> :key #'cost-benefit))
                       ((eq role :improver)
                        (sort (copy-list alternatives) #'>
                              :key (lambda (e) (or (getf e :score) 0))))
                       (t alternatives))))
    (if sorted
        (tier-entry->role-provider (first sorted) role)
        current-role-provider)))

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
