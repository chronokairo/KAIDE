//! Pure std async process execution matching Tokio API.

use std::ffi::OsStr;
use std::io;
use std::process::{Child as StdChild, ChildStderr, ChildStdin, ChildStdout, Command as StdCommand, ExitStatus, Stdio};

pub struct Command {
    inner: StdCommand,
}

impl Command {
    pub fn new<S: AsRef<OsStr>>(program: S) -> Self {
        Self {
            inner: StdCommand::new(program),
        }
    }

    pub fn arg<S: AsRef<OsStr>>(&mut self, arg: S) -> &mut Self {
        self.inner.arg(arg);
        self
    }

    pub fn args<I, S>(&mut self, args: I) -> &mut Self
    where
        I: IntoIterator<Item = S>,
        S: AsRef<OsStr>,
    {
        self.inner.args(args);
        self
    }

    pub fn env<K, V>(&mut self, key: K, val: V) -> &mut Self
    where
        K: AsRef<OsStr>,
        V: AsRef<OsStr>,
    {
        self.inner.env(key, val);
        self
    }

    pub fn current_dir<P: AsRef<std::path::Path>>(&mut self, dir: P) -> &mut Self {
        self.inner.current_dir(dir);
        self
    }

    pub fn stdin<T: Into<Stdio>>(&mut self, cfg: T) -> &mut Self {
        self.inner.stdin(cfg);
        self
    }

    pub fn stdout<T: Into<Stdio>>(&mut self, cfg: T) -> &mut Self {
        self.inner.stdout(cfg);
        self
    }

    pub fn stderr<T: Into<Stdio>>(&mut self, cfg: T) -> &mut Self {
        self.inner.stderr(cfg);
        self
    }

    pub fn spawn(&mut self) -> io::Result<Child> {
        let mut child = self.inner.spawn()?;
        Ok(Child {
            stdin: child.stdin.take(),
            stdout: child.stdout.take(),
            stderr: child.stderr.take(),
            inner: child,
        })
    }
}

pub struct Child {
    pub stdin: Option<ChildStdin>,
    pub stdout: Option<ChildStdout>,
    pub stderr: Option<ChildStderr>,
    inner: StdChild,
}

impl Child {
    pub async fn wait(&mut self) -> io::Result<ExitStatus> {
        self.inner.wait()
    }

    pub fn id(&self) -> u32 {
        self.inner.id()
    }

    pub fn kill(&mut self) -> io::Result<()> {
        self.inner.kill()
    }
}
