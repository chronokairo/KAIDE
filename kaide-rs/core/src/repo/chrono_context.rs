//! Zero-Lib Markdown & Obsidian Context Engine for Chronokairo
//!
//! Strictly adheres to the Zero-Lib (Std-First) policy:
//! Built 100% using Rust's standard library (`std::*`).
//! No external crates or dependencies required.

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

/// Metadata extracted from YAML frontmatter without external parsers.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Frontmatter {
    pub title: Option<String>,
    pub created: Option<String>,
    pub updated: Option<String>,
    pub doc_type: Option<String>,
    pub status: Option<String>,
    pub tags: Vec<String>,
    pub extra: HashMap<String, String>,
}

impl Frontmatter {
    /// Parse frontmatter lines between `---` markers using pure std string methods.
    pub fn parse(content: &str) -> (Option<Frontmatter>, &str) {
        let trimmed = content.trim_start();
        if !trimmed.starts_with("---") {
            return (None, content);
        }

        let rest = &trimmed[3..];
        let rest = rest.strip_prefix("\r\n").or_else(|| rest.strip_prefix('\n')).unwrap_or(rest);

        // Locate closing `---` after the opening delimiter
        let (yaml_block, body) = if let Some(end_pos) = rest.find("\r\n---") {
            let y = &rest[..end_pos];
            let after = &rest[end_pos + 5..];
            let b = after.strip_prefix("\r\n").or_else(|| after.strip_prefix('\n')).unwrap_or(after);
            (y, b.trim_start_matches(|c| c == '\r' || c == '\n'))
        } else if let Some(end_pos) = rest.find("\n---") {
            let y = &rest[..end_pos];
            let after = &rest[end_pos + 4..];
            let b = after.strip_prefix("\r\n").or_else(|| after.strip_prefix('\n')).unwrap_or(after);
            (y, b.trim_start_matches(|c| c == '\r' || c == '\n'))
        } else {
            return (None, content);
        };

        let mut fm = Frontmatter::default();
        let mut in_tags = false;

        for line in yaml_block.lines() {
            let line_trim = line.trim();
            if line_trim.is_empty() || line_trim.starts_with('#') {
                continue;
            }

            if in_tags {
                if line_trim.starts_with('-') {
                    let tag = line_trim.trim_start_matches('-').trim().to_string();
                    if !tag.is_empty() {
                        fm.tags.push(tag);
                    }
                    continue;
                } else if !line.starts_with(' ') && !line.starts_with('\t') {
                    in_tags = false;
                }
            }

            if let Some((k, v)) = line_trim.split_once(':') {
                let key = k.trim().to_lowercase();
                let val = v.trim().trim_matches('"').trim_matches('\'').to_string();

                match key.as_str() {
                    "title" => fm.title = Some(val),
                    "created" => fm.created = Some(val),
                    "updated" => fm.updated = Some(val),
                    "type" => fm.doc_type = Some(val),
                    "status" => fm.status = Some(val),
                    "tags" => {
                        if val.starts_with('[') && val.ends_with(']') {
                            let inner = &val[1..val.len() - 1];
                            for t in inner.split(',') {
                                let t_clean = t.trim().trim_matches('"').trim_matches('\'').to_string();
                                if !t_clean.is_empty() {
                                    fm.tags.push(t_clean);
                                }
                            }
                        } else {
                            in_tags = true;
                        }
                    }
                    _ => {
                        fm.extra.insert(key, val);
                    }
                }
            }
        }

        (Some(fm), body)
    }
}

/// Represents an analyzed Markdown document in the workspace.
#[derive(Debug, Clone)]
pub struct ChronoDoc {
    pub rel_path: String,
    pub frontmatter: Option<Frontmatter>,
    pub wikilinks: Vec<String>,
    pub callouts: Vec<String>,
    pub system_guidelines: Option<String>,
    pub body_summary: String,
}

