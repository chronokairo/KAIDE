//! Task spawning and concurrency primitives using native threads.

use std::future::Future;
use std::pin::Pin;
use std::sync::mpsc::{channel, Receiver};
use std::task::{Context, Poll};
use std::thread;

pub fn spawn<F>(fut: F) -> JoinHandle<F::Output>
where
    F: Future + Send + 'static,
    F::Output: Send + 'static,
{
    let (tx, rx) = channel();
    let thread = thread::spawn(move || {
        let res = super::executor::block_on(fut);
        let _ = tx.send(res);
    });
    JoinHandle { thread, rx }
}

pub fn spawn_blocking<F, R>(f: F) -> JoinHandle<R>
where
    F: FnOnce() -> R + Send + 'static,
    R: Send + 'static,
{
    let (tx, rx) = channel();
    let thread = thread::spawn(move || {
        let res = f();
        let _ = tx.send(res);
    });
    JoinHandle { thread, rx }
}

pub fn block_in_place<F, R>(f: F) -> R
where
    F: FnOnce() -> R,
{
    f()
}

pub struct JoinHandle<T> {
    thread: thread::JoinHandle<()>,
    rx: Receiver<T>,
}

impl<T> JoinHandle<T> {
    pub fn abort(&self) {
        // Native threads cannot be forcibly aborted safely, but rx will drop
    }
}

impl<T> Future for JoinHandle<T> {
    type Output = Result<T, ()>;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        match self.rx.try_recv() {
            Ok(val) => Poll::Ready(Ok(val)),
            Err(std::sync::mpsc::TryRecvError::Empty) => {
                let waker = cx.waker().clone();
                thread::spawn(move || {
                    thread::yield_now();
                    waker.wake();
                });
                Poll::Pending
            }
            Err(std::sync::mpsc::TryRecvError::Disconnected) => Poll::Ready(Err(())),
        }
    }
}
