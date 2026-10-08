//! Worktrees git por task — isolamento de trabalho paralelo (padrão Codex /
//! Cursor / Claude Code). Cada task ganha um worktree dedicado em
//! `.chronokairo-worktrees/<task-id>` e um branch `ck/task/<task-id>`,
//! permitindo que múltiplas tasks evoluam sem pisar umas nas outras.

use crate::error::{bail, Context, Result};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;

/// Diretório fixo dentro do repo que concentra os worktrees por task.
pub const WORKTREE_DIR: &str = ".chronokairo-worktrees";
/// Prefixo de branch para tasks.
pub const TASK_BRANCH_PREFIX: &str = "ck/task/";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct WorktreeInfo {
    /// Identificador da task (sanitizado).
    pub id: String,
    /// Caminho absoluto do worktree.
    pub path: String,
    /// Branch dedicado da task.
    pub branch: String,
    /// Commit HEAD do worktree no momento da listagem.
    pub head: String,
}

/// Sanitiza um id de task para uso em caminhos e nomes de branch.
pub fn sanitize_id(id: &str) -> String {
    let cleaned: String = id
        .trim()
        .chars()
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '-' || c == '_' {
                c
            } else {
                '-'
            }
        })
        .collect();
    // Colapsa separadores consecutivos (ids tipo "task//42" não podem gerar
    // "task--42" em caminhos/branches).
    let collapsed = cleaned
        .trim_matches('-')
        .to_string();
    let collapsed = collapsed
        .split('-')
        .filter(|segment| !segment.is_empty())
        .collect::<Vec<_>>()
        .join("-");
    if collapsed.is_empty() {
        "task".into()
    } else {
        collapsed
    }
}

/// Branch dedicado para a task (determinístico pelo id).
pub fn branch_for_task(task_id: &str) -> String {
    format!("{TASK_BRANCH_PREFIX}{}", sanitize_id(task_id))
}

/// Garante que um caminho fica fora do tracking git usando o exclude LOCAL do
/// repo (`.git/info/exclude`) — não toca o `.gitignore` do usuário.
/// Metadados do harness (manifests, worktrees) sobrevivem a `git reset --hard`.
pub fn ensure_git_local_exclude(repo: &Path, entry: &str) {
    let git_dir = repo.join(".git");
    // Num worktree, `.git` é um arquivo que aponta para o gitdir comum.
    let git_dir = if git_dir.is_file() {
        let Ok(pointer) = std::fs::read_to_string(&git_dir) else {
            return;
        };
        let resolved = repo.join(pointer.trim());
        if resolved.is_dir() {
            resolved
        } else {
            return;
        }
    } else if git_dir.is_dir() {
        git_dir
    } else {
        return;
    };
    let exclude_path = git_dir.join("info/exclude");
    let _ = std::fs::create_dir_all(exclude_path.parent().unwrap_or(&git_dir));
    let existing = std::fs::read_to_string(&exclude_path).unwrap_or_default();
    if !existing.lines().any(|line| line.trim() == entry) {
        let mut content = existing;
        if !content.is_empty() && !content.ends_with('\n') {
            content.push('\n');
        }
        content.push_str(entry);
        content.push('\n');
        let _ = std::fs::write(&exclude_path, content);
    }
}

pub struct WorktreeManager {
    repo: PathBuf,
}

impl WorktreeManager {
    pub fn new(repo: PathBuf) -> Self {
        Self { repo }
    }

    pub fn repo(&self) -> &Path {
        &self.repo
    }

    /// Caminho (dentro do repo) onde os worktrees por task são criados.
    pub fn worktree_root(&self) -> PathBuf {
        self.repo.join(WORKTREE_DIR)
    }

