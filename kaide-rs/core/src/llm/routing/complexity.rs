//! Task complexity classification for the routing layer.
//!
//! The router does not rely on a single `if prompt.len() > X` gate: complexity
//! is derived from a deterministic set of signals (prompt size, files touched,
//! plan/debug/refactor/codegen vocabulary, architectural impact and ambiguity).
//! The classification feeds both the confidence estimator and the routing
//! policy, so a "complex" task is scored differently from a "trivial" one.


/// Complexity ladder used by the router (coarse → fine).
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Complexity {
    /// One-liner: explain a function, rename a variable, produce a git command.
    Trivial,
    /// Small, well-scoped edit: simple test, typo fix, tiny helper.
    Simple,
    /// One moderately-sized change: an endpoint, auth on a route, a refactor of
    /// a single module. May go local or remote depending on confidence.
    Moderate,
    /// Cross-cutting change: architecture refactor, multi-module debugging,
    /// a feature spanning several layers.
    Complex,
    /// High-impact / high-risk work: large context, low local confidence,
    /// security-sensitive or architecture-wide changes.
    Critical,
}

impl Complexity {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Trivial => "trivial",
            Self::Simple => "simple",
            Self::Moderate => "moderate",
            Self::Complex => "complex",
            Self::Critical => "critical",
        }
    }

    /// Tasks in this class should prefer the local SLM (cheap + fast).
    pub fn prefers_local(&self) -> bool {
        matches!(self, Self::Trivial | Self::Simple)
    }

    /// Tasks in this class should prefer a capable remote model.
    pub fn prefers_remote(&self) -> bool {
        matches!(self, Self::Complex | Self::Critical)
    }
}

/// Structural profile of a task, produced by [`ComplexityAnalyzer::analyze`].
#[derive(Debug, Clone, Default)]
pub struct TaskProfile {
    pub prompt_tokens: usize,
    pub file_count: usize,
    pub codegen: bool,
    pub refactor: bool,
    pub debugging: bool,
    pub needs_planning: bool,
    pub multi_file: bool,
    pub architecture_change: bool,
    pub risky: bool,
    /// Aggregated signal score from the keyword scan (internal detail).
    pub score: usize,
}
/// Deterministic, keyword + size based complexity analyzer. Cheap and fully
/// reproducible; a future learned analyzer can implement the same interface.
pub struct ComplexityAnalyzer;

impl ComplexityAnalyzer {
    /// Scan a task plus routing context into a structural profile.
    pub fn analyze(task: &str, file_count: usize) -> TaskProfile {
        let lower = task.to_lowercase();

        // Strong architectural / cross-cutting signals.
        let architecture_change = contains_any(
            &lower,
            &[
                "architecture",
                "architectural",
                "entire codebase",
                "all modules",
                "entire system",
                "design pattern",
                "migrat",
                "restructure",
                "from scratch",
                "full rewrite",
                "redesign",
                "arquitetura",
                "arquitetural",
                "sistema inteiro",
                "todos os módulos",
                "reescrever",
                "refatorar",
                "redesenhar",
                "migrar",
            ],
        );
        let multi_file = contains_any(
            &lower,
            &[
                "multiple files",
                "several files",
                "several modules",
                "across modules",
                "across the codebase",
                "every module",
                "in all files",
                "multi-file",
                "vários arquivos",
                "muitos arquivos",
                "vários módulos",
                "múltiplos módulos",
                "todos os arquivos",
                "em todos os módulos",
                "através de vários",
            ],
        );
        let refactor = contains_any(
            &lower,
            &[
                "refactor",
                "refactoring",
                "reorganize",
                "extract",
                "clean up",
                "refatorar",
                "refatoração",
                "reorganizar",
                "extrair",
                "limpar",
                "refatore",
            ],
        );
        let debugging = contains_any(
            &lower,
            &[
                "debug",
                "debugging",
                "fix the bug",
                "why is",
                "stack trace",
                "segfault",
                "panic",
                "error in",
                "regression",
                "debugar",
                "corrigir o bug",
                "por que",
                "erro em",
                "trava",
            ],
        );
        let codegen = contains_any(
            &lower,
            &[
                "implement",
                "endpoint",
                "authentication",
                "auth",
                "api",
                "new feature",
                "novo recurso",
                "create a new",
                "build a",
                "add a",
                "add an",
                "write a",
                "implementar",
                "implemente",
                "autenticação",
                "adicione",
                "adicione um",
                "escreva",
                "crie",
                "criar um",
                "new module",
                "interface",
                "service",
            ],
        );
        let needs_planning = contains_any(
            &lower,
            &[
                "plan",
                "planning",
                "strategy",
                "roadmap",
                "steps to",
                "plano",
                "planeje",
                "planejamento",
                "estratégia",
                "passos para",
            ],
        );
        let risky = contains_any(
            &lower,
            &[
                "production",
                "security",
                "password",
                "api key",
                "payment",
                "billing",
                "banking",
                "data loss",
                "migration",
                "critical",
                "rollback",
                "concurrency",
                "thread safety",
                "delete data",
                "drop table",
                "shipping",
                "release",
                "produção",
                "segurança",
                "senha",
                "pagamento",
                "cobrança",
                "banco",
                "perda de dados",
                "crítico",
                "concorrência",
                "apagar dados",
                "publicar",
                "lançar",
            ],
        );
        // "toda/todo/inteiro/entire" amplify a refactor into cross-cutting work.
        let whole = contains_any(&lower, &["entire", "inteiro", "inteira", "toda", "todo o"]);

        let mut score: usize = 0;
        if refactor {
            // A refactor is inherently multi-step: even a single-module change
            // needs to preserve behaviour while restructuring.
            score += 3;
        }
        if debugging {
            score += 2;
        }
        if needs_planning {
            score += 2;
        }
        if multi_file {
            score += 3;
        }
        if architecture_change {
            score += 5;
        }
        if risky {
            score += 2;
        }
        if whole {
            score += 2;
        }
        if codegen {
            // A bare implementation request (endpoint, auth, new module) is a
            // real change: moderate by default. The "small/quick/simple"
            // qualifier below downgrades it to a cheap task.
            score += 3;
        }
        if contains_any(&lower, &["typo", "corrija", "corrija o", "fix this typo"]) {
            score += 1;
        }

        // A "small"/"simple" qualifier keeps even codegen asks cheap: the intent
        // is a tiny, well-scoped change, not a full implementation.
        let small_scope = contains_any(
            &lower,
            &[
                "pequena", "pequeno", "small", "simple", "simples", "básica", "basica", "rápido",
                "rapido", "quick",
            ],
        );
        if small_scope && score <= 3 {
            score = 1;
        }

        TaskProfile {
            prompt_tokens: estimate_tokens(task),
            file_count,
            codegen,
            refactor,
            debugging,
            needs_planning,
            multi_file,
            architecture_change,
            risky,
            score,
        }
    }

