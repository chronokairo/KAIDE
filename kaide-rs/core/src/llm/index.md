# src/llm directory

This directory contains LLM-related modules.

## Files

- `client.rs` - LLM client
- `infer/` - Inference submodule
- `mod.rs` - Module definition for llm
- `prompt.rs` - Prompt handling
- `model_resolver.rs` - Local GGUF model resolution
- `provider_chain.rs` - Fallback chain with rate limiting
- `router.rs` - Runtime router between local and cloud backends