//! Chat surface orchestration, separated from the global event loop.
//!
//! This module owns transcript invalidation/caching. The parent UI remains the
//! lifecycle owner and supplies the mutable application state.

use super::App;
use crate::ui::engine::Line;
use std::hash::{Hash, Hasher};

pub(super) fn history_lines(app: &mut App) -> Vec<Line<'static>> {
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    app.messages.hash(&mut hasher);
    app.reasoning_expanded.hash(&mut hasher);
    app.tool_calls_expanded.hash(&mut hasher);
    let key = hasher.finish();
    if let Some((cached_key, lines)) = &app.history_cache {
        if *cached_key == key { return lines.clone(); }
    }
    let lines = super::flatten_messages(app);
    app.history_cache = Some((key, lines.clone()));
    lines
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn cache_reuses_same_transcript() {
        let mut app = App::new("model");
        app.add_message("User", "hello");
        let first = history_lines(&mut app);
        let second = history_lines(&mut app);
        assert_eq!(first, second);
        assert!(app.history_cache.is_some());
    }
}
