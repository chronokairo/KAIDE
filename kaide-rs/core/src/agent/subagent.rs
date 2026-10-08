use crate::agent::state::AgentState;
use crate::protocol::event_log::CanonicalEventLog;
use crate::protocol::EventMsg;
use crate::error::{anyhow, Result};

/// Maximum nesting depth allowed for sub-agents to avoid infinite forks
pub const MAX_SUBAGENT_DEPTH: usize = 3;

/// Isolated subagent configuration
#[derive(Debug, Clone)]
pub struct SubagentConfig {
    pub prompt: String,
    pub description: String,
    pub max_tokens: Option<usize>,
    pub max_depth: usize,
    pub current_depth: usize,
}

/// Structured outcome returned by a subagent execution
#[derive(Debug, Clone)]
pub struct SubagentOutcome {
    pub subagent_id: String,
    pub success: bool,
    pub output: String,
    pub files_mutated: Vec<String>,
    pub tokens_used: usize,
}

/// Subagent session representation
pub struct SubagentSession {
    pub id: String,
    pub config: SubagentConfig,
    pub event_log: CanonicalEventLog,
}

impl SubagentSession {
    pub fn new(id: impl Into<String>, config: SubagentConfig) -> Result<Self> {
        if config.current_depth >= config.max_depth {
            return Err(anyhow!(
                "Subagent spawn blocked: maximum depth limit of {} reached (current: {})",
                config.max_depth,
                config.current_depth
            ));
        }

        Ok(Self {
            id: id.into(),
            config,
            event_log: CanonicalEventLog::new(),
        })
    }

    /// Spawns subagent child state derived from parent
    pub fn create_child_state(&self, parent: &AgentState) -> Result<AgentState> {
        let child_config = parent.config.clone();
        let mut child_state = AgentState::new(child_config)?;
        child_state.session_persist = false;
        Ok(child_state)
    }

    pub fn record_event(&mut self, event: EventMsg) {
        self.event_log.append(&self.id, 1, event);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_subagent_depth_limit() {
        let config_ok = SubagentConfig {
            prompt: "do something".into(),
            description: "worker".into(),
            max_tokens: Some(1000),
            max_depth: 3,
            current_depth: 2,
        };
        assert!(SubagentSession::new("sub_1", config_ok).is_ok());

        let config_blocked = SubagentConfig {
            prompt: "do something".into(),
            description: "worker".into(),
            max_tokens: Some(1000),
            max_depth: 3,
            current_depth: 3,
        };
        assert!(SubagentSession::new("sub_2", config_blocked).is_err());
    }
}
