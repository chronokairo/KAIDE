//! Pure standard-library async executor with thread-parking waker.

use std::future::Future;
use std::task::{Context, Poll, RawWaker, RawWakerVTable, Waker};
use std::thread::{self, Thread};

fn thread_waker(thread: Thread) -> Waker {
    unsafe fn clone(ptr: *const ()) -> RawWaker {
        let thread = (*(ptr as *const Thread)).clone();
        let boxed = Box::new(thread);
        RawWaker::new(Box::into_raw(boxed) as *const (), &VTABLE)
    }
    unsafe fn wake(ptr: *const ()) {
        let thread = Box::from_raw(ptr as *mut Thread);
        thread.unpark();
    }
    unsafe fn wake_by_ref(ptr: *const ()) {
        let thread = &*(ptr as *const Thread);
        thread.unpark();
    }
    unsafe fn drop(ptr: *const ()) {
        let _ = Box::from_raw(ptr as *mut Thread);
    }
    static VTABLE: RawWakerVTable = RawWakerVTable::new(clone, wake, wake_by_ref, drop);

    let boxed = Box::new(thread);
    let raw = RawWaker::new(Box::into_raw(boxed) as *const (), &VTABLE);
    unsafe { Waker::from_raw(raw) }
}

pub fn block_on<F: Future>(fut: F) -> F::Output {
    let mut fut = Box::pin(fut);
    let current_thread = thread::current();
    let waker = thread_waker(current_thread);
    let mut cx = Context::from_waker(&waker);

    loop {
        match fut.as_mut().poll(&mut cx) {
            Poll::Ready(val) => return val,
            Poll::Pending => thread::park(),
        }
    }
}

pub struct Runtime;

impl Runtime {
    pub fn new() -> std::io::Result<Self> {
        Ok(Self)
    }

    pub fn block_on<F: Future>(&self, fut: F) -> F::Output {
        block_on(fut)
    }
}

#[derive(Clone, Copy, Debug, Default)]
pub struct Handle;

impl Handle {
    pub fn try_current() -> Result<Self, ()> {
        Ok(Self)
    }

    pub fn current() -> Self {
        Self
    }

    pub fn block_on<F: Future>(&self, fut: F) -> F::Output {
        block_on(fut)
    }
}
