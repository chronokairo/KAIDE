(:mode :single
 :provider (:name "openrouter"
            :url "https://openrouter.ai/api/v1/chat/completions"
            :key-env "OPENROUTER_API_KEY"
            :model "deepseek/deepseek-v4.1-flash"
            :label "DeepSeek V4.1 Flash")
  :verify-command "sbcl --noinform --disable-debugger --script src/entrypoint.lisp --self-test")