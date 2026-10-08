use std::fs;
use std::path::Component;
use std::path::Path;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};

static TEMP_FILE_COUNTER: AtomicU64 = AtomicU64::new(0);

/// Lexically normalize a path: collapse `.` and resolve `..` without touching the filesystem.
fn normalize(path: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for component in path.components() {
        match component {
            Component::ParentDir => {
                out.pop();
            }
            Component::CurDir => {}
            other => out.push(other.as_os_str()),
        }
    }
    out
}

/// Strip a Windows verbatim-prefix form (`\\?\`, `//?/`, `\\?/`) from a path.
/// These prefixes make canonicalized and raw paths disagree under `starts_with`
/// and leak into tool output (e.g. `//?/C:/Users/.../docs/.obsidian/`).
#[cfg(windows)]
fn strip_verbatim_prefix(path: &Path) -> PathBuf {
    let raw = path.as_os_str().to_string_lossy();
    let stripped = raw
        .strip_prefix("\\\\?\\")
        .or_else(|| raw.strip_prefix("//?/"))
        .or_else(|| raw.strip_prefix("\\\\?/"))
        .unwrap_or(&raw)
        .replace('/', "\\");
    PathBuf::from(stripped)
}

/// Canonical, single-form workspace path used for containment checks and as the
/// working directory for child processes (git, cargo, rg, tests). Accepts
/// Obsidian-style verbatim paths like `//?/C:/Users/...`, normalizes forward
/// slashes, resolves relative paths against the current directory, and
/// canonicalizes when possible.
pub fn normalize_workspace_path(path: &Path) -> PathBuf {
    let cleaned = {
        #[cfg(windows)]
        {
            strip_verbatim_prefix(path)
        }
        #[cfg(not(windows))]
        {
            path.to_path_buf()
        }
    };
    if cleaned.is_absolute() {
        cleaned
            .canonicalize()
            .unwrap_or_else(|_| normalize(&cleaned))
    } else {
        let absolute = std::env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join(&cleaned);
        absolute
            .canonicalize()
            .unwrap_or_else(|_| normalize(&absolute))
    }
}

#[derive(Debug, Clone)]
pub struct FileTools {
    workspace: PathBuf,
    /// Absolute path prefixes outside the workspace that are explicitly permitted.
    allowlist: Vec<PathBuf>,
    /// Workspace-relative prefixes (e.g. `.git`) that are forbidden.
    denylist: Vec<String>,
}

#[derive(Debug, Clone)]
pub struct MultiEdit {
    pub start_line: usize,
    pub end_line: usize,
    pub old_content: Option<String>,
    pub new_content: String,
}

#[cfg(test)]
mod tests {
    use super::FileTools;
    use std::fs;
    use std::sync::atomic::{AtomicU32, Ordering};

    static COUNTER: AtomicU32 = AtomicU32::new(0);

