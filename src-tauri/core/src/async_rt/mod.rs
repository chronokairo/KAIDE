//! Zero-Lib asynchronous runtime and concurrency primitives in pure standard library.

pub mod executor;
pub mod io;
pub mod net;
pub mod process;
pub mod select;
pub mod sync;
pub mod task;
pub mod time;

pub use executor::{block_on, Handle, Runtime};
pub use task::{block_in_place, spawn, spawn_blocking, JoinHandle};
pub use std::time::{Duration, Instant};
pub use time::{sleep, timeout};

pub mod runtime {
    pub use super::executor::{Handle, Runtime};
}
