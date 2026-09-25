#[derive(Debug, Clone)]
pub struct ModelEntry {
    pub name: &'static str,
    pub family: &'static str,
    pub params_b: f64,
    pub ctx_max: u32,
    pub quant: &'static str,
    pub size_gb: f64,
    pub tags: &'static [&'static str],
}

pub fn get_catalog() -> Vec<ModelEntry> {
    vec![
        ModelEntry { name: "qwen3:0.6b", family: "qwen3", params_b: 0.6, ctx_max: 32768, quant: "Q4_K_M", size_gb: 0.5, tags: &["general", "chat"] },
        ModelEntry { name: "qwen2.5-coder:0.5b", family: "qwen2.5", params_b: 0.5, ctx_max: 32768, quant: "Q4_K_M", size_gb: 0.4, tags: &["coder"] },
        ModelEntry { name: "qwen2.5-coder:1.5b", family: "qwen2.5", params_b: 1.5, ctx_max: 32768, quant: "Q4_K_M", size_gb: 1.1, tags: &["coder"] },
        ModelEntry { name: "qwen3:1.7b", family: "qwen3", params_b: 1.7, ctx_max: 32768, quant: "Q4_K_M", size_gb: 1.3, tags: &["general", "chat"] },
        ModelEntry { name: "llama3.2:3b", family: "llama", params_b: 3.0, ctx_max: 131072, quant: "Q4_K_M", size_gb: 2.0, tags: &["chat", "general"] },
        ModelEntry { name: "granite3.3:2b", family: "granite", params_b: 2.0, ctx_max: 8192, quant: "Q4_K_M", size_gb: 1.5, tags: &["coding", "general"] },
        ModelEntry { name: "qwen2.5-coder:7b", family: "qwen2.5", params_b: 7.0, ctx_max: 32768, quant: "Q4_K_M", size_gb: 4.4, tags: &["coder"] },
        ModelEntry { name: "qwen3:8b", family: "qwen3", params_b: 8.0, ctx_max: 131072, quant: "Q4_K_M", size_gb: 5.5, tags: &["general", "chat"] },
        ModelEntry { name: "llama3.1:8b", family: "llama", params_b: 8.0, ctx_max: 131072, quant: "Q4_K_M", size_gb: 5.0, tags: &["chat", "general"] },
        ModelEntry { name: "deepseek-r1:8b", family: "deepseek", params_b: 8.0, ctx_max: 131072, quant: "Q4_K_M", size_gb: 5.0, tags: &["reasoning"] },
        ModelEntry { name: "mistral:7b", family: "mistral", params_b: 7.0, ctx_max: 32768, quant: "Q4_K_M", size_gb: 4.5, tags: &["chat", "general"] },
        ModelEntry { name: "gemma3:4b", family: "gemma", params_b: 4.0, ctx_max: 32768, quant: "Q4_K_M", size_gb: 3.0, tags: &["general", "chat"] },
        ModelEntry { name: "phi-4:14b", family: "phi", params_b: 14.0, ctx_max: 16384, quant: "Q4_K_M", size_gb: 8.0, tags: &["reasoning", "math"] },
        ModelEntry { name: "qwen3:14b", family: "qwen3", params_b: 14.0, ctx_max: 131072, quant: "Q4_K_M", size_gb: 9.0, tags: &["general", "chat"] },
        ModelEntry { name: "deepseek-r1:14b", family: "deepseek", params_b: 14.0, ctx_max: 131072, quant: "Q4_K_M", size_gb: 9.0, tags: &["reasoning"] },
        ModelEntry { name: "qwen2.5-coder:14b", family: "qwen2.5", params_b: 14.0, ctx_max: 32768, quant: "Q4_K_M", size_gb: 8.5, tags: &["coder"] },
        ModelEntry { name: "llama3.3:70b", family: "llama", params_b: 70.0, ctx_max: 131072, quant: "Q4_K_M", size_gb: 40.0, tags: &["chat", "general"] },
        ModelEntry { name: "deepseek-r1:32b", family: "deepseek", params_b: 32.0, ctx_max: 131072, quant: "Q4_K_M", size_gb: 20.0, tags: &["reasoning"] },
    ]
}
