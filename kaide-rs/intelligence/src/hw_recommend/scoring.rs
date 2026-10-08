use crate::hw_recommend::detector::HardwareInfo;
use crate::hw_recommend::catalog::ModelEntry;

const QUANT_BYTES_PER_PARAM: &[(&str, f64)] = &[
    ("FP16", 2.0), ("Q8_0", 1.05), ("Q6_K", 0.80),
    ("Q5_K_M", 0.68), ("Q4_K_M", 0.58), ("Q3_K", 0.48), ("Q2_K", 0.37),
];

const FAMILY_QUALITY: &[(&str, f64, f64, f64)] = &[
    ("qwen3",    75.0, 82.0, 70.0),
    ("qwen2.5",  73.0, 85.0, 68.0),
    ("deepseek", 75.0, 78.0, 88.0),
    ("llama",    72.0, 75.0, 70.0),
    ("mistral",  70.0, 72.0, 75.0),
    ("gemma",    68.0, 68.0, 65.0),
    ("phi",      72.0, 75.0, 78.0),
    ("granite",  65.0, 75.0, 60.0),
];

const CATEGORY_WEIGHTS: &[(&str, [f64; 4])] = &[
    ("general",   [0.45, 0.35, 0.15, 0.05]),
    ("coding",    [0.55, 0.20, 0.15, 0.10]),
    ("reasoning", [0.60, 0.10, 0.20, 0.10]),
    ("chat",      [0.40, 0.40, 0.15, 0.05]),
];

const TARGET_SPEEDS: &[(&str, f64)] = &[
    ("general", 40.0), ("coding", 40.0), ("reasoning", 25.0), ("chat", 50.0),
];

const TARGET_CONTEXTS: &[(&str, u32)] = &[
    ("general", 4096), ("coding", 8192), ("reasoning", 8192), ("chat", 4096),
];

fn resolve_family_quality(family: &str, category: &str) -> f64 {
    for (f, base, coding, reasoning) in FAMILY_QUALITY {
        if *f == family {
            return match category {
                "coding" => *coding,
                "reasoning" => *reasoning,
                _ => *base,
            };
        }
    }
    60.0
}

fn memory_for_model(model: &ModelEntry) -> f64 {
    let bpp = QUANT_BYTES_PER_PARAM
        .iter()
        .find(|(q, _)| *q == model.quant)
        .map(|(_, bpp)| bpp)
        .unwrap_or(&0.58);
    model.params_b * bpp
}

fn estimate_tokens_per_second(hw: &HardwareInfo, model: &ModelEntry) -> f64 {
    if hw.has_dedicated_gpu && hw.gpu_vram_gb >= memory_for_model(model) as u32 {
        let gpu_speed = match hw.gpu_model.to_lowercase() {
            m if m.contains("rtx 5090") => 120.0,
            m if m.contains("rtx 4090") || m.contains("rtx 3090") => 80.0,
            m if m.contains("rtx 5080") => 100.0,
            m if m.contains("rtx 4080") => 65.0,
            m if m.contains("rtx 4070") => 50.0,
            m if m.contains("rtx 4060") || m.contains("rtx 3060") => 35.0,
            m if m.contains("gb10") || m.contains("dgx") => 150.0,
            _ => 30.0,
        };
        (gpu_speed / model.params_b.max(0.5)) * 4.0
    } else {
        let k = 2.0;
        let effective_threads = hw.cpu_physical_cores.min(8) as f64;
        (k * hw.cpu_ghz * effective_threads) / model.params_b.max(0.5)
    }
}

fn estimate_kv_cache_gb(model: &ModelEntry, ctx: u32) -> f64 {
    let layers = (model.params_b * 2.0) as u32;
    let hidden = (model.params_b * 1000.0) as u32;
    (2.0 * layers as f64 * hidden as f64 * ctx as f64 * 2.0) / (1024.0 * 1024.0 * 1024.0)
}

pub struct Score {
    pub total: f64,
    pub quality: f64,
    pub speed: f64,
    pub fit: f64,
    pub context: f64,
}

pub fn score_model(hw: &HardwareInfo, model: &ModelEntry, category: &str) -> Score {
    let weights = CATEGORY_WEIGHTS
        .iter()
        .find(|(c, _)| *c == category)
        .map(|(_, w)| *w)
        .unwrap_or([0.45, 0.35, 0.15, 0.05]);

    let quality_raw = resolve_family_quality(model.family, category);
    let params_bonus = (model.params_b.log2().max(0.0) * 3.0).min(15.0);
    let quant_penalty = match model.quant {
        "Q8_0" => 0.0, "Q6_K" => -1.0, "Q5_K_M" => -2.0,
        "Q4_K_M" => -5.0, "Q3_K" => -8.0, "Q2_K" => -12.0,
        _ => -5.0,
    };
    let quality = ((quality_raw + params_bonus + quant_penalty) / 100.0).clamp(0.0, 1.0);

    let tps = estimate_tokens_per_second(hw, model);
    let target_speed = TARGET_SPEEDS.iter()
        .find(|(c, _)| *c == category)
        .map(|(_, s)| *s)
        .unwrap_or(40.0);
    let speed = (tps / target_speed).min(1.0);

    let model_mem = memory_for_model(model);
    let ctx_target = TARGET_CONTEXTS.iter()
        .find(|(c, _)| *c == category)
        .map(|(_, c)| *c)
        .unwrap_or(4096);
    let kv_cache = estimate_kv_cache_gb(model, ctx_target);
    let total_needed = model_mem + kv_cache;
    let fit = if hw.has_dedicated_gpu && hw.gpu_vram_gb > 0 {
        (hw.gpu_vram_gb as f64 / total_needed).min(1.0)
    } else {
        (hw.usable_mem_gb / total_needed).min(1.0)
    };

    let ctx = (model.ctx_max as f64 / ctx_target as f64).min(1.0);

    let total = weights[0] * quality + weights[1] * speed + weights[2] * fit + weights[3] * ctx;

    Score { total: total * 100.0, quality, speed, fit, context: ctx }
}
