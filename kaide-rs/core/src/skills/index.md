# src/skills directory

This directory contains the skills system — reusable instruction packs the agent loads on demand.

## Files

- `mod.rs` — Skill parsing (`Skill`, `SymbolIndex`), discovery (`./skills` + `~/.chronokairo/skills`), and registry (`SkillRegistry`).
- `index.md` — This file.

## Usage

Skills are Markdown files with optional YAML frontmatter:

```markdown
---
name: rust-testing
description: TDD workflow with cargo test
---

# Rust Testing Skill

Always run `cargo test` before committing.
```

Tools:
- `list_skills` — list all discovered skills.
- `load_skill { name }` — inject a skill's body into the agent context.