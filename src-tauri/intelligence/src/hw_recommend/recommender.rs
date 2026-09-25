use crate::hw_recommend::detector::HardwareInfo;
use crate::hw_recommend::catalog::{ModelEntry, get_catalog};
use crate::hw_recommend::scoring::{score_model, Score};

pub struct Recommendation {
    pub model: ModelEntry,
    pub score: Score,
    pub category: String,
}

pub fn recommend(hw: &HardwareInfo, category: &str) -> Vec<Recommendation> {
    let mut results: Vec<Recommendation> = get_catalog()
        .into_iter()
        .filter(|m| {
            let mem_needed = m.params_b * 0.58 + 0.5;
            if hw.has_dedicated_gpu && hw.gpu_vram_gb > 0 {
                mem_needed <= hw.gpu_vram_gb as f64 * 0.85
            } else {
                mem_needed <= hw.usable_mem_gb * 0.85
            }
        })
        .map(|model| {
            let score = score_model(hw, &model, category);
            Recommendation { model, score, category: category.to_string() }
        })
        .collect();

    results.sort_by(|a, b| b.score.total.partial_cmp(&a.score.total).unwrap_or(std::cmp::Ordering::Equal));
    results.truncate(10);
    results
}

pub fn print_recommendations(hw: &HardwareInfo, category: &str) {
    let hw_tier = hardware_tier(hw);

    println!("\n═══ Hardware Summary ═══");
    println!("  CPU: {} ({} cores, {:.1} GHz)", hw.cpu_brand, hw.cpu_physical_cores, hw.cpu_ghz);
    println!("  RAM: {} GB total, {:.0} GB usable", hw.memory_total_gb, hw.usable_mem_gb);
    if hw.has_dedicated_gpu {
        println!("  GPU: {} ({} GB VRAM)", hw.gpu_model, hw.gpu_vram_gb);
    } else {
        println!("  GPU: {} (integrated/CPU)", hw.gpu_model);
    }
    println!("  Tier: {}", hw_tier);

    let recs = recommend(hw, category);
    if recs.is_empty() {
        println!("\n  No compatible models found for '{}'.", category);
        return;
    }

    println!("\n═══ Top {} Recommendations for '{}' ═══\n", recs.len(), category);
    for (i, rec) in recs.iter().enumerate() {
        let mem = rec.model.params_b * 0.58;
        println!("  {}. {:<30}  Score: {:>5.1}/100", i + 1, rec.model.name, rec.score.total);
        println!("     Family: {:<12} Parameters: {:<5.1}B  Size: {:.1} GB",
            rec.model.family, rec.model.params_b, mem);
        println!("     Context: {}  Quant: {}",
            rec.model.ctx_max, rec.model.quant);
        println!("     Q:{:.0}%  S:{:.0}%  F:{:.0}%  C:{:.0}%",
            rec.score.quality * 100.0, rec.score.speed * 100.0,
            rec.score.fit * 100.0, rec.score.context * 100.0);
        println!();
    }
}

fn hardware_tier(hw: &HardwareInfo) -> &'static str {
    let eff_mem = if hw.has_dedicated_gpu && hw.gpu_vram_gb > 0 {
        hw.gpu_vram_gb as f64
    } else {
        hw.usable_mem_gb
    };

    if eff_mem >= 80.0 { "ULTRA_HIGH (80GB+)" }
    else if eff_mem >= 48.0 { "VERY_HIGH (48GB+)" }
    else if eff_mem >= 24.0 { "HIGH (24GB+)" }
    else if eff_mem >= 16.0 { "MEDIUM_HIGH (16GB+)" }
    else if eff_mem >= 12.0 { "MEDIUM (12GB+)" }
    else if eff_mem >= 8.0 { "MEDIUM_LOW (8GB+)" }
    else if eff_mem >= 4.0 { "LOW (4GB+)" }
    else { "ULTRA_LOW (<4GB)" }
}
