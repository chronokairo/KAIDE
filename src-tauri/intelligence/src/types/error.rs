use std::fmt;

#[derive(Debug)]
pub enum AgentError {
    Llm(String),
    Tool(String),
    Plan(String),
    Config(String),
}

impl fmt::Display for AgentError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AgentError::Llm(msg) => write!(f, "LLM error: {}", msg),
            AgentError::Tool(msg) => write!(f, "Tool error: {}", msg),
            AgentError::Plan(msg) => write!(f, "Plan error: {}", msg),
            AgentError::Config(msg) => write!(f, "Config error: {}", msg),
        }
    }
}

impl std::error::Error for AgentError {}
