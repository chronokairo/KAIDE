//! Privacy-aware routing.
//!
//! Tasks are tagged with a [`PrivacyLevel`]. The routing policy can forbid
//! remote execution for sensitive classes (see [`PrivacyPolicy`]) so that
//! credentials, personal data or source that must not leave the machine never
//! hit an external provider.


/// Data sensitivity class of a task.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Default)]
pub enum PrivacyLevel {
    /// No sensitive data involved.
    Public,
    /// Internal project data (default for most coding tasks).
    #[default]
    Internal,
    /// Credentials, personal data, or clearly sensitive source.
    Sensitive,
    /// Data that must never leave the machine.
    Private,
}

impl PrivacyLevel {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Public => "public",
            Self::Internal => "internal",
            Self::Sensitive => "sensitive",
            Self::Private => "private",
        }
    }

    /// Whether this level forces local execution under the given policy.
    pub fn remote_allowed(&self, policy: &PrivacyPolicy) -> bool {
        !policy.remote_forbidden.contains(self)
    }
}

/// Policy governing how far a task may travel.
#[derive(Debug, Clone, PartialEq)]
pub struct PrivacyPolicy {
    /// Assumed level when the task carries no explicit classification.
    pub default_level: PrivacyLevel,
    /// Levels that must never be sent to a remote provider.
    pub remote_forbidden: Vec<PrivacyLevel>,
}

impl Default for PrivacyPolicy {
    fn default() -> Self {
        Self {
            default_level: PrivacyLevel::Internal,
            remote_forbidden: vec![PrivacyLevel::Private],
        }
    }
}

/// Detect a task's privacy class from its wording. Explicit classification in
/// [`crate::llm::routing::RoutingContext`] always wins over this scan; the
/// scan only upgrades the level when sensitive vocabulary is present.
pub fn privacy_for_task(task: &str) -> PrivacyLevel {
    let lower = task.to_lowercase();
    let private_hint = contains_any(
        &lower,
        &[
            // EN
            "top secret",
            "never leave",
            "do not upload",
            "offline only",
            "must not leave",
            "não pode sair",
            "não pode deixar",
            "somente local",
            // PT
            "ultra secreto",
            "não suba",
            "não envie",
            "apenas local",
        ],
    );
    let sensitive_hint = contains_any(
        &lower,
        &[
            // EN
            "api key",
            "password",
            "secret",
            "credential",
            "private key",
            "personal data",
            "pii",
            "ssn",
            "credit card",
            "token",
            "auth token",
            "passphrase",
            "patient",
            "health record",
            // PT
            "senha",
            "segredo",
            "credencial",
            "chave privada",
            "chave de api",
            "dados pessoais",
            "cpf",
            "cartão de crédito",
            "cartão",
            "token",
            "prontuário",
            "dados de saúde",
        ],
    );

    if private_hint {
        PrivacyLevel::Private
    } else if sensitive_hint {
        PrivacyLevel::Sensitive
    } else {
        PrivacyLevel::Public
    }
}

fn contains_any(text: &str, needles: &[&str]) -> bool {
    needles.iter().any(|n| text.contains(n))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn plain_tasks_are_public() {
        assert_eq!(
            privacy_for_task("implement a simple endpoint"),
            PrivacyLevel::Public
        );
    }

    #[test]
    fn credential_tasks_are_sensitive() {
        assert_eq!(
            privacy_for_task("store the api key securely"),
            PrivacyLevel::Sensitive
        );
    }

    #[test]
    fn private_tasks_never_leave_the_machine() {
        assert_eq!(
            privacy_for_task("these files must not leave the machine"),
            PrivacyLevel::Private
        );
    }

    #[test]
    fn policy_blocks_remote_for_forbidden_levels() {
        let policy = PrivacyPolicy::default();
        assert!(PrivacyLevel::Public.remote_allowed(&policy));
        assert!(PrivacyLevel::Sensitive.remote_allowed(&policy));
        assert!(!PrivacyLevel::Private.remote_allowed(&policy));
    }
}
