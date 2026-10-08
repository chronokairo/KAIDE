use std::env;

/// Detects the default interactive shell command for the host platform.
pub fn default_shell_command() -> String {
    #[cfg(windows)]
    {
        if env::var("PSModulePath").is_ok() || env::var("SystemRoot").is_ok() {
            "powershell.exe".to_string()
        } else {
            "cmd.exe".to_string()
        }
    }

    #[cfg(not(windows))]
    {
        env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_shell_command_returns_non_empty() {
        let shell = default_shell_command();
        assert!(!shell.is_empty());
    }
}