impl ChronoDoc {
    /// Parse a markdown file into a structured document using pure std.
    pub fn from_file(workspace: &Path, file_path: &Path) -> Option<Self> {
        let content = fs::read_to_string(file_path).ok()?;
        let rel_path = file_path
            .strip_prefix(workspace)
            .unwrap_or(file_path)
            .to_string_lossy()
            .replace('\\', "/");

        let (frontmatter, body) = Frontmatter::parse(&content);
        let wikilinks = Self::extract_wikilinks(body);
        let callouts = Self::extract_callouts(body);
        let system_guidelines = Self::extract_guidelines(body);

        let body_summary = if body.len() > 1500 {
            let mut end = 1500;
            while !body.is_char_boundary(end) && end > 0 {
                end -= 1;
            }
            format!("{}...\n[Truncated for token efficiency]", &body[..end])
        } else {
            body.trim().to_string()
        };

        Some(Self {
            rel_path,
            frontmatter,
            wikilinks,
            callouts,
            system_guidelines,
            body_summary,
        })
    }

    /// Extract Obsidian wikilinks `[[target|alias]]` or `[[target]]` without regex.
    pub fn extract_wikilinks(text: &str) -> Vec<String> {
        let mut links = Vec::new();
        let mut cursor = text;

        while let Some(start) = cursor.find("[[") {
            let after_start = &cursor[start + 2..];
            if let Some(end) = after_start.find("]]") {
                let link_content = &after_start[..end];
                let target = link_content.split('|').next().unwrap_or(link_content).trim();
                if !target.is_empty() {
                    links.push(target.to_string());
                }
                cursor = &after_start[end + 2..];
            } else {
                break;
            }
        }
        links
    }

    /// Extract callouts (e.g. `> [!IMPORTANT]`, `> [!WARNING]`) line-by-line.
    pub fn extract_callouts(text: &str) -> Vec<String> {
        let mut callouts = Vec::new();
        let mut in_callout = false;
        let mut current_block = String::new();

        for line in text.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("> [!") {
                if in_callout && !current_block.is_empty() {
                    callouts.push(current_block.trim().to_string());
                    current_block.clear();
                }
                in_callout = true;
                current_block.push_str(trimmed);
                current_block.push('\n');
            } else if in_callout {
                if trimmed.starts_with('>') {
                    current_block.push_str(trimmed);
                    current_block.push('\n');
                } else {
                    in_callout = false;
                    if !current_block.is_empty() {
                        callouts.push(current_block.trim().to_string());
                        current_block.clear();
                    }
                }
            }
        }

        if in_callout && !current_block.is_empty() {
            callouts.push(current_block.trim().to_string());
        }

        callouts
    }

    /// Extract system guidelines section (`## Alpha Diretrizes para Agentes` or similar) in full.
    pub fn extract_guidelines(text: &str) -> Option<String> {
        let markers = [
            "## Α Diretrizes para Agentes de IA",
            "## Diretrizes para Agentes",
            "## System Guidelines",
        ];

        for marker in markers {
            if let Some(pos) = text.find(marker) {
                let slice = &text[pos..];
                // Find next top-level or second-level heading
                if let Some(next_head) = slice[marker.len()..].find("\n## ") {
                    return Some(slice[..marker.len() + next_head].trim().to_string());
                } else {
                    return Some(slice.trim().to_string());
                }
            }
        }
        None
    }
}

/// Zero-Lib Context Engine for assembling curated prompts and audit packs.
#[derive(Debug, Default)]
pub struct ChronoContextEngine;

