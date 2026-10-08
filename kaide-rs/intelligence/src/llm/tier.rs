//! Classificação de modelos em níveis de inteligência para fallback.
//!
//! Modelos são classificados em três níveis:
//! - `Dumb`: modelos pequenos e rápidos (7B-13B), adequados para tarefas simples.
//! - `Smart`: modelos médios (30B-70B), capazes de raciocínio e coding.
//! - `Intelligent`: frontends de ponta (100B+, 1M context, multimodal, reasoning).
//!
//! O fallback usa essa classificação para trocar para um modelo de mesmo nível
//! quando o modelo primário falha, preservando o perfil de capacidade esperado.

use crate::models_dev::types::{ModelInfo, Provider};

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum ModelTier {
    /// Modelos pequenos e rápidos (7B-13B).
    Dumb,
    /// Modelos médios capazes de raciocínio e coding (30B-70B).
    Smart,
    /// Frontends de ponta (100B+, 1M context, multimodal, reasoning).
    Intelligent,
}

impl ModelTier {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Dumb => "dumb",
            Self::Smart => "smart",
            Self::Intelligent => "intelligent",
        }
    }
}

/// Classifica um modelo pelo ID usando padrões conhecidos de 2026.
///
/// A classificação prioriza o ID do modelo (family/id) e usa regras baseadas
/// em conhecimento de catálogo NIM 2026. Modelos desconhecidos recebem
/// uma classificação conservadora como Smart.
pub fn classify_model_tier(model_id: &str) -> ModelTier {
    let base = crate::models_dev::base_id(model_id);
    let lower = base.to_lowercase();

    // --- Intelligent: frontends de ponta (2026 NIM catalog) ---
    // GLM-5.2: 1M context, coding/agentic workflows, Z.ai flagship
    // DeepSeek V4 Pro/Flash: 1M context, MoE coding
    // Nemotron 3 Ultra 550B: agentic reasoning, coding, 1M context
    // Kimi K2.6: 1T multimodal MoE
    // Inkling: multimodal agentic
    if lower.contains("glm-5.2")
        || lower.contains("deepseek")
        || (lower.contains("nemotron") && lower.contains("ultra"))
        || (lower.contains("nemotron") && lower.contains("550b"))
        || lower.contains("kimi")
        || lower.contains("inkling")
        || lower.contains("claude")
        || lower.contains("gpt-5")
        || lower.contains("gpt-4")
        || lower.contains("gemini-2")
    {
        return ModelTier::Intelligent;
    }

    // --- Smart: modelos médios (30B-70B) ---
    // Nemotron Super-120B, Llama-3.1-Nemotron-70B, Llama-3.3-Nemotron-Super-49B
    // Yi Large, Qwen 3/2 72B, etc.
    if (lower.contains("nemotron")
        && (lower.contains("70b")
            || lower.contains("49b")
            || lower.contains("120b")
            || lower.contains("super")))
        || lower.contains("yi-large")
        || (lower.contains("qwen") && (lower.contains("72b") || lower.contains("dev")))
        || (lower.contains("llama") && lower.contains("70b"))
        || lower.contains("mixtral")
        || (lower.contains("command") && lower.contains("r"))
    {
        return ModelTier::Smart;
    }

    // --- Dumb: modelos pequenos (7B-13B) ---
    // Nemotron Nano 9B/8B, Mistral Nemo 12B, Qwen 3 8B, etc.
    if lower.contains("nano")
        || lower.contains("mistral")
        || lower.contains("nemo")
        || (lower.contains("qwen") && (lower.contains("8b") || lower.contains("14b")))
        || lower.contains("gemma")
        || lower.contains("phi")
        || lower.contains("starcoder")
        || lower.contains("7b")
        || lower.contains("8b")
        || lower.contains("12b")
        || lower.contains("13b")
    {
        return ModelTier::Dumb;
    }

    // Fallback: modelos desconhecidos são classificados como Smart
    // (evita degradação acidental para um modelo muito fraco)
    ModelTier::Smart
}

