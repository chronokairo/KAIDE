use std::fs::{File, OpenOptions};
use std::io::Write;
use std::path::Path;
use std::sync::atomic::{AtomicU8, Ordering};
use std::sync::Mutex;

/// Log severity levels.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
#[repr(u8)]
pub enum Level {
    Error = 1,
    Warn = 2,
    Info = 3,
    Debug = 4,
    Trace = 5,
}

impl Level {
    pub const fn as_str(&self) -> &'static str {
        match self {
            Level::Error => "ERROR",
            Level::Warn => "WARN",
            Level::Info => "INFO",
            Level::Debug => "DEBUG",
            Level::Trace => "TRACE",
        }
    }
}

impl std::fmt::Display for Level {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

enum LogOutput {
    Stderr,
    File(Mutex<File>),
}

/// Global native logger for ChronoKairo CLI.
pub struct CkiLogger {
    max_level: AtomicU8,
    output: Mutex<Option<LogOutput>>,
}

static GLOBAL_LOGGER: CkiLogger = CkiLogger {
    max_level: AtomicU8::new(Level::Info as u8),
    output: Mutex::new(None),
};

impl CkiLogger {
    /// Initialize logger to write to stderr with the given maximum log level.
    pub fn init_stderr(level: Level) {
        GLOBAL_LOGGER.max_level.store(level as u8, Ordering::Relaxed);
        if let Ok(mut out) = GLOBAL_LOGGER.output.lock() {
            *out = Some(LogOutput::Stderr);
        }
    }

    /// Initialize logger to append to a file (e.g. `chronokairo.log`) with the given maximum log level.
    pub fn init_file<P: AsRef<Path>>(path: P, level: Level) -> std::io::Result<()> {
        let file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(path)?;
        GLOBAL_LOGGER.max_level.store(level as u8, Ordering::Relaxed);
        if let Ok(mut out) = GLOBAL_LOGGER.output.lock() {
            *out = Some(LogOutput::File(Mutex::new(file)));
        }
        Ok(())
    }

    /// Set maximum log level dynamically.
    pub fn set_max_level(level: Level) {
        GLOBAL_LOGGER.max_level.store(level as u8, Ordering::Relaxed);
    }

    /// Get current maximum log level.
    pub fn max_level() -> Level {
        match GLOBAL_LOGGER.max_level.load(Ordering::Relaxed) {
            1 => Level::Error,
            2 => Level::Warn,
            3 => Level::Info,
            4 => Level::Debug,
            _ => Level::Trace,
        }
    }

    /// Check if a log level is enabled.
    #[inline]
    pub fn enabled(level: Level) -> bool {
        (level as u8) <= GLOBAL_LOGGER.max_level.load(Ordering::Relaxed)
    }

    /// Emit a log record.
    pub fn log(level: Level, target: &str, args: std::fmt::Arguments) {
        if !Self::enabled(level) {
            return;
        }

        let timestamp = crate::types::time::now_local_iso_millis();
        let guard = match GLOBAL_LOGGER.output.lock() {
            Ok(g) => g,
            Err(_) => return,
        };

        match guard.as_ref() {
            Some(LogOutput::File(file_mutex)) => {
                if let Ok(mut f) = file_mutex.lock() {
                    let _ = writeln!(f, "{timestamp} [{level}] {target} - {args}");
                }
            }
            Some(LogOutput::Stderr) | None => {
                let mut stderr = std::io::stderr().lock();
                let _ = writeln!(stderr, "{timestamp} [{level}] {target} - {args}");
            }
        }
    }
}

#[macro_export]
macro_rules! cki_error {
    (target: $target:expr, $($arg:tt)+) => {
        $crate::logger::CkiLogger::log($crate::logger::Level::Error, $target, format_args!($($arg)+))
    };
    ($($arg:tt)+) => {
        $crate::logger::CkiLogger::log($crate::logger::Level::Error, module_path!(), format_args!($($arg)+))
    };
}

#[macro_export]
macro_rules! cki_warn {
    (target: $target:expr, $($arg:tt)+) => {
        $crate::logger::CkiLogger::log($crate::logger::Level::Warn, $target, format_args!($($arg)+))
    };
    ($($arg:tt)+) => {
        $crate::logger::CkiLogger::log($crate::logger::Level::Warn, module_path!(), format_args!($($arg)+))
    };
}

#[macro_export]
macro_rules! cki_info {
    (target: $target:expr, $($arg:tt)+) => {
        $crate::logger::CkiLogger::log($crate::logger::Level::Info, $target, format_args!($($arg)+))
    };
    ($($arg:tt)+) => {
        $crate::logger::CkiLogger::log($crate::logger::Level::Info, module_path!(), format_args!($($arg)+))
    };
}

#[macro_export]
macro_rules! cki_debug {
    (target: $target:expr, $($arg:tt)+) => {
        $crate::logger::CkiLogger::log($crate::logger::Level::Debug, $target, format_args!($($arg)+))
    };
    ($($arg:tt)+) => {
        $crate::logger::CkiLogger::log($crate::logger::Level::Debug, module_path!(), format_args!($($arg)+))
    };
}

#[macro_export]
macro_rules! cki_trace {
    (target: $target:expr, $($arg:tt)+) => {
        $crate::logger::CkiLogger::log($crate::logger::Level::Trace, $target, format_args!($($arg)+))
    };
    ($($arg:tt)+) => {
        $crate::logger::CkiLogger::log($crate::logger::Level::Trace, module_path!(), format_args!($($arg)+))
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_logger_levels_and_macros() {
        CkiLogger::init_stderr(Level::Debug);
        assert!(CkiLogger::enabled(Level::Info));
        assert!(CkiLogger::enabled(Level::Debug));
        assert!(!CkiLogger::enabled(Level::Trace));

        cki_info!("Testing cki_info macro: {}", 42);
        cki_warn!("Testing cki_warn macro");
        cki_error!("Testing cki_error macro");
        cki_debug!("Testing cki_debug macro");
    }

    #[test]
    fn test_logger_file_output() {
        let tmp = std::env::temp_dir().join(format!("test_cki_logger_{}.log", std::process::id()));
        CkiLogger::init_file(&tmp, Level::Info).expect("init_file failed");
        cki_info!("Log line for file verification: {}", 12345);

        let content = std::fs::read_to_string(&tmp).expect("read file failed");
        assert!(content.contains("[INFO]"));
        assert!(content.contains("Log line for file verification: 12345"));
        let _ = std::fs::remove_file(&tmp);
    }
}
