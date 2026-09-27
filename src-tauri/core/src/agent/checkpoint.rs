//! Checkpoints duráveis por task — snapshot git (commit) + manifest JSON
//! persistido no workspace. Permite recuperar o estado de uma task após
//! crash/reinício (padrão Codex checkpoints / Claude Code resume).
//!
//! O manifest vive em `<workspace>/.chronokairo/checkpoints.json` e cada
//! checkpoint referencia o commit git que congela o estado, além dos ids de
//! correlação (sessão, turno, sequência do event log) para replay supervisório.

use crate::error::{bail, Context, Result};
use crate::tools::worktree::WorktreeManager;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;

pub const CHECKPOINT_MANIFEST: &str = ".chronokairo/checkpoints.json";

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Checkpoint {
    /// Identificador do checkpoint (ckp-<seq>).
    pub id: String,
    /// Task dona do checkpoint.
    pub task_id: String,
    /// Branch congelado (worktree da task ou branch atual).
    pub branch: String,
    /// Commit git que materializa o snapshot.
    pub commit: String,
    /// Mensagem descritiva.
    pub message: String,
    /// Timestamp UTC RFC3339-ish.
    pub created_at: String,
    /// Sessão de memória associada (para retomar transcript).
    pub session_id: Option<i64>,
    /// Turno correlacionado no event log.
    pub turn_id: u64,
    /// Sequência do event log canônico no momento do checkpoint.
    pub event_seq: u64,
}

pub struct CheckpointStore {
    workspace: PathBuf,
}

impl CheckpointStore {
    pub fn for_workspace(workspace: &Path) -> Self {
        Self {
            workspace: workspace.to_path_buf(),
        }
    }

    pub fn workspace(&self) -> &Path {
        &self.workspace
    }

    fn manifest_path(&self) -> PathBuf {
        self.workspace.join(CHECKPOINT_MANIFEST)
    }

