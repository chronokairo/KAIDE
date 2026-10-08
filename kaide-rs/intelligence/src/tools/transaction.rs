use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

const SKIPPED_DIRS: &[&str] = &[".git", "target", "node_modules", "memory_data"];

#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct WorkspaceDiff {
    pub added: Vec<String>,
    pub modified: Vec<String>,
    pub deleted: Vec<String>,
}

impl WorkspaceDiff {
    pub fn is_empty(&self) -> bool {
        self.added.is_empty() && self.modified.is_empty() && self.deleted.is_empty()
    }

    pub fn paths(&self) -> Vec<String> {
        let mut paths = self.added.clone();
        paths.extend(self.modified.clone());
        paths.extend(self.deleted.clone());
        paths.sort();
        paths.dedup();
        paths
    }

    pub fn summary(&self) -> String {
        if self.is_empty() {
            return "no workspace changes".to_string();
        }
        let render = |label: &str, paths: &[String]| {
            if paths.is_empty() {
                None
            } else {
                Some(format!("{label}: {}", paths.join(", ")))
            }
        };
        [
            render("added", &self.added),
            render("modified", &self.modified),
            render("deleted", &self.deleted),
        ]
        .into_iter()
        .flatten()
        .collect::<Vec<_>>()
        .join("; ")
    }
}

#[derive(Debug, Clone)]
pub struct WorkspaceTransaction {
    root: PathBuf,
    baseline: BTreeMap<PathBuf, Vec<u8>>,
    max_bytes: usize,
}
impl WorkspaceTransaction {
    pub fn begin(root: PathBuf, max_bytes: usize) -> anyhow::Result<Self> {
        let root = root.canonicalize().unwrap_or(root);
        let baseline = scan_workspace(&root, max_bytes)?;
        Ok(Self {
            root,
            baseline,
            max_bytes,
        })
    }

    pub fn diff(&self) -> anyhow::Result<WorkspaceDiff> {
        let current = scan_workspace(&self.root, self.max_bytes)?;
        let mut diff = WorkspaceDiff::default();
        for (path, bytes) in &current {
            match self.baseline.get(path) {
                None => diff.added.push(display_path(path)),
                Some(original) if original != bytes => diff.modified.push(display_path(path)),
                Some(_) => {}
            }
        }
        for path in self.baseline.keys() {
            if !current.contains_key(path) {
                diff.deleted.push(display_path(path));
            }
        }
        diff.added.sort();
        diff.modified.sort();
        diff.deleted.sort();
        Ok(diff)
    }

    /// Baseline content (bytes at transaction start) for a relative path.
    pub fn baseline_content(&self, path: &str) -> Option<Vec<u8>> {
        self.baseline.get(Path::new(path)).cloned()
    }

    /// Unified diff for a single relative path, or `None` when the file is
    /// unchanged or unknown. `added`/`deleted` files render as a full-file
    /// hunk; `modified` files use a diffy Myers diff with `a/`/`b/` headers.
    pub fn diff_for_file(&self, path: &str) -> anyhow::Result<Option<String>> {
        let rel = Path::new(path);
        let baseline = self.baseline.get(rel);
        let current = fs::read(self.root.join(rel)).ok();

        let header = format!("--- a/{path}\n+++ b/{path}\n");
        match (baseline, current) {
            (Some(old), Some(new)) if old == &new => Ok(None),
            (Some(old), Some(new)) => {
                let old_text = String::from_utf8_lossy(old);
                let new_text = String::from_utf8_lossy(&new);
                let patch = diffy::create_patch(&old_text, &new_text);
                Ok(Some(format!("{header}{patch}")))
            }
            (None, Some(new)) => {
                let text = String::from_utf8_lossy(&new);
                let count = text.lines().count();
                let body = text
                    .lines()
                    .map(|line| format!("+{line}"))
                    .collect::<Vec<_>>()
                    .join("\n");
                Ok(Some(format!(
                    "{header}@@ -0,0 +1,{count} @@\n{body}\n"
                )))
            }
            (Some(old), None) => {
                let text = String::from_utf8_lossy(old);
                let count = text.lines().count();
                let body = text
                    .lines()
                    .map(|line| format!("-{line}"))
                    .collect::<Vec<_>>()
                    .join("\n");
                Ok(Some(format!(
                    "{header}@@ -1,{count} +0,0 @@\n{body}\n"
                )))
            }
            (None, None) => Ok(None),
        }
    }

    pub fn rollback(&self) -> anyhow::Result<WorkspaceDiff> {
        let before = self.diff()?;
        let current = scan_workspace(&self.root, self.max_bytes)?;
        for path in current.keys() {
            if !self.baseline.contains_key(path) {
                let _ = fs::remove_file(self.root.join(path));
            }
        }
        for (path, bytes) in &self.baseline {
            let absolute = self.root.join(path);
            if let Some(parent) = absolute.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::write(absolute, bytes)?;
        }
        Ok(before)
    }
}