    fn git(&self, args: &[&str]) -> Result<String> {
        let output = Command::new("git")
            .args(args)
            .current_dir(&self.repo)
            .output()
            .context("failed to spawn git for worktree management")?;
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            bail!("git {} failed: {stderr}", args.join(" "));
        }
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    }

    /// O repo precisa ser um repositório git (ou ter `git` disponível).
    pub fn is_git_repo(&self) -> bool {
        Command::new("git")
            .arg("rev-parse")
            .arg("--is-inside-work-tree")
            .current_dir(&self.repo)
            .output()
            .map(|out| out.status.success())
            .unwrap_or(false)
    }

    /// Cria (ou reaproveita) o worktree da task com branch dedicado.
    pub fn create(&self, task_id: &str) -> Result<WorktreeInfo> {
        if !self.is_git_repo() {
            bail!("worktrees require a git repository at {}", self.repo.display());
        }
        let id = sanitize_id(task_id);
        let path = self.worktree_root().join(&id);
        let branch = branch_for_task(&id);

        if path.exists() {
            // Worktree já existe: devolve o estado atual.
            let head = self.git(&["rev-parse", "HEAD"])?;
            return Ok(WorktreeInfo {
                id,
                path: path.to_string_lossy().to_string(),
                branch,
                head,
            });
        }

        ensure_git_local_exclude(&self.repo, WORKTREE_DIR);
        std::fs::create_dir_all(self.worktree_root())
            .with_context(|| format!("failed to create {}", self.worktree_root().display()))?;
        // `git worktree add` não aceita paths dentro de worktrees aninhados sem
        // Isso; o diretório pai basta existir.
        let out = self.git(&[
            "worktree",
            "add",
            "-b",
            &branch,
            &path.to_string_lossy(),
        ])?;
        let head = self.git(&["rev-parse", "HEAD"])?;
        let _ = out;
        Ok(WorktreeInfo {
            id,
            path: path.to_string_lossy().to_string(),
            branch,
            head,
        })
    }

    /// Lista todos os worktrees por task sob o diretório canônico.
    pub fn list(&self) -> Result<Vec<WorktreeInfo>> {
        if !self.is_git_repo() {
            return Ok(Vec::new());
        }
        let porcelain = self.git(&["worktree", "list", "--porcelain"])?;
        let mut worktrees = Vec::new();
        let mut path: Option<String> = None;
        let mut head = String::new();
        let mut branch = String::new();
        let flush = |path: &mut Option<String>, head: &mut String, branch: &mut String, worktrees: &mut Vec<WorktreeInfo>| {
            if let Some(path) = path.take() {
                let relative = Path::new(&path).strip_prefix(&self.repo).ok();
                let id = relative
                    .and_then(|rel| {
                        rel.strip_prefix(WORKTREE_DIR).ok()
                    })
                    .map(|rel| rel.to_string_lossy().to_string());
                if let Some(id) = id {
                    worktrees.push(WorktreeInfo {
                        id,
                        path,
                        branch: branch.clone(),
                        head: head.clone(),
                    });
                }
            }
            head.clear();
            branch.clear();
        };
        for line in porcelain.lines() {
            if let Some(value) = line.strip_prefix("worktree ") {
                flush(&mut path, &mut head, &mut branch, &mut worktrees);
                path = Some(value.to_string());
            } else if let Some(value) = line.strip_prefix("HEAD ") {
                head = value.to_string();
            } else if let Some(value) = line.strip_prefix("branch ") {
                branch = value
                    .trim_start_matches("refs/heads/")
                    .to_string();
            }
        }
        flush(&mut path, &mut head, &mut branch, &mut worktrees);
        worktrees.sort_by(|a, b| a.id.cmp(&b.id));
        Ok(worktrees)
    }

    /// Worktree da task existe?
    pub fn exists(&self, task_id: &str) -> bool {
        let id = sanitize_id(task_id);
        self.worktree_root().join(&id).exists()
    }

    /// Remove o worktree da task e o branch dedicado.
    pub fn remove(&self, task_id: &str, force: bool) -> Result<()> {
        if !self.is_git_repo() {
            bail!("worktrees require a git repository at {}", self.repo.display());
        }
        let id = sanitize_id(task_id);
        let path = self.worktree_root().join(&id);
        if !path.exists() {
            bail!("no worktree for task '{id}'");
        }
        let mut args: Vec<&str> = vec!["worktree", "remove"];
        if force {
            args.push("--force");
        }
        let path_str = path.to_string_lossy().to_string();
        args.push(&path_str);
        self.git(&args)?;
        // Branch dedicado também sai — o trabalho da task foi encerrado.
        let _ = self.git(&["branch", "-D", &branch_for_task(&id)]);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sanitize_ids_for_paths_and_branches() {
        assert_eq!(sanitize_id("Fix Login Bug!"), "Fix-Login-Bug");
        assert_eq!(sanitize_id("  task//42  "), "task-42");
        assert_eq!(sanitize_id("---"), "task");
        assert_eq!(branch_for_task("auth refactor"), "ck/task/auth-refactor");
    }
}
