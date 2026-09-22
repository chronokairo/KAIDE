//! Bottom pane architecture inspired by codex-rs.
//!
//! The pane owns only presentation state. The chat/application layer decides
//! whether an interrupt, quit, approval, or submission is allowed.

use std::time::Duration;
use crate::ui::engine::ratatui::layout::Rect;
use crate::ui::engine::terminal::Frame;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum FooterMode { Ready, Running, Approval, PlanApproval }

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ViewKind { Commands, References, Model, Provider, Resume, FileSearch, Info, Approval, PlanApproval }

/// State shared by list-backed bottom-pane views. Keeping the cursor beside
/// the view payload prevents the application state from growing another set
/// of parallel selector fields.
#[derive(Clone, Debug, Default)]
pub struct SelectionState {
    pub items: Vec<String>,
    pub selected: usize,
}

#[derive(Clone, Debug, Default)]
pub struct CommandState {
    pub items: Vec<(String, String)>,
    pub selected: usize,
}

#[derive(Clone, Debug, Default)]
pub struct ReferenceState {
    pub trigger: char,
    pub items: Vec<String>,
    pub selected: usize,
}

#[derive(Clone, Debug, Default)]
pub struct FileSearchState {
    pub query: String,
    pub selected: usize,
    pub results: Vec<super::file_search::FileMatch>,
    pub paths: Vec<String>,
}

#[derive(Clone, Debug)]
pub struct InfoState {
    pub sections: Vec<super::InfoPanelSection>,
    pub selected: usize,
}

impl SelectionState {
    pub fn replace(&mut self, items: Vec<String>, selected: usize) {
        self.items = items;
        self.selected = selected.min(self.items.len().saturating_sub(1));
    }

    pub fn move_up(&mut self) {
        self.selected = self.selected.saturating_sub(1);
    }

    pub fn move_down(&mut self) {
        if self.selected + 1 < self.items.len() {
            self.selected += 1;
        }
    }

    pub fn selected_item(&self) -> Option<&str> {
        self.items.get(self.selected).map(String::as_str)
    }
}

#[derive(Clone, Debug, Default)]
pub struct ViewStack { views: Vec<ViewKind> }

impl ViewStack {
    pub fn show(&mut self, view: ViewKind) {
        self.views.retain(|current| *current != view);
        self.views.push(view);
    }
    pub fn close_active(&mut self) -> Option<ViewKind> { self.views.pop() }
    pub fn close(&mut self, view: ViewKind) { self.views.retain(|current| *current != view); }
    pub fn active(&self) -> Option<ViewKind> { self.views.last().copied() }
    pub fn is_empty(&self) -> bool { self.views.is_empty() }
}

#[derive(Clone, Debug)]
pub struct BottomPane {
    pub composer: super::composer::ComposerState,
    pub commands: CommandState,
    pub references: ReferenceState,
    pub model: SelectionState,
    pub provider: SelectionState,
    pub resume: SelectionState,
    pub file_search: FileSearchState,
    pub info: InfoState,
    views: ViewStack,
}

impl Default for BottomPane {
    fn default() -> Self {
        Self {
            composer: super::composer::ComposerState::default(),
            commands: CommandState::default(),
            references: ReferenceState::default(),
            model: SelectionState::default(),
            provider: SelectionState::default(),
            resume: SelectionState::default(),
            file_search: FileSearchState::default(),
            info: InfoState {
                sections: vec![
                    super::InfoPanelSection::open("Context", vec![
                        super::Span::styled("Loading...", super::Style::default()),
                    ]),
                    super::InfoPanelSection::closed("Token Usage"),
                    super::InfoPanelSection::closed("Models"),
                    super::InfoPanelSection::closed("Code Indexing"),
                    super::InfoPanelSection::closed("Todo"),
                    super::InfoPanelSection::closed("Modified Files"),
                    super::InfoPanelSection::closed("Memory"),
                ],
                selected: 0,
            },
            views: ViewStack::default(),
        }
    }
}

