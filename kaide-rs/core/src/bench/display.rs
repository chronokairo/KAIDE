use crate::error::Result;
use super::model_bench::BenchResult;

const MEDAL: [&str; 3] = ["Α", "Β", "Γ"];

/// Displays the benchmark ranking table in a clean, formatted terminal view (Zero-Lib std).
pub fn show_ranking_table(results: &[BenchResult]) -> Result<()> {
    println!();
    println!("\x1b[1;36m  Σ MODEL BENCHMARK RANKING\x1b[0m \x1b[90m— actual vs predicted (hw_recommend)\x1b[0m");
    println!("{}", "─".repeat(110));

    // Header
    println!(
        "\x1b[1;33m{:<8} {:<22} {:>10} {:>10} {:>10} {:>10} {:>10} {:<18} {:<10}\x1b[0m",
        "Rank", "Model", "TPS actual", "TPS pred.", "HW Score", "Load (s)", "Gen (s)", "Cloud equiv.", "Status"
    );
    println!("{}", "─".repeat(110));

    for (i, r) in results.iter().enumerate() {
        let medal = if i < 3 && r.error.is_none() {
            MEDAL[i]
        } else {
            "  "
        };
        let rank_str = format!("{} {:>2}", medal, i + 1);

        let tps_str = if r.error.is_none() {
            format!("{:.1}", r.tps)
        } else {
            "—".to_string()
        };

        let pred_str = r
            .predicted_tps
            .map(|t| format!("{:.1}", t))
            .unwrap_or_else(|| "—".to_string());

        let hw_str = r
            .hw_score
            .map(|s| {
                let hw_rank = r.hw_rank.map(|n| format!(" #{n}")).unwrap_or_default();
                format!("{:.1}{}", s, hw_rank)
            })
            .unwrap_or_else(|| "—".to_string());

        let load_str = if r.load_ms > 0 {
            format!("{:.1}", r.load_ms as f64 / 1000.0)
        } else {
            "—".to_string()
        };

        let gen_str = if r.gen_ms > 0 {
            format!("{:.1}", r.gen_ms as f64 / 1000.0)
        } else {
            "—".to_string()
        };

        let status = if let Some(e) = &r.error {
            let short: String = e.chars().take(18).collect();
            format!("\x1b[31m✗ {}\x1b[0m", short)
        } else {
            "\x1b[32m✓ ok\x1b[0m".to_string()
        };

        let cloud_str = r
            .cloud_match
            .as_ref()
            .map(|c| format!("{} ${:.2}", shorten_id(&c.model_id, 14), c.cost_in))
            .unwrap_or_else(|| "—".to_string());

        let row_color = if r.error.is_some() {
            "\x1b[31m"
        } else if i == 0 {
            "\x1b[1;36m"
        } else {
            "\x1b[0m"
        };

        println!(
            "{}{:<8} {:<22} {:>10} {:>10} {:>10} {:>10} {:>10}\x1b[0m \x1b[90m{:<18}\x1b[0m {}",
            row_color,
            rank_str,
            shorten_id(&r.model, 20),
            tps_str,
            pred_str,
            hw_str,
            load_str,
            gen_str,
            cloud_str,
            status
        );
    }

    println!("{}", "─".repeat(110));

    let n_ok = results.iter().filter(|r| r.error.is_none()).count();
    let n_err = results.len() - n_ok;
    let agree = check_alignment(results);
    println!("  \x1b[32m✓ {} ok\x1b[0m  \x1b[31m✗ {} failed\x1b[0m  |  \x1b[90m{}\x1b[0m", n_ok, n_err, agree);
    println!();

    Ok(())
}

fn shorten_id(s: &str, max: usize) -> String {
    if s.len() <= max {
        s.to_string()
    } else {
        format!("{}…", &s[..max.saturating_sub(1)])
    }
}

/// Check whether actual ranking agrees with hw_recommend ranking.
fn check_alignment(results: &[BenchResult]) -> String {
    let ranked_with_hw: Vec<&BenchResult> = results
        .iter()
        .filter(|r| r.error.is_none() && r.hw_rank.is_some())
        .collect();

    if ranked_with_hw.len() < 2 {
        return "hw_recommend overlap: too few catalog matches to compare".to_string();
    }

    let top_actual = ranked_with_hw[0];
    let best_hw_rank = ranked_with_hw
        .iter()
        .min_by_key(|r| r.hw_rank.unwrap_or(999));

    if let Some(best_hw) = best_hw_rank {
        if best_hw.model == top_actual.model {
            format!("hw_recommend & actual agree: {} is best", top_actual.model)
        } else {
            format!(
                "divergence: actual best={} | hw_recommend best={}",
                top_actual.model, best_hw.model
            )
        }
    } else {
        "no catalog overlap".to_string()
    }
}