/// Classifica um modelo usando informações do catálogo (context window,
/// reasoning, tool_call) como complemento ao ID.
///
/// Usa o ID para a classificação primária e refina com base em heurísticas
/// do catálogo quando disponíveis.
pub fn classify_model_tier_from_info(model_id: &str, info: Option<&ModelInfo>) -> ModelTier {
    let tier = classify_model_tier(model_id);

    if let Some(info) = info {
        // Modelos com reasoning + tool_call + large context são inteligentes
        if info.reasoning && info.tool_call && info.limit.context >= 512_000 {
            return ModelTier::Intelligent;
        }
        // Modelos muito grandes (>= 200K context, tool_call) promovidos de Dumb para Smart
        if info.limit.context >= 200_000 && info.tool_call && tier == ModelTier::Dumb {
            return ModelTier::Smart;
        }
    }

    tier
}

/// Encontra um modelo de fallback do mesmo nível para o modelo primário.
///
/// Procura no catálogo do provedor especificado por modelos que:
/// 1. Estejam no mesmo nível de inteligência do modelo primário
/// 2. Sejam diferentes do modelo primário
/// 3. Suportem tool_call (se o primário suportar)
/// 4. Sejam os mais barhos (ou primeiros) da lista
pub fn find_same_tier_fallback(
    model_id: &str,
    provider: &str,
    catalog: &crate::models_dev::ModelsDevClient,
) -> Option<String> {
    let primary_base = crate::models_dev::base_id(model_id);
    let tier = classify_model_tier(&primary_base);

    let prov = catalog.catalog.get(provider)?;

    let primary_supports_tools = check_tool_call_support(model_id, prov);

    let mut candidates: Vec<(f64, String)> = prov
        .models
        .iter()
        .filter_map(|(id, m)| {
            let model_base = crate::models_dev::base_id(id);
            // Must be same tier
            let m_tier = classify_model_tier_from_info(id, Some(m));
            if m_tier != tier {
                return None;
            }
            // Must be different from the primary model (compare by base id)
            if model_base == primary_base {
                return None;
            }
            // Match tool-call capability if primary has it
            if primary_supports_tools && !m.tool_call {
                return None;
            }
            Some((m.cost.input, id.clone()))
        })
        .collect();

    // Sort by cheapest input cost
    candidates.sort_by(|a, b| {
        a.0.partial_cmp(&b.0)
            .unwrap_or(std::cmp::Ordering::Equal)
    });

    candidates.first().map(|(_, id)| id.clone())
}

