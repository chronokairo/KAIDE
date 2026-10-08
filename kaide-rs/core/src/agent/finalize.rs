use crate::agent::state::AgentState;
use crate::tools::test::VerificationStatus;
use crate::error::Result;

#[derive(Debug, Clone)]
pub struct FinalizeSummary {
    pub files_changed: Vec<String>,
    pub verification_passed: bool,
    pub verification_output: Option<String>,
    pub turn_cost_usd: f64,
    pub pending_todos: Vec<String>,
}

/// Finalizes a turn: commits mutations or rolls back on failure if requested
pub fn finalize_turn(state: &mut AgentState, rollback_on_fail: bool) -> Result<FinalizeSummary> {
    let last_verification = state.verification.clone();
    let passed = last_verification
        .as_ref()
        .map(|v| v.status == VerificationStatus::Passed || v.status == VerificationStatus::Unavailable)
        .unwrap_or(true);

    if !passed && rollback_on_fail {
        let _ = state.rollback_changes()?;
    }

    let files_changed: Vec<String> = state.changed_files.iter().cloned().collect();
    let pending_todos: Vec<String> = state
        .todos
        .iter()
        .filter(|t| !t.done)
        .map(|t| t.text.clone())
        .collect();

    Ok(FinalizeSummary {
        files_changed,
        verification_passed: passed,
        verification_output: last_verification.map(|v| v.output),
        turn_cost_usd: state.turn_cost_usd,
        pending_todos,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_finalize_summary_structure() {
        let summary = FinalizeSummary {
            files_changed: vec!["src/main.rs".into()],
            verification_passed: true,
            verification_output: None,
            turn_cost_usd: 0.0025,
            pending_todos: vec!["todo 1".into()],
        };
        assert!(summary.verification_passed);
        assert_eq!(summary.files_changed.len(), 1);
    }
}