impl BottomPane {
    pub fn show(&mut self, view: ViewKind) { self.views.show(view); }
    pub fn close(&mut self, view: ViewKind) { self.views.close(view); }
    pub fn close_active(&mut self) -> Option<ViewKind> { self.views.close_active() }
    pub fn active(&self) -> Option<ViewKind> { self.views.active() }
    pub fn contains(&self, view: ViewKind) -> bool { self.views.views.contains(&view) }

    pub fn render_composer(&self, frame: &mut Frame<'_>, area: Rect, loading: bool) {
        super::composer::render(
            frame,
            area,
            &self.composer.input,
            self.composer.cursor_position,
            loading,
        );
    }

    pub fn footer_state(
        &self,
        loading: bool,
        approval: bool,
        plan_approval: bool,
        status: String,
        elapsed: Duration,
        branch: String,
        directory: String,
    ) -> FooterState {
        FooterState {
            mode: mode_for(loading, approval, plan_approval),
            status,
            elapsed,
            branch,
            directory,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct FooterState {
    pub mode: FooterMode,
    pub status: String,
    pub elapsed: Duration,
    pub branch: String,
    pub directory: String,
}

impl FooterState {
    pub fn hint(&self) -> String {
        match self.mode {
            FooterMode::Running => format!("{} (Ctrl+C cancel)", elapsed(self.elapsed)),
            FooterMode::Approval => "a: allow once · s: allow session · d/Esc: deny".into(),
            FooterMode::PlanApproval => "a/s: approve plan · d/Esc: deny".into(),
            FooterMode::Ready => "Esc interrupt · / commands · Ctrl+P files · Ctrl+O tools · Ctrl+L clear".into(),
        }
    }

    pub fn left_label(&self) -> String {
        if self.branch.is_empty() || self.branch == "no git" {
            format!(" {}", self.directory)
        } else {
            format!(" ⎇ {} · {}", self.branch, self.directory)
        }
    }
}

pub fn elapsed(duration: Duration) -> String {
    let seconds = duration.as_secs();
    if seconds < 60 { format!("{}s", seconds) }
    else if seconds < 3600 { format!("{}m {:02}s", seconds / 60, seconds % 60) }
    else { format!("{}h {:02}m", seconds / 3600, (seconds / 60) % 60) }
}

pub fn mode_for(loading: bool, approval: bool, plan_approval: bool) -> FooterMode {
    if loading { FooterMode::Running }
    else if approval { FooterMode::Approval }
    else if plan_approval { FooterMode::PlanApproval }
    else { FooterMode::Ready }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn footer_modes_are_contextual() {
        assert_eq!(mode_for(true, true, true), FooterMode::Running);
        assert_eq!(mode_for(false, true, false), FooterMode::Approval);
        assert!(FooterState { mode: FooterMode::Ready, status: "Ready".into(), elapsed: Duration::ZERO, branch: String::new(), directory: "/repo".into() }.hint().contains("commands"));
    }

    #[test]
    fn views_are_modal_and_last_opened_wins() {
        let mut stack = ViewStack::default();
        stack.show(ViewKind::Commands);
        stack.show(ViewKind::Model);
        assert_eq!(stack.active(), Some(ViewKind::Model));
        assert_eq!(stack.close_active(), Some(ViewKind::Model));
        assert_eq!(stack.active(), Some(ViewKind::Commands));
    }

    #[test]
    fn bottom_pane_owns_view_stack() {
        let mut pane = BottomPane::default();
        pane.show(ViewKind::Info);
        assert_eq!(pane.active(), Some(ViewKind::Info));
    }

    #[test]
    fn selection_state_clamps_and_navigates() {
        let mut state = SelectionState::default();
        state.replace(vec!["a".into(), "b".into()], 99);
        assert_eq!(state.selected, 1);
        assert_eq!(state.selected_item(), Some("b"));
        state.move_up();
        state.move_down();
        state.move_down();
        assert_eq!(state.selected, 1);
    }
}
