//! Model capability declaration and compatibility filtering.
//!
//! Each candidate model declares what it can do. The router *filters*
//! incapable candidates before any scoring runs, so a task that needs tool use
//! never lands on a GGUF engine that cannot call tools, and a task whose
//! context exceeds a model's window never lands on that model.

use crate::llm::routing::complexity::Complexity;
use crate::llm::routing::RoutingContext;
use crate::providers::types::ModelInfo;

/// Capabilities a model declares. `max_context` is the effective context
/// window in tokens the router budgets against.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ModelCapabilities {
    pub coding: bool,
    pub reasoning: bool,
    pub tool_use: bool,
    pub long_context: bool,
    pub structured_output: bool,
    pub vision: bool,
    pub max_context: usize,
}

impl ModelCapabilities {
    /// Conservative defaults for a small local SLM (e.g. qwen3:1.7b).
    pub fn local_default(max_context: usize) -> Self {
        Self {
            coding: true,
            reasoning: false,
            tool_use: true,
            long_context: false,
            structured_output: false,
            vision: false,
            max_context,
        }
    }

    /// Defaults for a capable remote model when the catalog is silent.
    pub fn remote_default() -> Self {
        Self {
            coding: true,
            reasoning: true,
            tool_use: true,
            long_context: true,
            structured_output: true,
            vision: false,
            max_context: 128_000,
        }
    }

    /// Build capabilities from a provider catalog entry.
    pub fn from_catalog(info: &ModelInfo, fallback_context: usize) -> Self {
        let max_context = if info.limit.context > 0 {
            info.limit.context as usize
        } else {
            fallback_context
        };
        Self {
            coding: true,
            reasoning: info.reasoning,
            tool_use: info.tool_call,
            long_context: max_context >= 64_000,
            structured_output: info.tool_call,
            vision: info.attachment,
            max_context,
        }
    }

    /// Whether this model can handle the task's structural requirements:
    /// tool use, a context that fits the window, and (for hard tasks) the
    /// ability to reason.
    pub fn compatible_with(&self, context: &RoutingContext, complexity: Complexity) -> bool {
        if context.requires_tool_use && !self.tool_use {
            return false;
        }
        if context.session_tokens > self.max_context {
            return false;
        }
        if complexity.prefers_remote() && !self.reasoning && context.requires_tool_use {
            // Local models without reasoning still *can* attempt hard tasks,
            // but only as a last resort; the scorer penalizes them heavily.
            return true;
        }
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ctx(tokens: usize, tool: bool) -> RoutingContext {
        RoutingContext {
            session_tokens: tokens,
            requires_tool_use: tool,
            ..RoutingContext::default()
        }
    }

    #[test]
    fn no_tool_use_local_is_filtered_for_tool_tasks() {
        let caps = ModelCapabilities {
            tool_use: false,
            ..ModelCapabilities::local_default(8192)
        };
        assert!(!caps.compatible_with(&ctx(100, true), Complexity::Simple));
        assert!(caps.compatible_with(&ctx(100, false), Complexity::Simple));
    }

    #[test]
    fn oversized_context_is_filtered() {
        let caps = ModelCapabilities::local_default(8192);
        assert!(!caps.compatible_with(&ctx(9000, true), Complexity::Simple));
        assert!(caps.compatible_with(&ctx(8000, true), Complexity::Simple));
    }

    #[test]
    fn catalog_maps_tool_and_context() {
        let info = crate::providers::types::ModelInfo {
            id: "m".into(),
            name: "m".into(),
            family: "f".into(),
            reasoning: true,
            tool_call: true,
            temperature: false,
            open_weights: true,
            attachment: true,
            limit: crate::providers::types::Limits {
                context: 131_072,
                output: 4096,
            },
            cost: crate::providers::types::Cost {
                input: 0.5,
                output: 1.0,
                cache_read: None,
                cache_write: None,
            },
            modalities: crate::providers::types::Modalities::default(),
            knowledge: None,
            release_date: None,
        };
        let caps = ModelCapabilities::from_catalog(&info, 8192);
        assert!(caps.tool_use);
        assert!(caps.reasoning);
        assert!(caps.long_context);
        assert!(caps.vision);
        assert_eq!(caps.max_context, 131_072);
    }
}
