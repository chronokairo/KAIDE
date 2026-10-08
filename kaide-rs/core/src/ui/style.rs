//! Central visual tokens for the CKI TUI.
//!
//! Keeping colors and emphasis here mirrors codex-rs' style surface and makes
//! theme changes independent from layout and event routing.

use crate::ui::engine::vt::{Color, Modifier, Style};

pub const ACCENT: Color = Color::Cyan;
pub const PROMPT: Color = Color::Green;
pub const MUTED: Color = Color::DarkGray;
pub const USER: Color = Color::LightBlue;
pub const THINKING: Color = Color::DarkGray;
pub const ERROR: Color = Color::LightRed;
pub const WARNING: Color = Color::Yellow;

pub fn prompt_style(loading: bool) -> Style {
    if loading { Style::default().fg(MUTED) }
    else { Style::default().fg(PROMPT).add_modifier(Modifier::BOLD) }
}

pub fn composer_border(loading: bool) -> Style {
    if loading { Style::default().fg(MUTED) } else { Style::default().fg(PROMPT) }
}

pub fn muted() -> Style { Style::default().fg(MUTED) }

pub fn status_style(loading: bool, error: bool, attention: bool) -> Style {
    let color = if loading { ACCENT } else if error { ERROR } else if attention { WARNING } else { MUTED };
    let style = Style::default().fg(color);
    if loading || error || attention { style.add_modifier(Modifier::BOLD) } else { style }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn prompt_state_changes_only_visual_tokens() {
        assert_eq!(prompt_style(false).fg, Some(PROMPT));
        assert_eq!(composer_border(true).fg, Some(MUTED));
    }
}
