//! Pure std timer and sleep implementations.

use std::future::Future;
use std::pin::Pin;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::task::{Context, Poll};
use std::thread;
use std::time::{Duration, Instant};

pub use std::time::{Duration as StdDuration, Instant as StdInstant};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Elapsed;

impl std::fmt::Display for Elapsed {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "deadline has elapsed")
    }
}

impl std::error::Error for Elapsed {}

pub fn sleep(duration: Duration) -> Sleep {
    Sleep {
        deadline: Instant::now() + duration,
        spawned: false,
        done: Arc::new(AtomicBool::new(false)),
    }
}

pub struct Sleep {
    deadline: Instant,
    spawned: bool,
    done: Arc<AtomicBool>,
}

impl Future for Sleep {
    type Output = ();

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let now = Instant::now();
        if now >= self.deadline || self.done.load(Ordering::Acquire) {
            return Poll::Ready(());
        }

        if !self.spawned {
            self.spawned = true;
            let done = self.done.clone();
            let waker = cx.waker().clone();
            let remaining = self.deadline.saturating_duration_since(now);
            thread::spawn(move || {
                thread::sleep(remaining);
                done.store(true, Ordering::Release);
                waker.wake();
            });
        }

        Poll::Pending
    }
}

pub fn timeout<F: Future>(duration: Duration, future: F) -> Timeout<F> {
    Timeout {
        future,
        sleep: sleep(duration),
    }
}

pub struct Timeout<F> {
    future: F,
    sleep: Sleep,
}

impl<F: Future> Future for Timeout<F> {
    type Output = Result<F::Output, Elapsed>;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let this = unsafe { self.get_unchecked_mut() };
        let fut = unsafe { Pin::new_unchecked(&mut this.future) };
        if let Poll::Ready(output) = fut.poll(cx) {
            return Poll::Ready(Ok(output));
        }

        let sleep = unsafe { Pin::new_unchecked(&mut this.sleep) };
        if let Poll::Ready(()) = sleep.poll(cx) {
            return Poll::Ready(Err(Elapsed));
        }

        Poll::Pending
    }
}
