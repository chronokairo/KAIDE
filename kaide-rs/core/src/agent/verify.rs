use crate::agent::state::AgentState;
use crate::tools::test::{self, VerificationStatus};

/// Action determined by the verification gate after workspace mutations
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum VerificationAction {
    /// Verification passed or no mutations occurred
    Pass,
    /// Verification failed, attempt repair if budget remains
    FailWithRepair {
        error: String,
        remaining_budget: usize,
    },
    /// Verification was skipped or unavailable
    Skip {
        reason: String,
    },
    /// Verification failed and exhausted repair budget or hit critical lock
    Halt {
        reason: String,
    },
}

/// Verification gate coordinator
#[derive(Debug, Clone)]
pub struct VerificationGate {
    pub max_repair_budget: usize,
    pub current_repair_count: usize,
    pub strict_mode: bool,
}

impl Default for VerificationGate {
    fn default() -> Self {
        Self {
            max_repair_budget: 3,
            current_repair_count: 0,
            strict_mode: false,
        }
    }
}

impl VerificationGate {
    pub fn new(max_repair_budget: usize, strict_mode: bool) -> Self {
        Self {
            max_repair_budget,
            current_repair_count: 0,
            strict_mode,
        }
    }

    /// Evaluates current workspace state and returns an action
    pub fn evaluate(
        &mut self,
        state: &mut AgentState,
        command_override: Option<&str>,
    ) -> VerificationAction {
        let result = test::run_tests(command_override.unwrap_or(""), &state.config);
        state.record_verification(result.clone());

        match result.status {
            VerificationStatus::Passed => {
                self.current_repair_count = 0;
                VerificationAction::Pass
            }
            VerificationStatus::Unavailable => {
                if self.strict_mode {
                    VerificationAction::Halt {
                        reason: "Strict mode requires working verification runner".into(),
                    }
                } else {
                    VerificationAction::Skip {
                        reason: result.output,
                    }
                }
            }
            VerificationStatus::Failed => {
                if self.current_repair_count < self.max_repair_budget {
                    self.current_repair_count += 1;
                    let remaining = self.max_repair_budget - self.current_repair_count;
                    VerificationAction::FailWithRepair {
                        error: result.output,
                        remaining_budget: remaining,
                    }
                } else {
                    VerificationAction::Halt {
                        reason: format!(
                            "Exhausted repair budget of {} attempts. Error:\n{}",
                            self.max_repair_budget, result.output
                        ),
                    }
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_verification_gate_budget() {
        let gate = VerificationGate::new(2, false);
        assert_eq!(gate.current_repair_count, 0);
        assert_eq!(gate.max_repair_budget, 2);
    }
}