    fn git(&self, args: &[&str]) -> Result<String> {
        let output = Command::new("git")
            .args(args)
            .current_dir(&self.workspace)
            .output()
            .context("failed to spawn git for checkpoint")?;
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            bail!("git {} failed: {stderr}", args.join(" "));
        }
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    }

    fn is_git_repo(&self) -> bool {
        Command::new("git")
            .arg("rev-parse")
            .arg("--is-inside-work-tree")
            .current_dir(&self.workspace)
            .output()
            .map(|out| out.status.success())
            .unwrap_or(false)
    }

    /// Carrega todos os checkpoints persistidos (vazio se não houver manifest).
    pub fn load(&self) -> Result<Vec<Checkpoint>> {
        let path = self.manifest_path();
        if !path.exists() {
            return Ok(Vec::new());
        }
        let content = std::fs::read_to_string(&path)
            .with_context(|| format!("failed to read {}", path.display()))?;
        if content.trim().is_empty() {
            return Ok(Vec::new());
        }
        let checkpoints = serde_json::from_str(&content)
            .with_context(|| format!("corrupt checkpoint manifest at {}", path.display()))?;
        Ok(checkpoints)
    }

    /// Persiste o manifest de forma atômica (tmp + rename).
    pub fn save(&self, checkpoints: &[Checkpoint]) -> Result<()> {
        let path = self.manifest_path();
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .with_context(|| format!("failed to create {}", parent.display()))?;
        }
        let tmp = path.with_extension("json.tmp");
        let content = serde_json::to_string_pretty(checkpoints)
            .context("failed to serialize checkpoints")?;
        std::fs::write(&tmp, content)
            .with_context(|| format!("failed to write {}", tmp.display()))?;
        std::fs::rename(&tmp, &path)
            .with_context(|| format!("failed to publish {}", path.display()))?;
        Ok(())
    }

    /// Cria um checkpoint: congelamento git (add -A + commit allow-empty) +
    /// registro no manifest. Requer repositório git.
    pub fn create(
        &self,
        task_id: &str,
        message: &str,
        session_id: Option<i64>,
        turn_id: u64,
        event_seq: u64,
    ) -> Result<Checkpoint> {
        if !self.is_git_repo() {
            bail!(
                "checkpoints require a git repository at {}",
                self.workspace.display()
            );
        }
        let mut all = self.load()?;
        let seq = all.len() + 1;
        let id = format!("ckp-{seq:04}");

        // O manifest de checkpoints NÃO pode entrar no commit: senão um
        // `git reset --hard` de restauração apagaria o histórico de checkpoints.
        crate::tools::worktree::ensure_git_local_exclude(
            &self.workspace,
            crate::tools::worktree::WORKTREE_DIR,
        );
        crate::tools::worktree::ensure_git_local_exclude(
            &self.workspace,
            ".chronokairo/",
        );
        self.git(&["add", "-A"])?;
        let summary = if message.trim().is_empty() {
            format!("ck: checkpoint {id}")
        } else {
            format!("ck: checkpoint {id} — {}", message.trim())
        };
        self.git(&["commit", "--allow-empty", "-m", &summary])?;
        let commit = self.git(&["rev-parse", "HEAD"])?;
        let branch = self.git(&["rev-parse", "--abbrev-ref", "HEAD"])?;
        let created_at = now_rfc3339();

        let checkpoint = Checkpoint {
            id: id.clone(),
            task_id: task_id.to_string(),
            branch,
            commit,
            message: if message.trim().is_empty() {
                format!("checkpoint {id}")
            } else {
                message.trim().to_string()
            },
            created_at,
            session_id,
            turn_id,
            event_seq,
        };
        all.push(checkpoint.clone());
        self.save(&all)?;
        Ok(checkpoint)
    }

    /// Restaura o workspace (ou o worktree da task) para o commit do
    /// checkpoint — `git reset --hard` no local correto.
    pub fn restore(&self, checkpoint_id: &str) -> Result<Checkpoint> {
        let all = self.load()?;
        let checkpoint = all
            .iter()
            .find(|checkpoint| checkpoint.id == checkpoint_id)
            .cloned()
            .ok_or_else(|| crate::error::message(format!("checkpoint '{checkpoint_id}' not found")))?;

        // Se a task tem worktree dedicado, restaura lá; senão no workspace raiz.
        let manager = WorktreeManager::new(self.workspace.clone());
        let target = if manager.exists(&checkpoint.task_id) {
            manager
                .worktree_root()
                .join(crate::tools::worktree::sanitize_id(&checkpoint.task_id))
        } else {
            self.workspace.clone()
        };

        let output = Command::new("git")
            .args(["reset", "--hard", &checkpoint.commit])
            .current_dir(&target)
            .output()
            .context("failed to spawn git reset")?;
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            bail!("git reset --hard {} failed: {stderr}", checkpoint.commit);
        }
        Ok(checkpoint)
    }

    /// Checkpoints de uma task (ou de todas, com `task_id` None).
    pub fn list(&self, task_id: Option<&str>) -> Result<Vec<Checkpoint>> {
        let all = self.load()?;
        Ok(match task_id {
            Some(task_id) => all
                .into_iter()
                .filter(|checkpoint| checkpoint.task_id == task_id)
                .collect(),
            None => all,
        })
    }
}

fn now_rfc3339() -> String {
    let seconds = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or(0);
    let days = seconds / 86_400;
    let rem = seconds % 86_400;
    let (year, month, day) = civil_from_days(days as i64);
    format!(
        "{year:04}-{month:02}-{day:02}T{:02}:{:02}:{:02}Z",
        rem / 3600,
        (rem % 3600) / 60,
        rem % 60
    )
}

/// Conversão dias-época → data civil (Howard Hinnant's algorithm).
fn civil_from_days(days: i64) -> (i64, u32, u32) {
    let z = days + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = (doy - (153 * mp + 2) / 5 + 1) as u32;
    let m = if mp < 10 { mp + 3 } else { mp - 9 } as u32;
    let y = if m <= 2 { y + 1 } else { y };
    (y, m, d)
}

#[cfg(test)]
mod tests {
    #[test]
    fn civil_dates_match_known_values() {
        assert_eq!(super::civil_from_days(0), (1970, 1, 1));
        assert_eq!(super::civil_from_days(19_723), (2024, 1, 1));
        assert_eq!(super::civil_from_days(20_694), (2026, 8, 29));
    }
}