    /// Classify a profile into one of the five [`Complexity`] classes.
    pub fn classify(profile: &TaskProfile) -> Complexity {
        let p = profile;
        let tokens = p.prompt_tokens.max(1);

        // CRITICAL: high-risk + structural change, architecture-wide rewrites,
        // or a very large prompt.
        if (p.risky && (p.architecture_change || p.multi_file))
            || (p.architecture_change && p.multi_file)
            || tokens > 1200
        {
            return Complexity::Critical;
        }

        // COMPLEX: architecture-level work, multi-file changes or a heavy
        // combined signal score.
        if p.architecture_change || p.multi_file || p.score >= 6 {
            return Complexity::Complex;
        }

        // MODERATE: a real implementation or refactor with some scope.
        if p.score >= 3 {
            return Complexity::Moderate;
        }

        // SIMPLE: a single light signal (small codegen, a typo fix, …).
        if p.score >= 1 {
            return Complexity::Simple;
        }

        // TRIVIAL: no structural signals and a short prompt.
        if tokens <= 60 {
            Complexity::Trivial
        } else {
            Complexity::Simple
        }
    }
}

fn contains_any(text: &str, needles: &[&str]) -> bool {
    needles.iter().any(|n| text.contains(n))
}

/// Token estimate for a single prompt (reuses the calibrated estimator used by
/// the short-term memory layer, so routing and context budgeting agree).
pub(crate) fn estimate_tokens(text: &str) -> usize {
    crate::memory::short_term::estimate_tokens(text)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn classify(text: &str) -> Complexity {
        let profile = ComplexityAnalyzer::analyze(text, 0);
        ComplexityAnalyzer::classify(&profile)
    }

    #[test]
    fn trivial_asks_classify_trivial_or_simple() {
        assert!(matches!(
            classify("explain this function"),
            Complexity::Trivial | Complexity::Simple
        ));
        assert!(matches!(
            classify("what is the type of this variable?"),
            Complexity::Trivial | Complexity::Simple
        ));
        assert!(matches!(
            classify("generate a git command to show the last 5 commits"),
            Complexity::Trivial | Complexity::Simple
        ));
        assert_eq!(classify("explain this function"), Complexity::Trivial);
    }

    #[test]
    fn small_edits_are_simple_or_trivial() {
        let c = classify("rename the variable foo to bar in src/main.rs");
        assert!(c <= Complexity::Simple, "expected <= simple, got {c:?}");
        assert_eq!(classify("adicione um teste simples"), Complexity::Simple);
        assert_eq!(classify("corrija este typo"), Complexity::Simple);
        assert_eq!(
            classify("implemente uma pequena função"),
            Complexity::Simple
        );
    }

    #[test]
    fn endpoint_implementation_is_moderate() {
        assert_eq!(classify("implemente este endpoint"), Complexity::Moderate);
        assert_eq!(classify("adicione autenticação"), Complexity::Moderate);
        assert_eq!(classify("refatore este módulo"), Complexity::Moderate);
    }

    #[test]
    fn cross_module_refactor_is_complex() {
        let c = classify("refatore o sistema de autenticação inteiro");
        assert!(c >= Complexity::Complex, "got {c:?}");
    }

    #[test]
    fn multi_module_debugging_is_complex() {
        let c = classify("debugue um problema envolvendo múltiplos módulos");
        assert!(c >= Complexity::Complex, "got {c:?}");
    }

    #[test]
    fn architecture_rewrite_is_critical() {
        let c = classify("redesign the architecture of the whole system, migrate all modules to the new pattern in production");
        assert_eq!(c, Complexity::Critical);
    }

    #[test]
    fn large_prompts_escalate_complexity() {
        let long = "implement authentication with JWT tokens, refresh tokens, password hashing, session management, rate limiting, and database migrations across multiple services".repeat(8);
        let c = classify(&long);
        assert!(c >= Complexity::Complex, "got {c:?}");
    }
}