fn scan_workspace(root: &Path, max_bytes: usize) -> anyhow::Result<BTreeMap<PathBuf, Vec<u8>>> {
    let mut files = BTreeMap::new();
    let mut pending = vec![root.to_path_buf()];
    let mut total = 0usize;
    while let Some(directory) = pending.pop() {
        for entry in fs::read_dir(&directory)? {
            let entry = entry?;
            let file_type = entry.file_type()?;
            if file_type.is_symlink() {
                continue;
            }
            let path = entry.path();
            if file_type.is_dir() {
                let name = entry.file_name();
                if !SKIPPED_DIRS.iter().any(|skip| name == *skip) {
                    pending.push(path);
                }
                continue;
            }
            if !file_type.is_file() {
                continue;
            }
            let bytes = fs::read(&path)?;
            total = total.saturating_add(bytes.len());
            if total > max_bytes {
                anyhow::bail!("workspace transaction snapshot exceeds {} bytes", max_bytes);
            }
            let relative = path
                .strip_prefix(root)
                .map_err(|_| anyhow::anyhow!("transaction path escaped workspace"))?
                .to_path_buf();
            files.insert(relative, bytes);
        }
    }
    Ok(files)
}

fn display_path(path: &Path) -> String {
    path.to_string_lossy().replace('\\', "/")
}
#[cfg(test)]
mod tests {
    use super::*;

    fn workspace(name: &str) -> PathBuf {
        let root = std::env::temp_dir().join(format!(
            "anamnesic-transaction-{name}-{}",
            std::process::id()
        ));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(root.join("src")).unwrap();
        root
    }

    #[test]
    fn reports_added_modified_and_deleted_files() {
        let root = workspace("diff");
        fs::write(root.join("src/a.rs"), "before").unwrap();
        fs::write(root.join("keep.txt"), "keep").unwrap();
        let transaction = WorkspaceTransaction::begin(root.clone(), 1_000_000).unwrap();
        fs::write(root.join("src/a.rs"), "after").unwrap();
        fs::remove_file(root.join("keep.txt")).unwrap();
        fs::write(root.join("new.txt"), "new").unwrap();

        let diff = transaction.diff().unwrap();

        assert_eq!(diff.modified, vec!["src/a.rs"]);
        assert_eq!(diff.deleted, vec!["keep.txt"]);
        assert_eq!(diff.added, vec!["new.txt"]);
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn diff_for_file_returns_hunks_and_headers() {
        let root = workspace("filediff");
        fs::write(root.join("src/a.rs"), "one\ntwo\nthree\n").unwrap();
        fs::write(root.join("src/b.rs"), "same\n").unwrap();
        fs::write(root.join("keep.txt"), "keep\n").unwrap();
        let transaction = WorkspaceTransaction::begin(root.clone(), 1_000_000).unwrap();
        fs::write(root.join("src/a.rs"), "one\nTWO\nthree\nfour\n").unwrap();
        fs::remove_file(root.join("src/b.rs")).unwrap();
        fs::write(root.join("created.txt"), "new file\n").unwrap();

        let modified = transaction.diff_for_file("src/a.rs").unwrap().unwrap();
        assert!(modified.starts_with("--- a/src/a.rs\n+++ b/src/a.rs\n"));
        assert!(modified.contains("@@ "));
        assert!(modified.contains("+TWO"));
        assert!(modified.contains("+four"));

        let added = transaction.diff_for_file("created.txt").unwrap().unwrap();
        assert!(added.contains("+new file"));
        assert!(added.contains("@@ -0,0 +1,1 @@"));

        let deleted = transaction.diff_for_file("src/b.rs").unwrap().unwrap();
        assert!(deleted.contains("-same"));
        assert!(deleted.contains("@@ -1,1 +0,0 @@"));

        // Unchanged files return None.
        assert!(transaction.diff_for_file("keep.txt").unwrap().is_none());
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn rollback_restores_the_turn_baseline_not_git_head() {
        let root = workspace("rollback");
        fs::write(root.join("src/a.rs"), "preexisting dirty state").unwrap();
        let transaction = WorkspaceTransaction::begin(root.clone(), 1_000_000).unwrap();
        fs::write(root.join("src/a.rs"), "agent edit").unwrap();
        fs::write(root.join("created.txt"), "agent file").unwrap();

        let rolled_back = transaction.rollback().unwrap();

        assert!(!rolled_back.is_empty());
        assert_eq!(
            fs::read_to_string(root.join("src/a.rs")).unwrap(),
            "preexisting dirty state"
        );
        assert!(!root.join("created.txt").exists());
        let _ = fs::remove_dir_all(root);
    }
}
