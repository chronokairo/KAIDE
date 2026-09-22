//! Application errors and lazy context, implemented with the standard library.
use std::fmt;

pub type Error = Box<dyn std::error::Error + Send + Sync + 'static>;
pub type Result<T, E = Error> = std::result::Result<T, E>;

#[derive(Debug)]
struct ContextError { message: String, source: Option<Error> }
impl fmt::Display for ContextError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.message)?;
        if f.alternate() {
            if let Some(source) = &self.source { write!(f, ": {source:#}")?; }
        }
        Ok(())
    }
}
impl std::error::Error for ContextError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        self.source.as_deref().map(|s| s as &(dyn std::error::Error + 'static))
    }
}

pub fn message(message: impl fmt::Display) -> Error {
    Box::new(ContextError { message: message.to_string(), source: None })
}

pub trait Context<T> {
    fn context(self, message: impl fmt::Display) -> Result<T>;
    fn with_context(self, message: impl FnOnce() -> String) -> Result<T>;
}
impl<T, E: Into<Error>> Context<T> for std::result::Result<T, E> {
    fn context(self, message: impl fmt::Display) -> Result<T> {
        self.map_err(|source| Box::new(ContextError { message: message.to_string(), source: Some(source.into()) }) as Error)
    }
    fn with_context(self, message: impl FnOnce() -> String) -> Result<T> {
        self.map_err(|source| Box::new(ContextError { message: message(), source: Some(source.into()) }) as Error)
    }
}
impl<T> Context<T> for Option<T> {
    fn context(self, context: impl fmt::Display) -> Result<T> { self.ok_or_else(|| message(context)) }
    fn with_context(self, context: impl FnOnce() -> String) -> Result<T> { self.ok_or_else(|| message(context())) }
}

#[macro_export]
macro_rules! cki_error_value {
    ($fmt:literal $(, $arg:expr)* $(,)?) => { $crate::error::message(format!($fmt $(, $arg)*)) };
    ($error:expr $(,)?) => { $crate::error::Error::from($error) };
}
#[macro_export]
macro_rules! cki_bail {
    ($($arg:tt)*) => { return Err($crate::cki_error_value!($($arg)*)) };
}
#[macro_export]
macro_rules! cki_ensure {
    ($condition:expr, $($arg:tt)*) => { if !$condition { $crate::cki_bail!($($arg)*); } };
}
pub use crate::{cki_bail as bail, cki_ensure as ensure, cki_error_value as anyhow};

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn context_preserves_original_error_and_alternate_display() {
        let error = Err::<(), _>(std::io::Error::new(std::io::ErrorKind::NotFound, "missing"))
            .context("opening config").unwrap_err();
        assert_eq!(error.to_string(), "opening config");
        assert_eq!(format!("{error:#}"), "opening config: missing");
        assert_eq!(error.source().unwrap().downcast_ref::<std::io::Error>().unwrap().kind(), std::io::ErrorKind::NotFound);
    }
    #[test]
    fn context_is_lazy_for_success() {
        assert_eq!(Ok::<_, std::io::Error>(42).with_context(|| panic!("must be lazy")).unwrap(), 42);
        assert_eq!(Some(42).with_context(|| panic!("must be lazy")).unwrap(), 42);
    }
    #[test]
    fn guards_return_errors() {
        fn validate(n: u32) -> Result<()> { crate::cki_ensure!(n > 0, "invalid count: {n}"); Ok(()) }
        assert_eq!(validate(0).unwrap_err().to_string(), "invalid count: 0");
        validate(1).unwrap();
    }
}