impl ChronoContextEngine {
    /// Build a curated context pack for a given task within a character budget.
    pub fn build_context_pack(workspace: &Path, task: Option<&str>, char_budget: usize) -> String {
        let mut output = Vec::new();
        output.push("# Chronokairo Curated Context Pack (Zero-Lib Engine)".to_string());

        // 1. Primary candidate: AGENTS.md
        let agents_path = workspace.join("AGENTS.md");
        if agents_path.is_file() {
            if let Some(doc) = ChronoDoc::from_file(workspace, &agents_path) {
                output.push(format!("## Master Instructions ({})", doc.rel_path));
                
                // Emphasize Frontmatter & Status
                if let Some(fm) = &doc.frontmatter {
                    if let Some(title) = &fm.title {
                        output.push(format!("**Title:** {title}"));
                    }
                    if let Some(status) = &fm.status {
                        output.push(format!("**Status:** {status}"));
                    }
                }

                // Inject full callouts
                if !doc.callouts.is_empty() {
                    output.push("### Active Operational Directives:".to_string());
                    for callout in &doc.callouts {
                        output.push(callout.clone());
                    }
                }

                // Inject full guidelines if present, otherwise inject body content
                if let Some(guidelines) = &doc.system_guidelines {
                    output.push(guidelines.clone());
                } else if !doc.body_summary.is_empty() {
                    output.push(doc.body_summary.clone());
                }
            }
        }

        // 2. Scan for domain-specific notes based on task keywords
        if let Some(query) = task {
            let query_lower = query.to_lowercase();
            let mut relevant_docs = Vec::new();

            Self::scan_markdown_recursive(workspace, workspace, &mut relevant_docs, 0, 4);

            let mut matched_sections = Vec::new();
            for doc_path in relevant_docs {
                let file_name = doc_path.file_name().unwrap_or_default().to_string_lossy().to_lowercase();
                if file_name == "agents.md" || file_name == "readme.md" {
                    continue;
                }

                // Match against query keywords
                let should_include = query_lower.split_whitespace().any(|word| {
                    if word.len() < 4 {
                        return false;
                    }
                    file_name.contains(word) || doc_path.to_string_lossy().to_lowercase().contains(word)
                });

                if should_include {
                    if let Some(doc) = ChronoDoc::from_file(workspace, &doc_path) {
                        matched_sections.push(doc);
                    }
                }
            }

            if !matched_sections.is_empty() {
                output.push("\n## Relevant Task Domain Documents:".to_string());
                for doc in matched_sections.into_iter().take(3) {
                    output.push(format!("### Document: {}", doc.rel_path));
                    if let Some(fm) = &doc.frontmatter {
                        if let Some(title) = &fm.title {
                            output.push(format!("*Title:* {title}"));
                        }
                    }
                    output.push(doc.body_summary);
                }
            }
        }

        let full_text = output.join("\n\n");
        if full_text.len() > char_budget {
            let mut end = char_budget;
            while !full_text.is_char_boundary(end) && end > 0 {
                end -= 1;
            }
            format!("{}\n\n[Context budget capped at {char_budget} chars]", &full_text[..end])
        } else {
            full_text
        }
    }

    fn scan_markdown_recursive(
        workspace: &Path,
        current: &Path,
        results: &mut Vec<PathBuf>,
        depth: usize,
        max_depth: usize,
    ) {
        if depth > max_depth {
            return;
        }

        if let Ok(entries) = fs::read_dir(current) {
            for entry in entries.flatten() {
                let path = entry.path();
                let file_name = entry.file_name();
                let name = file_name.to_string_lossy();

                if name.starts_with('.') || name == "target" || name == "node_modules" || name == "cli" {
                    continue;
                }

                if path.is_dir() {
                    Self::scan_markdown_recursive(workspace, &path, results, depth + 1, max_depth);
                } else if path.extension().map_or(false, |ext| ext == "md") {
                    results.push(path);
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_frontmatter_parser_std() {
        let raw = r#"---
title: Relatorio Executivo
type: relatorio
status: vigente
tags: [marketing, leads, manaus]
---

# Titulo Principal
Corpo do documento aqui.
"#;
        let (fm, body) = Frontmatter::parse(raw);
        assert!(fm.is_some());
        let fm = fm.unwrap();
        assert_eq!(fm.title.as_deref(), Some("Relatorio Executivo"));
        assert_eq!(fm.status.as_deref(), Some("vigente"));
        assert_eq!(fm.tags, vec!["marketing", "leads", "manaus"]);
        assert!(body.starts_with("# Titulo Principal"));
    }

    #[test]
    fn test_wikilinks_extraction() {
        let text = "Ver [[marketing/relatorios/diagnostico|Diagnóstico]] e também [[comercial/propostas/modelo]].";
        let links = ChronoDoc::extract_wikilinks(text);
        assert_eq!(links, vec!["marketing/relatorios/diagnostico", "comercial/propostas/modelo"]);
    }

    #[test]
    fn test_callouts_extraction() {
        let text = r#"
> [!IMPORTANT] Atualização operacional
> Para setembro, usar nova grade.

Outro texto aqui.

> [!TIP]
> Use o tom B2B.
"#;
        let callouts = ChronoDoc::extract_callouts(text);
        assert_eq!(callouts.len(), 2);
        assert!(callouts[0].contains("[!IMPORTANT]"));
        assert!(callouts[1].contains("[!TIP]"));
    }
}
