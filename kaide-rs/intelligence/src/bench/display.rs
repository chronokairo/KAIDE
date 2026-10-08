use anyhow::Result;
use crossterm::{
    event::{self, Event, KeyCode},
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
    ExecutableCommand,
};
use ratatui::{
    backend::CrosstermBackend,
    layout::{Constraint, Layout, Rect},
    style::{Color, Modifier, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Cell, Paragraph, Row, Table},
    Terminal,
};
use std::io::stdout;

use super::model_bench::BenchResult;

const MEDAL: [&str; 3] = ["🥇", "🥈", "🥉"];

pub fn show_ranking_table(results: &[BenchResult]) -> Result<()> {
    enable_raw_mode()?;
    stdout().execute(EnterAlternateScreen)?;
    let backend = CrosstermBackend::new(stdout());
    let mut terminal = Terminal::new(backend)?;

    loop {
        terminal.draw(|f| render(f, results))?;
        if let Event::Key(key) = event::read()? {
            match key.code {
                KeyCode::Char('q') | KeyCode::Char('Q') | KeyCode::Enter | KeyCode::Esc => break,
                _ => {}
            }
        }
    }

    disable_raw_mode()?;
    stdout().execute(LeaveAlternateScreen)?;
    Ok(())
}

fn render(f: &mut ratatui::Frame, results: &[BenchResult]) {
    let area = f.area();
    let [title_area, table_area, hint_area] = Layout::vertical([
        Constraint::Length(3),
        Constraint::Fill(1),
        Constraint::Length(1),
    ])
    .areas(area);

    // Title
    let title = Paragraph::new(Line::from(vec![
        Span::styled("  📊 MODEL BENCHMARK RANKING", Style::default()
            .fg(Color::Cyan)
            .add_modifier(Modifier::BOLD)),
        Span::styled("  —  actual vs predicted (hw_recommend)",
            Style::default().fg(Color::DarkGray)),
    ]))
    .block(Block::default().borders(Borders::ALL).border_style(Style::default().fg(Color::Blue)));
    f.render_widget(title, title_area);

    // Table
    let header_cells = [
        "Rank", "Model", "TPS actual", "TPS pred.", "HW Score", "Load (s)", "Gen (s)", "Cloud equiv.", "Status",
    ]
    .iter()
    .map(|h| Cell::from(*h).style(Style::default()
        .fg(Color::Yellow)
        .add_modifier(Modifier::BOLD)));
    let header = Row::new(header_cells).height(1).bottom_margin(1);

    let err_style   = Style::default().fg(Color::Red);
    let dim_style   = Style::default().fg(Color::DarkGray);
    let best_style  = Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD);

    let rows: Vec<Row> = results.iter().enumerate().map(|(i, r)| {
        let is_best = i == 0 && r.error.is_none();
        let row_style = if r.error.is_some() { err_style }
                        else if is_best { best_style }
                        else { Style::default() };

        let medal = if i < 3 && r.error.is_none() { MEDAL[i] } else { "   " };
        let rank_str = format!("{} {}", medal, i + 1);

        let tps_str = if r.error.is_none() {
            format!("{:.1}", r.tps)
        } else {
            "—".to_string()
        };

        let pred_str = r.predicted_tps
            .map(|t| format!("{:.1}", t))
            .unwrap_or_else(|| "—".to_string());

        let hw_str = r.hw_score
            .map(|s| {
                let hw_rank = r.hw_rank.map(|n| format!(" #{n}")).unwrap_or_default();
                format!("{:.1}{}", s, hw_rank)
            })
            .unwrap_or_else(|| "—".to_string());

        let load_str = if r.load_ms > 0 { format!("{:.1}", r.load_ms as f64 / 1000.0) }
                       else { "—".to_string() };
        let gen_str  = if r.gen_ms  > 0 { format!("{:.1}", r.gen_ms  as f64 / 1000.0) }
                       else { "—".to_string() };

        let status = if let Some(e) = &r.error {
            let short: String = e.chars().take(18).collect();
            format!("✗ {short}")
        } else {
            "✓ ok".to_string()
        };

        let cloud_str = r.cloud_match.as_ref()
            .map(|c| format!("{} ${:.2}", shorten_id(&c.model_id, 14), c.cost_in))
            .unwrap_or_else(|| "—".to_string());

        let cells = vec![
            Cell::from(rank_str),
            Cell::from(r.model.clone()),
            Cell::from(tps_str),
            Cell::from(pred_str),
            Cell::from(hw_str),
            Cell::from(load_str),
            Cell::from(gen_str),
            Cell::from(cloud_str).style(dim_style),
            Cell::from(status),
        ];
        Row::new(cells).style(row_style).height(1)
    }).collect();

    // alignment note under table
    let n_ok  = results.iter().filter(|r| r.error.is_none()).count();
    let n_err = results.len() - n_ok;
    let agree = check_alignment(results);
    let note = format!("  ✓ {n_ok} ok  ✗ {n_err} failed  |  {agree}");

    let note_area = shrink(table_area, 0, 2);

    let widths = [
        Constraint::Length(7),
        Constraint::Length(20),
        Constraint::Length(11),
        Constraint::Length(10),
        Constraint::Length(10),
        Constraint::Length(9),
        Constraint::Length(9),
        Constraint::Length(20),
        Constraint::Length(14),
    ];

    let table = Table::new(rows, widths)
        .header(header)
        .block(Block::default()
            .borders(Borders::ALL)
            .border_style(Style::default().fg(Color::Blue))
            .title(Span::styled(" Results ", Style::default().fg(Color::White))))
        .row_highlight_style(Style::default().add_modifier(Modifier::REVERSED))
        .column_spacing(1);

    f.render_widget(table, note_area);

    let agree_par = Paragraph::new(note).style(dim_style);
    f.render_widget(agree_par, hint_area);

    // hint
    let hint = Paragraph::new("  [q / Enter] close")
        .style(dim_style);
    // render at last line of area
    let bottom = Rect { y: area.bottom().saturating_sub(1), height: 1, ..area };
    f.render_widget(hint, bottom);
}

fn shrink(r: Rect, h: u16, v: u16) -> Rect {
    Rect {
        x: r.x + h,
        y: r.y + v,
        width:  r.width.saturating_sub(h * 2),
        height: r.height.saturating_sub(v * 2),
    }
}

fn shorten_id(s: &str, max: usize) -> String {
    if s.len() <= max { s.to_string() }
    else { format!("{}…", &s[..max.saturating_sub(1)]) }
}

/// Check whether actual ranking agrees with hw_recommend ranking.
fn check_alignment(results: &[BenchResult]) -> String {
    let ranked_with_hw: Vec<&BenchResult> = results.iter()
        .filter(|r| r.error.is_none() && r.hw_rank.is_some())
        .collect();

    if ranked_with_hw.len() < 2 {
        return "hw_recommend overlap: too few catalog matches to compare".to_string();
    }

    // Check: are top-actual models also top-hw_rank?
    let top_actual = ranked_with_hw[0];
    let best_hw_rank = ranked_with_hw.iter()
        .min_by_key(|r| r.hw_rank.unwrap_or(999));

    if let Some(best_hw) = best_hw_rank {
        if best_hw.model == top_actual.model {
            format!("hw_recommend & actual agree: {} is best", top_actual.model)
        } else {
            format!("divergence: actual best={} | hw_recommend best={}", top_actual.model, best_hw.model)
        }
    } else {
        "no catalog overlap".to_string()
    }
}