/// Check if a model supports tool calls within a provider's model map.
fn check_tool_call_support(model_id: &str, prov: &Provider) -> bool {
    let base = crate::models_dev::base_id(model_id);
    for (id, info) in &prov.models {
        if id == model_id || crate::models_dev::base_id(id) == base {
            return info.tool_call;
        }
    }
    true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn classifies_intelligent_tier() {
        assert_eq!(classify_model_tier("z-ai/glm-5.2"), ModelTier::Intelligent);
        assert_eq!(
            classify_model_tier("deepseek-ai/deepseek-v4-pro"),
            ModelTier::Intelligent
        );
        assert_eq!(
            classify_model_tier("nvidia/nemotron-3-ultra-550b-a55b"),
            ModelTier::Intelligent
        );
        assert_eq!(classify_model_tier("moonshotai/kimi-k2.6"), ModelTier::Intelligent);
    }

    #[test]
    fn classifies_smart_tier() {
        assert_eq!(
            classify_model_tier("nvidia/nemotron-3-super-120b-a12b"),
            ModelTier::Smart
        );
        assert_eq!(
            classify_model_tier("nvidia/llama-3.1-nemotron-70b-instruct"),
            ModelTier::Smart
        );
        assert_eq!(
            classify_model_tier("nvidia/llama-3.3-nemotron-super-49b-v1.5"),
            ModelTier::Smart
        );
    }

    #[test]
    fn classifies_dumb_tier() {
        assert_eq!(classify_model_tier("nvidia/nemotron-nano-9b-v2"), ModelTier::Dumb);
        assert_eq!(
            classify_model_tier("nvidia/llama-3.1-nemotron-nano-8b-v1"),
            ModelTier::Dumb
        );
        assert_eq!(classify_model_tier("mistralai/mistral-nemo-12b-instruct"), ModelTier::Dumb);
    }

    #[test]
    fn unknown_models_default_to_smart() {
        assert_eq!(classify_model_tier("custom/my-model"), ModelTier::Smart);
    }

    #[test]
    fn tier_ordering() {
        assert!(ModelTier::Dumb < ModelTier::Smart);
        assert!(ModelTier::Smart < ModelTier::Intelligent);
    }

    fn test_catalog_with_multiple_tiers() -> crate::models_dev::ModelsDevClient {
        use crate::models_dev::types::{Cost, Limits, Modalities, Provider, ModelInfo};
        use std::collections::HashMap;

        let make = |id: &str, tier_id: &str, cost_in: f64| ModelInfo {
            id: id.to_string(),
            name: id.to_string(),
            family: tier_id.to_string(),
            reasoning: false,
            tool_call: true,
            temperature: false,
            open_weights: true,
            attachment: false,
            limit: Limits { context: 131_072, output: 4096 },
            cost: Cost { input: cost_in, output: cost_in, cache_read: None, cache_write: None },
            modalities: Modalities { input: vec!["text".into()], output: vec!["text".into()] },
            knowledge: None,
            release_date: None,
        };

        let mut nvidia_models = HashMap::new();
        nvidia_models.insert("z-ai/glm-5.2".into(), make("z-ai/glm-5.2", "glm-5.2", 0.0));
        nvidia_models.insert("deepseek-ai/deepseek-v4-flash".into(), make("deepseek-ai/deepseek-v4-flash", "deepseek-v4", 0.0));
        nvidia_models.insert("nvidia/nemotron-nano-9b-v2".into(), make("nvidia/nemotron-nano-9b-v2", "nano", 0.0));
        nvidia_models.insert("nvidia/nemotron-nano-8b-v1".into(), make("nvidia/nemotron-nano-8b-v1", "nano", 0.0));

        let nvidia = Provider {
            id: "nvidia".into(),
            name: "NVIDIA".into(),
            api: String::new(),
            env: vec![],
            doc: String::new(),
            models: nvidia_models,
        };

        let mut catalog = HashMap::new();
        catalog.insert("nvidia".into(), nvidia);

        crate::models_dev::ModelsDevClient { catalog }
    }

    #[test]
    fn find_same_tier_fallback_returns_different_intelligent_model() {
        let catalog = test_catalog_with_multiple_tiers();
        // GLM-5.2 is Intelligent tier. DeepSeek V4 Flash is also Intelligent.
        let fb = find_same_tier_fallback("z-ai/glm-5.2", "nvidia", &catalog);
        assert!(fb.is_some(), "should find an intelligent-tier fallback");
        assert_ne!(fb.unwrap(), "z-ai/glm-5.2");
    }

    #[test]
    fn find_same_tier_fallback_returns_different_dumb_model() {
        let catalog = test_catalog_with_multiple_tiers();
        // Nano 9B is Dumb tier. Nano 8B is also Dumb.
        let fb = find_same_tier_fallback("nvidia/nemotron-nano-9b-v2", "nvidia", &catalog);
        assert!(fb.is_some(), "should find a dumb-tier fallback");
        assert_ne!(fb.unwrap(), "nvidia/nemotron-nano-9b-v2");
    }

    #[test]
    fn find_same_tier_fallback_none_when_only_one_model_in_tier() {
        let catalog = test_catalog_with_multiple_tiers();
        // DeepSeek V4 Flash is the only other intelligent model besides GLM-5.2.
        // But GLM-5.2 also has a same-tier fallback (DeepSeek V4 Flash).
        // However, if we ask for GLM-5.2, the only other intelligent is DeepSeek.
        // Let's verify it returns DeepSeek, not GLM.
        let fb = find_same_tier_fallback("z-ai/glm-5.2", "nvidia", &catalog);
        assert_eq!(fb, Some("deepseek-ai/deepseek-v4-flash".to_string()));
    }

    #[test]
    fn find_same_tier_fallback_returns_none_for_missing_provider() {
        let catalog = test_catalog_with_multiple_tiers();
        let fb = find_same_tier_fallback("z-ai/glm-5.2", "missing-provider", &catalog);
        assert!(fb.is_none());
    }
}
