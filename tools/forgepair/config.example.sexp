(:mode :single
  :provider (:name "openrouter"
             :url "https://openrouter.ai/api/v1/chat/completions"
             :key-env "OPENROUTER_API_KEY"
             :model "deepseek/deepseek-v4.1-flash"
             :label "DeepSeek V4.1 Flash")
  ;; The repository's own check, run inside the sandbox after each attempt. Its
  ;; exit code is the evidence a model cannot argue with (ADR-0011). Point it at
  ;; the fastest command that still discriminates a bad patch. Set it to "" to
  ;; run no mechanical gate and leave conformance to the local decider alone.
  :verify-command "sbcl --noinform --disable-debugger --script src/entrypoint.lisp --self-test")