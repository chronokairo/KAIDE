#[derive(Debug, Clone, Copy, PartialEq)]
pub enum CavemanLevel {
    Off,
    Lite,
    Full,
    Ultra,
}

impl CavemanLevel {
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "off" | "normal" | "stop" | "disable" => CavemanLevel::Off,
            "lite" => CavemanLevel::Lite,
            "full" => CavemanLevel::Full,
            "ultra" => CavemanLevel::Ultra,
            _ => CavemanLevel::Full,
        }
    }

    pub fn system_prompt_suffix(&self) -> &'static str {
        match self {
            CavemanLevel::Off => "",
            CavemanLevel::Lite => r#"

CAVEMAN MODE: lite
- Drop filler words, pleasantries, hedging
- Keep sentences, no fragments
- Technical terms stay exact
- No "I think", "I believe", "It seems like", "You could", "Let's"
- Be direct and concise"#,
            CavemanLevel::Full => r#"

CAVEMAN MODE ACTIVE (full)
- Drop articles (a, an, the) where possible
- Drop filler: "actually", "basically", "essentially", "just", "simply"
- Drop pleasantries: "Sure!", "Of course!", "Happy to help!", "Great question!"
- Drop hedging: "I think", "I believe", "It might be", "You could try"
- Use fragments instead of full sentences where clear
- Technical terms, code, file paths: keep exact
- Use short synonyms: "use" not "utilize", "get" not "retrieve"
- One idea per line max
- Code blocks, commits, security warnings: write normal"#,
            CavemanLevel::Ultra => r#"

CAVEMAN MODE: ULTRA
- Abbreviate prose
- Use → for causality/reference
- Drop articles, filler, pleasantries, hedging
- Fragments only
- Technical terms exact
- No explanations unless asked
- One line per point
- Use < for less, > for more
- Path:line — symbol — note format for code refs
- Code blocks: write normal only
- Security warnings: write normal"#,
        }
    }

    pub fn is_active(&self) -> bool {
        !matches!(self, CavemanLevel::Off)
    }

    pub fn tag(&self) -> &'static str {
        match self {
            CavemanLevel::Off => "",
            CavemanLevel::Lite => "CAVEMAN:LITE",
            CavemanLevel::Full => "CAVEMAN:FULL",
            CavemanLevel::Ultra => "CAVEMAN:ULTRA",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_off_synonyms() {
        for s in ["off", "normal", "stop", "disable", "OFF"] {
            assert_eq!(CavemanLevel::from_str(s), CavemanLevel::Off, "for {s:?}");
        }
    }

    #[test]
    fn parses_levels() {
        assert_eq!(CavemanLevel::from_str("lite"), CavemanLevel::Lite);
        assert_eq!(CavemanLevel::from_str("full"), CavemanLevel::Full);
        assert_eq!(CavemanLevel::from_str("ULTRA"), CavemanLevel::Ultra);
    }

    #[test]
    fn unknown_defaults_to_full() {
        assert_eq!(CavemanLevel::from_str("banana"), CavemanLevel::Full);
        assert_eq!(CavemanLevel::from_str(""), CavemanLevel::Full);
    }

    #[test]
    fn tags_round_trip() {
        assert_eq!(CavemanLevel::Off.tag(), "");
        assert_eq!(CavemanLevel::Lite.tag(), "CAVEMAN:LITE");
        assert_eq!(CavemanLevel::Full.tag(), "CAVEMAN:FULL");
        assert_eq!(CavemanLevel::Ultra.tag(), "CAVEMAN:ULTRA");
    }

    #[test]
    fn only_off_is_inactive() {
        assert!(!CavemanLevel::Off.is_active());
        assert!(CavemanLevel::Lite.is_active());
        assert!(CavemanLevel::Full.is_active());
        assert!(CavemanLevel::Ultra.is_active());
    }

    #[test]
    fn system_prompt_suffix_content() {
        assert!(CavemanLevel::Off.system_prompt_suffix().is_empty());
        let full = CavemanLevel::Full.system_prompt_suffix();
        assert!(full.to_lowercase().contains("caveman mode"));
        let ultra = CavemanLevel::Ultra.system_prompt_suffix();
        assert!(ultra.to_lowercase().contains("abbreviate"));
        assert!(ultra.contains("→"));
        let lite = CavemanLevel::Lite.system_prompt_suffix();
        assert!(lite.to_lowercase().contains("lite"));
    }
}
