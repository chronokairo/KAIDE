use std::process::Command;

#[derive(Debug, Clone)]
pub struct GitTools {
    repo: String,
}

impl GitTools {
    pub fn new(repo: String) -> Self { GitTools { repo } }

    fn git(&self, args: &[&str]) -> String {
        match Command::new("git").args(args).current_dir(&self.repo).output() {
            Ok(out) => {
                let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
                if s.is_empty() { String::from_utf8_lossy(&out.stderr).trim().to_string() } else { s }
            },
            Err(e) => format!("Git error: {}", e),
        }
    }

    pub fn is_git_repo(&self) -> bool {
        match Command::new("git").args(["rev-parse", "--git-dir"]).current_dir(&self.repo).output() {
            Ok(out) => out.status.success(),
            Err(_) => false,
        }
    }
    pub fn init(&self) -> String { self.git(&["init"]) }
    pub fn add(&self, path: &str) -> String { self.git(&["add", path]) }
    pub fn branch(&self, name: &str) -> String { self.git(&["checkout", "-b", name]) }
    pub fn commit(&self, msg: &str) -> String { self.git(&["commit", "-m", msg]) }
    pub fn diff(&self, target: &str) -> String { self.git(&["diff", target]) }
    pub fn restore(&self, path: &str) -> String { self.git(&["restore", path]) }
    pub fn status(&self) -> String { self.git(&["status"]) }
    pub fn log(&self, count: usize) -> String { self.git(&["log", "--oneline", &format!("-{}", count)]) }
    pub fn stash(&self, msg: &str) -> String {
        if msg.is_empty() {
            self.git(&["stash"])
        } else {
            self.git(&["stash", "push", "-m", msg])
        }
    }
    pub fn stash_pop(&self) -> String { self.git(&["stash", "pop"]) }
    pub fn checkout_branch(&self, name: &str) -> String { self.git(&["checkout", name]) }
    pub fn list_branches(&self) -> String { self.git(&["branch", "-a"]) }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn temp_repo_dir(name: &str) -> String {
        let dir = std::env::temp_dir().join(format!("anamnesic-git-tools-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir.to_string_lossy().to_string()
    }

    #[test]
    fn plain_directory_is_not_a_git_repo() {
        let g = GitTools::new(temp_repo_dir("plain"));
        assert!(!g.is_git_repo());
    }

    #[test]
    fn init_makes_directory_a_git_repo() {
        let dir = temp_repo_dir("init");
        let g = GitTools::new(dir.clone());
        g.init();
        assert!(g.is_git_repo());
    }

    #[test]
    fn commit_appears_in_log() {
        let dir = temp_repo_dir("commit");
        let g = GitTools::new(dir.clone());
        g.init();
        // ensure git identity exists so commit succeeds
        let _ = std::process::Command::new("git")
            .args(["config", "user.name", "test"])
            .current_dir(&dir).output();
        let _ = std::process::Command::new("git")
            .args(["config", "user.email", "test@example.com"])
            .current_dir(&dir).output();
        fs::write(std::path::Path::new(&dir).join("file.txt"), "hi").unwrap();
        g.add("file.txt");
        g.commit("first commit");
        let log = g.log(5);
        assert!(log.contains("first commit"), "log was: {log}");
    }

    #[test]
    fn branch_switches_to_new_branch() {
        let dir = temp_repo_dir("branch");
        let g = GitTools::new(dir.clone());
        g.init();
        let _ = std::process::Command::new("git")
            .args(["config", "user.name", "test"]).current_dir(&dir).output();
        let _ = std::process::Command::new("git")
            .args(["config", "user.email", "test@example.com"]).current_dir(&dir).output();
        g.branch("feature");
        let status = g.status();
        assert!(status.contains("feature"), "status was: {status}");
    }

    #[test]
    fn diff_shows_working_tree_changes() {
        let dir = temp_repo_dir("diff");
        let g = GitTools::new(dir.clone());
        g.init();
        fs::write(std::path::Path::new(&dir).join("a.txt"), "one").unwrap();
        g.add("a.txt");
        let _ = std::process::Command::new("git")
            .args(["config", "user.name", "test"]).current_dir(&dir).output();
        let _ = std::process::Command::new("git")
            .args(["config", "user.email", "test@example.com"]).current_dir(&dir).output();
        g.commit("base");
        fs::write(std::path::Path::new(&dir).join("a.txt"), "two").unwrap();
        let d = g.diff("HEAD");
        assert!(d.contains("one"), "diff was: {d}");
    }

    #[test]
    fn stash_and_pop_restores_working_tree() {
        let dir = temp_repo_dir("stash");
        let g = GitTools::new(dir.clone());
        g.init();
        let _ = std::process::Command::new("git")
            .args(["config", "user.name", "test"]).current_dir(&dir).output();
        let _ = std::process::Command::new("git")
            .args(["config", "user.email", "test@example.com"]).current_dir(&dir).output();
        fs::write(std::path::Path::new(&dir).join("a.txt"), "base").unwrap();
        g.add("a.txt");
        g.commit("base");

        fs::write(std::path::Path::new(&dir).join("a.txt"), "work in progress").unwrap();
        let stash_res = g.stash("save wip");
        assert!(!stash_res.contains("error"));

        let popped = g.stash_pop();
        assert!(popped.contains("Dropped") || popped.contains("Applied") || popped.contains("On branch"));
        assert_eq!(fs::read_to_string(std::path::Path::new(&dir).join("a.txt")).unwrap(), "work in progress");
    }
}