    fn temp_workspace() -> std::path::PathBuf {
        let n = COUNTER.fetch_add(1, Ordering::Relaxed);
        let dir = std::env::temp_dir().join(format!(
            "chronokairo-file-tools-test-{}-{n}",
            std::process::id()
        ));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn rejects_parent_directory_paths() {
        let tools = FileTools::new(temp_workspace());
        assert!(tools.write_file("../outside.txt", "nope").is_err());
    }

    #[test]
    fn rejects_absolute_and_root_paths() {
        let tools = FileTools::new(temp_workspace());
        assert!(tools.write_file("/etc/passwd", "nope").is_err());
        assert!(tools.append_file("/etc/hosts", "nope").is_err());
        assert!(tools.read_file("/etc/hosts").is_none());
    }

    #[test]
    fn allows_absolute_paths_within_workspace() {
        let workspace = temp_workspace();
        let tools = FileTools::new(workspace.clone());
        let abs = workspace.join("sub/abs.txt");
        tools
            .write_file(abs.to_str().unwrap(), "via absolute\n")
            .unwrap();
        assert_eq!(tools.read_file("sub/abs.txt").unwrap(), "via absolute\n");
        assert_eq!(
            tools.read_file(abs.to_str().unwrap()).unwrap(),
            "via absolute\n"
        );
    }

    #[cfg(unix)]
    #[test]
    fn rejects_symlink_escape_outside_workspace() {
        let workspace = temp_workspace();
        std::fs::create_dir_all(workspace.join("link")).ok();
        let target = workspace.join("link").join("evil");
        std::os::unix::fs::symlink(std::path::Path::new("/etc"), &target).unwrap();
        let tools = FileTools::new(workspace.clone());
        assert!(tools.read_file("link/evil/passwd").is_none());
        assert!(tools.write_file("link/evil/newfile", "x").is_err());
        assert!(!std::path::Path::new("/etc/newfile").exists());
    }

    #[cfg(windows)]
    #[test]
    fn rejects_symlink_escape_outside_workspace() {
        let workspace = temp_workspace();
        std::fs::create_dir_all(workspace.join("link")).ok();
        let target = workspace.join("link").join("evil");
        // On Windows, symlinks require admin/Developer Mode; skip if not supported
        if std::os::windows::fs::symlink_dir(r"C:\Windows", &target).is_err() {
            eprintln!("Skipping symlink test: insufficient privileges");
            return;
        }
        let tools = FileTools::new(workspace.clone());
        assert!(tools
            .read_file("link/evil/system32/drivers/etc/hosts")
            .is_none());
        assert!(tools.write_file("link/evil/newfile", "x").is_err());
        assert!(!std::path::Path::new(r"C:\Windows\newfile").exists());
    }

    #[test]
    fn rejects_deep_path_traversal_and_injection_strings() {
        let tools = FileTools::new(temp_workspace());
        assert!(tools
            .read_file("../../../../../../../../etc/passwd")
            .is_none());
        assert!(tools
            .write_file("foo/../../../../outside.txt", "data")
            .is_err());
        assert!(tools.read_file("foo; rm -rf /").is_none());
    }

    #[test]
    fn write_then_read_roundtrip() {
        let tools = FileTools::new(temp_workspace());
        tools.write_file("src/main.rs", "fn main() {}\n").unwrap();
        assert_eq!(tools.read_file("src/main.rs").unwrap(), "fn main() {}\n");
    }

    #[test]
    fn append_adds_to_existing_file() {
        let tools = FileTools::new(temp_workspace());
        tools.write_file("log.txt", "line1\n").unwrap();
        tools.append_file("log.txt", "line2\n").unwrap();
        assert_eq!(tools.read_file("log.txt").unwrap(), "line1\nline2\n");
    }

    #[test]
    fn append_creates_file_when_missing() {
        let tools = FileTools::new(temp_workspace());
        tools.append_file("fresh.txt", "hi").unwrap();
        assert_eq!(tools.read_file("fresh.txt").unwrap(), "hi");
    }

    #[test]
    fn read_missing_file_returns_none() {
        let tools = FileTools::new(temp_workspace());
        assert!(tools.read_file("nope.txt").is_none());
    }

    #[test]
    fn list_files_returns_files_and_dirs_within_workspace() {
        let workspace = temp_workspace();
        let tools = FileTools::new(workspace.clone());
        tools.write_file("a.txt", "a").unwrap();
        tools.write_file("sub/b.txt", "b").unwrap();
        let root = tools.list_files("");
        assert!(root.contains(&"a.txt".to_string()));
        assert!(
            root.contains(&"sub/".to_string()),
            "directories should appear with trailing /"
        );
        assert_eq!(tools.list_files("sub"), vec!["sub/b.txt"]);
    }

    #[cfg(windows)]
    #[test]
    fn verbatim_prefix_workspace_is_supported() {
        let cwd = std::env::current_dir().unwrap();
        let forward = cwd.display().to_string().replace('\\', "/");
        let verbatim = std::path::PathBuf::from(format!("//?/{forward}/"));
        let tools = FileTools::new(verbatim);
        tools.write_file("verbatim-test.txt", "x").unwrap();
        assert_eq!(tools.read_file("verbatim-test.txt").unwrap(), "x");
        let tree = tools.list_tree("", 2, 50).unwrap();
        assert!(tree.contains("verbatim-test.txt"), "tree: {tree}");
        let files = tools.list_files("");
        assert!(
            files.iter().any(|f| f == "verbatim-test.txt"),
            "files: {files:?}"
        );
        let _ = std::fs::remove_file(cwd.join("verbatim-test.txt"));
    }

    #[cfg(windows)]
    #[test]
    fn absolute_verbatim_path_inside_workspace_resolves() {
        let cwd = std::env::current_dir().unwrap();
        let tools = FileTools::new(cwd.clone());
        tools.write_file("verbatim-sub/abs.txt", "data").unwrap();
        let absolute = format!(
            "//?/{}/verbatim-sub/abs.txt",
            cwd.display().to_string().replace('\\', "/")
        );
        assert_eq!(tools.read_file(&absolute).unwrap(), "data");
        let _ = std::fs::remove_dir_all(cwd.join("verbatim-sub"));
    }

    #[test]
    fn denylist_blocks_workspace_relative_prefix() {
        let workspace = temp_workspace();
        let tools = FileTools::new_with_policy(
            workspace.clone(),
            Vec::new(),
            vec![".git".into(), "secrets/keys".into()],
        );
        assert!(tools.read_file(".git/config").is_none());
        assert!(tools.read_file("secrets/keys/private.key").is_none());
        // sibling of a denylisted prefix is still reachable
        tools.write_file("secrets/other.txt", "ok").unwrap();
        assert_eq!(tools.read_file("secrets/other.txt").unwrap(), "ok");
    }

    #[test]
    fn allowlist_permits_external_path() {
        let workspace = temp_workspace();
        let outside = std::env::temp_dir().join(format!(
            "chronokairo-allow-out-{}-{}",
            std::process::id(),
            COUNTER.fetch_add(1, Ordering::Relaxed)
        ));
        let _ = std::fs::remove_dir_all(&outside);
        std::fs::create_dir_all(&outside).unwrap();
        std::fs::write(outside.join("target.txt"), "external").unwrap();
        let tools = FileTools::new_with_policy(
            workspace.clone(),
            vec![outside.display().to_string()],
            Vec::new(),
        );
        assert_eq!(
            tools
                .read_file(outside.join("target.txt").to_str().unwrap())
                .unwrap(),
            "external"
        );
        // a different outside area is still blocked
        let other =
            std::env::temp_dir().join(format!("chronokairo-allow-other-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&other);
        std::fs::create_dir_all(&other).unwrap();
        std::fs::write(other.join("x.txt"), "nope").unwrap();
        assert!(tools
            .read_file(other.join("x.txt").to_str().unwrap())
            .is_none());
        let _ = std::fs::remove_dir_all(&outside);
        let _ = std::fs::remove_dir_all(&other);
    }
}

impl FileTools {
    pub fn new(workspace: PathBuf) -> Self {
        Self::new_with_policy(workspace, Vec::new(), Vec::new())
    }

    pub fn new_with_policy(
        workspace: PathBuf,
        allowlist: Vec<String>,
        denylist: Vec<String>,
    ) -> Self {
        let ws = normalize_workspace_path(&workspace);
        fs::create_dir_all(&ws).ok();
        let allowlist = allowlist
            .into_iter()
            .map(|entry| normalize_workspace_path(&PathBuf::from(entry)))
            .collect();
        let denylist = denylist
            .into_iter()
            .map(|entry| entry.replace('\\', "/").trim_matches('/').to_string())
            .filter(|entry| !entry.is_empty())
            .collect();
        FileTools {
            workspace: ws,
            allowlist,
            denylist,
        }
    }

    /// Canonicalized workspace root the tools operate inside.
    pub fn workspace_root(&self) -> &Path {
        &self.workspace
    }

    /// Parse goto syntax `file.rs:10:5` como edit faz em `main.rs:74`
    pub fn parse_goto(path: &str) -> (String, Option<usize>, Option<usize>) {
        // Tenta `path:line:col` primeiro (split por ':')
        let parts: Vec<&str> = path.split(':').collect();
        if parts.len() == 3 {
            if let (Ok(l), Ok(c)) = (parts[1].parse::<usize>(), parts[2].parse::<usize>()) {
                return (parts[0].to_string(), Some(l), Some(c));
            }
        }
        if parts.len() == 2 {
            if let Ok(l) = parts[1].parse::<usize>() {
                return (parts[0].to_string(), Some(l), None);
            }
        }
        // Fallback rsplit_once para caminhos com ':' (ex. Windows drive)
        if let Some((before, after)) = path.rsplit_once(':') {
            if let Ok(line) = after.parse::<usize>() {
                if let Some((p2, l2)) = before.rsplit_once(':') {
                    if let Ok(l) = l2.parse::<usize>() {
                        return (p2.to_string(), Some(l), Some(line));
                    }
                }
                return (before.to_string(), Some(line), None);
            }
        }
        (path.to_string(), None, None)
    }

    pub fn resolve(&self, path: &str) -> Option<PathBuf> {
        let (clean_path, _line, _col) = Self::parse_goto(path);
        let raw = PathBuf::from(clean_path);
        let joined = if raw.is_absolute() { raw } else { self.workspace.join(raw) };
        let normalized = normalize(&joined);

        let mut current = normalized.clone();
        let mut suffix: Vec<std::ffi::OsString> = Vec::new();
        while !current.exists() {
            match current.parent() {
                Some(parent) => {
                    suffix.push(current.file_name()?.to_os_string());
                    current = parent.to_path_buf();
                }
                None => return None,
            }
        }
        let mut real = current.canonicalize().ok()?;
        for part in suffix.iter().rev() {
            real.push(part);
        }
        if self.denylisted(&normalized) {
            return None;
        }
        if self.contains_path(&real) || self.allowed_outside(&real) {
            Some(real)
        } else {
            None
        }
    }

    pub fn remove_file(&self, path: &str) -> crate::error::Result<()> {
        let target = self
            .resolve(path)
            .ok_or_else(|| crate::error::anyhow!("path is outside workspace"))?;
        if target.exists() {
            std::fs::remove_file(target)?;
        }
        Ok(())
    }

    /// True when the lexical (pre-canonicalization) path falls under one of the
    /// workspace-relative deny prefixes (e.g. `.git`).
    fn denylisted(&self, path: &Path) -> bool {
        if self.denylist.is_empty() {
            return false;
        }
        let Some(relative) = path.strip_prefix(&self.workspace).ok() else {
            return false;
        };
        let relative = relative.to_string_lossy().replace('\\', "/");
        let relative = relative.trim_matches('/');
        self.denylist
            .iter()
            .any(|entry| relative == entry || relative.starts_with(&format!("{entry}/")))
    }

    /// True when `candidate` (already known to be outside the workspace) lives
    /// under one of the explicitly allowed external path prefixes.
    fn allowed_outside(&self, candidate: &Path) -> bool {
        let cand = {
            #[cfg(windows)]
            {
                strip_verbatim_prefix(candidate)
            }
            #[cfg(not(windows))]
            {
                candidate.to_path_buf()
            }
        };
        self.allowlist.iter().any(|allowed| {
            let allowed = {
                #[cfg(windows)]
                {
                    strip_verbatim_prefix(allowed)
                }
                #[cfg(not(windows))]
                {
                    allowed.clone()
                }
            };
            cand.starts_with(&allowed)
        })
    }

    /// True when `candidate` lives inside the workspace, tolerating Windows
    /// verbatim-prefix (`\\?\` / `//?/`) form differences between the
    /// canonicalized candidate and the stored workspace path.
    fn contains_path(&self, candidate: &Path) -> bool {
        if candidate.starts_with(&self.workspace) {
            return true;
        }
        #[cfg(windows)]
        {
            let cand = strip_verbatim_prefix(candidate);
            let ws = strip_verbatim_prefix(&self.workspace);
            cand.starts_with(&ws)
        }
        #[cfg(not(windows))]
        {
            false
        }
    }

    pub fn read_file(&self, path: &str) -> Option<String> {
        let p = self.resolve(path)?;
        fs::read_to_string(p).ok()
    }

    pub fn write_file(&self, path: &str, content: &str) -> crate::error::Result<()> {
        let p = self
            .resolve(path)
            .ok_or_else(|| crate::error::anyhow!("path must be inside the workspace"))?;
        self.atomic_write(&p, content)
    }

    pub fn append_file(&self, path: &str, content: &str) -> crate::error::Result<()> {
        let p = self
            .resolve(path)
            .ok_or_else(|| crate::error::anyhow!("path must be relative to the workspace"))?;
        if let Some(parent) = p.parent() {
            fs::create_dir_all(parent)?;
        }
        let mut file = fs::OpenOptions::new().append(true).create(true).open(&p)?;
        use std::io::Write;
        file.write_all(content.as_bytes())?;
        Ok(())
    }

    pub fn list_files(&self, path: &str) -> Vec<String> {
        let mut entries_out = Vec::new();
        let Some(p) = (if path.is_empty() {
            Some(self.workspace.clone())
        } else {
            self.resolve(path)
        }) else {
            return entries_out;
        };
        let real_p = p.canonicalize().unwrap_or(p);
        if let Ok(entries) = fs::read_dir(&real_p) {
            for entry in entries.flatten() {
                let entry_path = entry.path().canonicalize().unwrap_or_else(|_| entry.path());
                let name = entry_path
                    .strip_prefix(&self.workspace)
                    .or_else(|_| entry_path.strip_prefix(&real_p))
                    .map(|relative| relative.to_string_lossy().replace('\\', "/"))
                    .unwrap_or_else(|_| entry.file_name().to_string_lossy().replace('\\', "/"));
                let is_dir = entry.file_type().map(|t| t.is_dir()).unwrap_or(false);
                let mut name = name;
                if is_dir && !name.ends_with('/') {
                    name.push('/');
                }
                entries_out.push(name);
            }
        }
        entries_out.sort();
        entries_out
    }

    pub fn read_file_with_goto(&self, path: &str) -> Option<(String, Option<usize>, Option<usize>)> {
        let (clean, line, col) = Self::parse_goto(path);
        self.read_file(&clean).map(|c| (c, line, col))
    }

    pub fn read_file_range(
        &self,
        path: &str,
        start_line: usize,
        end_line: usize,
    ) -> crate::error::Result<String> {
        if start_line == 0 || end_line < start_line {
            crate::error::bail!("line range must be 1-based and end_line >= start_line");
        }
        // suporta goto syntax: se path contém :line, ajusta range automaticamente
        let (clean, goto_line, _) = Self::parse_goto(path);
        let (actual_start, actual_end) = if let Some(gl) = goto_line { (gl, gl + (end_line - start_line)) } else { (start_line, end_line) };
        let content = self
            .read_file(&clean)
            .ok_or_else(|| crate::error::anyhow!("file not found or path is outside workspace"))?;
        let (start_line, end_line) = (actual_start, actual_end);
        let lines: Vec<&str> = content.lines().collect();
        let selected = lines
            .iter()
            .enumerate()
            .skip(start_line - 1)
            .take(end_line - start_line + 1)
            .map(|(index, line)| format!("{:>6}  {}", index + 1, line))
            .collect::<Vec<_>>()
            .join("\n");
        Ok(format!(
            "[lines {}-{} of {}]\n{}",
            start_line,
            end_line.min(lines.len()),
            lines.len(),
            selected
        ))
    }

    pub fn list_tree(
        &self,
        path: &str,
        max_depth: usize,
        max_entries: usize,
    ) -> crate::error::Result<String> {
        let root = if path.is_empty() {
            self.workspace.clone()
        } else {
            self.resolve(path)
                .ok_or_else(|| crate::error::anyhow!("path is outside workspace"))?
        };
        if !root.is_dir() {
            crate::error::bail!("tree path is not a directory");
        }
        let root_anchor = root.clone();
        let mut pending = vec![(root, 0usize)];
        let mut output = Vec::new();
        while let Some((directory, depth)) = pending.pop() {
            if depth > max_depth || output.len() >= max_entries {
                continue;
            }
            let mut entries = fs::read_dir(&directory)?
                .filter_map(Result::ok)
                .collect::<Vec<_>>();
            entries.sort_by_key(|entry| entry.file_name());
            for entry in entries.into_iter().rev() {
                if output.len() >= max_entries {
                    break;
                }
                let file_type = entry.file_type()?;
                if file_type.is_symlink() {
                    continue;
                }
                let entry_path = entry.path();
                let relative = entry_path
                    .strip_prefix(&self.workspace)
                    .or_else(|_| entry_path.strip_prefix(&root_anchor))
                    .map(|relative| relative.to_string_lossy().replace('\\', "/"))
                    .unwrap_or_else(|_| entry.file_name().to_string_lossy().replace('\\', "/"));
                if file_type.is_dir() {
                    output.push(format!("{relative}/"));
                    if depth < max_depth {
                        pending.push((entry.path(), depth + 1));
                    }
                } else if file_type.is_file() {
                    output.push(relative);
                }
            }
        }
        output.sort();
        if output.len() >= max_entries {
            output.push(format!("...[truncated at {max_entries} entries]"));
        }
        Ok(output.join("\n"))
    }

    pub fn replace_exact(&self, path: &str, old: &str, new: &str) -> crate::error::Result<()> {
        if old.is_empty() {
            crate::error::bail!("old text must not be empty");
        }
        let target = self
            .resolve(path)
            .ok_or_else(|| crate::error::anyhow!("path is outside workspace"))?;
        let content = fs::read_to_string(&target)?;
        let matches = content.match_indices(old).count();
        if matches != 1 {
            crate::error::bail!("expected exactly one match, found {matches}; file was not changed");
        }
        self.atomic_write(&target, &content.replacen(old, new, 1))
    }

    pub fn edit_file(
        &self,
        path: &str,
        start_line: Option<usize>,
        end_line: Option<usize>,
        old_content: Option<&str>,
        new_content: &str,
    ) -> crate::error::Result<()> {
        let target = self
            .resolve(path)
            .ok_or_else(|| crate::error::anyhow!("path is outside workspace"))?;
        let content = fs::read_to_string(&target)?;
        let lines: Vec<&str> = content.lines().collect();

        match (start_line, end_line) {
            (Some(start), Some(end)) => {
                if start == 0 || start > lines.len() + 1 {
                    crate::error::bail!(
                        "start_line {start} is out of bounds (file has {} lines)",
                        lines.len()
                    );
                }
                if end < start {
                    crate::error::bail!("end_line {end} must be >= start_line {start}");
                }
                let end_idx = end.min(lines.len());
                let start_idx = start - 1;

                if let Some(old) = old_content {
                    let actual_slice = lines[start_idx..end_idx].join("\n");
                    if actual_slice.trim() != old.trim() {
                        crate::error::bail!(
                            "content mismatch at lines {start}-{end}:\nExpected:\n{}\n\nActual:\n{}",
                            old.trim(),
                            actual_slice.trim()
                        );
                    }
                }

                let mut new_lines: Vec<String> = Vec::new();
                for line in &lines[..start_idx] {
                    new_lines.push((*line).to_string());
                }
                for line in new_content.lines() {
                    new_lines.push(line.to_string());
                }
                if end_idx < lines.len() {
                    for line in &lines[end_idx..] {
                        new_lines.push((*line).to_string());
                    }
                }
                let mut joined = new_lines.join("\n");
                if content.ends_with('\n') && !joined.ends_with('\n') {
                    joined.push('\n');
                }
                self.atomic_write(&target, &joined)
            }
            _ => {
                let old = old_content.ok_or_else(|| {
                    crate::error::anyhow!("start_line/end_line or old_content must be provided")
                })?;
                self.replace_exact(path, old, new_content)
            }
        }
    }

    pub fn multi_edit_file(&self, path: &str, edits: &[MultiEdit]) -> crate::error::Result<()> {
        if edits.is_empty() {
            crate::error::bail!("edits must not be empty");
        }
        let target = self
            .resolve(path)
            .ok_or_else(|| crate::error::anyhow!("path is outside workspace"))?;
        let content = fs::read_to_string(&target)?;
        let mut lines: Vec<String> = content.lines().map(String::from).collect();

        // Sort edits by start_line descending so earlier edits don't shift
        // the line numbers of later edits. Reject overlapping ranges.
        let mut sorted: Vec<&MultiEdit> = edits.iter().collect();
        sorted.sort_by_key(|edit| std::cmp::Reverse(edit.start_line));
        for window in sorted.windows(2) {
            let earlier = &window[0];
            let later = &window[1];
            if earlier.start_line <= later.end_line {
                crate::error::bail!(
                    "overlapping edits are not allowed: lines {}-{} overlaps lines {}-{}",
                    later.start_line,
                    later.end_line,
                    earlier.start_line,
                    earlier.end_line
                );
            }
        }

        for edit in &sorted {
            if edit.start_line == 0 || edit.start_line > lines.len() + 1 {
                crate::error::bail!(
                    "start_line {} is out of bounds (file has {} lines)",
                    edit.start_line,
                    lines.len()
                );
            }
            if edit.end_line < edit.start_line {
                crate::error::bail!(
                    "end_line {} must be >= start_line {}",
                    edit.end_line,
                    edit.start_line
                );
            }
            let end_idx = edit.end_line.min(lines.len());
            let start_idx = edit.start_line - 1;

            if let Some(old) = &edit.old_content {
                let actual_slice = lines[start_idx..end_idx].join("\n");
                if actual_slice.trim() != old.trim() {
                    crate::error::bail!(
                        "content mismatch at lines {}-{}:\nExpected:\n{}\n\nActual:\n{}",
                        edit.start_line,
                        edit.end_line,
                        old.trim(),
                        actual_slice.trim()
                    );
                }
            }

            let replacement: Vec<String> = edit.new_content.lines().map(String::from).collect();
            lines.splice(start_idx..end_idx, replacement);
        }

        let mut joined = lines.join("\n");
        if content.ends_with('\n') && !joined.ends_with('\n') {
            joined.push('\n');
        }
        self.atomic_write(&target, &joined)
    }

    fn atomic_write(&self, path: &Path, content: &str) -> crate::error::Result<()> {
        let parent = path
            .parent()
            .ok_or_else(|| crate::error::anyhow!("file has no parent directory"))?;
        fs::create_dir_all(parent)?;
        let counter = TEMP_FILE_COUNTER.fetch_add(1, Ordering::Relaxed);
        let temporary = parent.join(format!(".chronokairo-{}-{counter}.tmp", std::process::id()));
        fs::write(&temporary, content)?;
        if let Err(error) = fs::rename(&temporary, path) {
            let _ = fs::remove_file(&temporary);
            return Err(error.into());
        }
        Ok(())
    }
}

#[cfg(test)]
mod transactional_tests {
    use super::FileTools;
    use std::fs;

    fn workspace(name: &str) -> std::path::PathBuf {
        let path = std::env::temp_dir().join(format!(
            "chronokairo-fs-transaction-{name}-{}",
            std::process::id()
        ));
        let _ = fs::remove_dir_all(&path);
        fs::create_dir_all(&path).unwrap();
        path
    }

    #[test]
    fn replace_exact_changes_one_match() {
        let root = workspace("one");
        let tools = FileTools::new(root.clone());
        tools.write_file("a.txt", "before unique after").unwrap();
        tools.replace_exact("a.txt", "unique", "changed").unwrap();
        assert_eq!(tools.read_file("a.txt").unwrap(), "before changed after");
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn replace_exact_leaves_stale_or_ambiguous_files_untouched() {
        let root = workspace("conflict");
        let tools = FileTools::new(root.clone());
        tools.write_file("a.txt", "same same").unwrap();
        assert!(tools.replace_exact("a.txt", "missing", "x").is_err());
        assert!(tools.replace_exact("a.txt", "same", "x").is_err());
        assert_eq!(tools.read_file("a.txt").unwrap(), "same same");
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn ranged_read_and_tree_are_bounded() {
        let root = workspace("discovery");
        let tools = FileTools::new(root.clone());
        tools.write_file("src/lib.rs", "one\ntwo\nthree\n").unwrap();
        let range = tools.read_file_range("src/lib.rs", 2, 3).unwrap();
        assert!(range.contains("2  two"));
        assert!(!range.contains("one"));
        let tree = tools.list_tree("", 2, 20).unwrap();
        assert!(tree.contains("src/lib.rs"));
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn edit_file_replaces_line_range_surgically() {
        let root = workspace("edit_range");
        let tools = FileTools::new(root.clone());
        tools
            .write_file("test.py", "line 1\nline 2\nline 3\nline 4\n")
            .unwrap();
        tools
            .edit_file(
                "test.py",
                Some(2),
                Some(3),
                Some("line 2\nline 3"),
                "NEW LINE 2AND3",
            )
            .unwrap();
        assert_eq!(
            tools.read_file("test.py").unwrap(),
            "line 1\nNEW LINE 2AND3\nline 4\n"
        );
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn multi_edit_file_applies_non_overlapping_edits() {
        use super::MultiEdit;
        let root = workspace("multi_edit");
        let tools = FileTools::new(root.clone());
        tools.write_file("src.rs", "a\nb\nc\nd\ne\nf\n").unwrap();
        let edits = vec![
            MultiEdit {
                start_line: 1,
                end_line: 1,
                old_content: None,
                new_content: "A".into(),
            },
            MultiEdit {
                start_line: 3,
                end_line: 4,
                old_content: None,
                new_content: "C\nD2".into(),
            },
            MultiEdit {
                start_line: 6,
                end_line: 6,
                old_content: None,
                new_content: "F2".into(),
            },
        ];
        tools.multi_edit_file("src.rs", &edits).unwrap();
        assert_eq!(tools.read_file("src.rs").unwrap(), "A\nb\nC\nD2\ne\nF2\n");
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn multi_edit_file_rejects_overlapping_edits() {
        use super::MultiEdit;
        let root = workspace("multi_overlap");
        let tools = FileTools::new(root.clone());
        tools.write_file("src.rs", "a\nb\nc\nd\n").unwrap();
        let edits = vec![
            MultiEdit {
                start_line: 2,
                end_line: 3,
                old_content: None,
                new_content: "x".into(),
            },
            MultiEdit {
                start_line: 3,
                end_line: 4,
                old_content: None,
                new_content: "y".into(),
            },
        ];
        assert!(tools.multi_edit_file("src.rs", &edits).is_err());
        assert_eq!(tools.read_file("src.rs").unwrap(), "a\nb\nc\nd\n");
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn multi_edit_file_validates_old_content() {
        use super::MultiEdit;
        let root = workspace("multi_validate");
        let tools = FileTools::new(root.clone());
        tools.write_file("src.rs", "alpha\nbeta\n").unwrap();
        let edits = vec![MultiEdit {
            start_line: 1,
            end_line: 1,
            old_content: Some("wrong".into()),
            new_content: "ALPHA".into(),
        }];
        assert!(tools.multi_edit_file("src.rs", &edits).is_err());
        assert_eq!(tools.read_file("src.rs").unwrap(), "alpha\nbeta\n");
        let _ = fs::remove_dir_all(root);
    }
}
