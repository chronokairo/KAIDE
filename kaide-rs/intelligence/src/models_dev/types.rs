use std::collections::HashMap;
use serde::{Deserialize, Serialize};

/// Top-level catalog: provider_id → Provider
pub type Catalog = HashMap<String, Provider>;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Provider {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub api: String,
    #[serde(default)]
    pub env: Vec<String>,
    #[serde(default)]
    pub doc: String,
    pub models: HashMap<String, ModelInfo>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub family: String,
    #[serde(default)]
    pub reasoning: bool,
    #[serde(default)]
    pub tool_call: bool,
    #[serde(default)]
    pub temperature: bool,
    #[serde(default)]
    pub open_weights: bool,
    #[serde(default)]
    pub attachment: bool,
    #[serde(default)]
    pub limit: Limits,
    #[serde(default)]
    pub cost: Cost,
    #[serde(default)]
    pub modalities: Modalities,
    pub knowledge: Option<String>,
    pub release_date: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct Limits {
    #[serde(default)]
    pub context: u64,
    #[serde(default)]
    pub output: u64,
}

/// USD per million tokens — defaults to 0 (free / unknown)
#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct Cost {
    /// USD per million input tokens
    #[serde(default)]
    pub input: f64,
    /// USD per million output tokens
    #[serde(default)]
    pub output: f64,
    pub cache_read: Option<f64>,
    pub cache_write: Option<f64>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
pub struct Modalities {
    #[serde(default)]
    pub input: Vec<String>,
    #[serde(default)]
    pub output: Vec<String>,
}

/// Summary reference to a matching cloud model — attached to BenchResult.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloudMatch {
    pub provider: String,
    pub model_id: String,
    pub model_name: String,
    /// $/MTok input
    pub cost_in: f64,
    /// $/MTok output
    pub cost_out: f64,
    pub context_k: u64,
    pub reasoning: bool,
}
