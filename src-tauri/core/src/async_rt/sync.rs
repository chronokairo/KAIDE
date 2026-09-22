//! Pure std synchronization primitives: async Mutex, mpsc, and oneshot channels.

use std::collections::VecDeque;
use std::future::Future;
use std::pin::Pin;
use std::sync::{Arc, Mutex as StdMutex};
use std::task::{Context, Poll, Waker};

struct MutexInner<T> {
    value: Option<T>,
    wakers: Vec<Waker>,
}

pub struct Mutex<T> {
    inner: Arc<StdMutex<MutexInner<T>>>,
}

impl<T> Mutex<T> {
    pub fn new(value: T) -> Self {
        Self {
            inner: Arc::new(StdMutex::new(MutexInner {
                value: Some(value),
                wakers: Vec::new(),
            })),
        }
    }

    pub async fn lock(&self) -> MutexGuard<T> {
        LockFuture {
            mutex: self,
        }
        .await
    }
}

struct LockFuture<'a, T> {
    mutex: &'a Mutex<T>,
}

impl<'a, T> Future for LockFuture<'a, T> {
    type Output = MutexGuard<T>;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let mut inner = self.mutex.inner.lock().unwrap();
        if let Some(val) = inner.value.take() {
            return Poll::Ready(MutexGuard {
                value: Some(val),
                inner: self.mutex.inner.clone(),
            });
        }
        inner.wakers.push(cx.waker().clone());
        Poll::Pending
    }
}

pub struct MutexGuard<T> {
    value: Option<T>,
    inner: Arc<StdMutex<MutexInner<T>>>,
}

unsafe impl<T: Send> Send for MutexGuard<T> {}
unsafe impl<T: Sync> Sync for MutexGuard<T> {}

impl<T> std::ops::Deref for MutexGuard<T> {
    type Target = T;
    fn deref(&self) -> &T {
        self.value.as_ref().unwrap()
    }
}

impl<T> std::ops::DerefMut for MutexGuard<T> {
    fn deref_mut(&mut self) -> &mut T {
        self.value.as_mut().unwrap()
    }
}

impl<T> Drop for MutexGuard<T> {
    fn drop(&mut self) {
        if let Some(val) = self.value.take() {
            let mut inner = self.inner.lock().unwrap();
            inner.value = Some(val);
            for w in inner.wakers.drain(..) {
                w.wake();
            }
        }
    }
}

pub mod mpsc {
    use super::*;

    struct Channel<T> {
        queue: VecDeque<T>,
        capacity: usize,
        closed: bool,
        send_wakers: Vec<Waker>,
        recv_wakers: Vec<Waker>,
    }

    pub fn channel<T>(capacity: usize) -> (Sender<T>, Receiver<T>) {
        let channel = Arc::new(StdMutex::new(Channel {
            queue: VecDeque::new(),
            capacity: capacity.max(1),
            closed: false,
            send_wakers: Vec::new(),
            recv_wakers: Vec::new(),
        }));
        (
            Sender { inner: channel.clone() },
            Receiver { inner: channel },
        )
    }

    pub struct Sender<T> {
        inner: Arc<StdMutex<Channel<T>>>,
    }

    impl<T> Clone for Sender<T> {
        fn clone(&self) -> Self {
            Self { inner: self.inner.clone() }
        }
    }

    impl<T> Sender<T> {
        pub fn is_closed(&self) -> bool {
            self.inner.lock().unwrap().closed
        }

        pub async fn send(&self, val: T) -> Result<(), SendError<T>> {
            SendFuture {
                sender: self,
                val: Some(val),
            }
            .await
        }

        pub fn try_send(&self, val: T) -> Result<(), TrySendError<T>> {
            let mut chan = self.inner.lock().unwrap();
            if chan.closed {
                return Err(TrySendError::Closed(val));
            }
            if chan.queue.len() >= chan.capacity {
                return Err(TrySendError::Full(val));
            }
            chan.queue.push_back(val);
            for w in chan.recv_wakers.drain(..) {
                w.wake();
            }
            Ok(())
        }
    }

    impl<T> Drop for Sender<T> {
        fn drop(&mut self) {
            if Arc::strong_count(&self.inner) == 2 {
                let mut chan = self.inner.lock().unwrap();
                chan.closed = true;
                for w in chan.recv_wakers.drain(..) {
                    w.wake();
                }
            }
        }
    }

    #[derive(Debug)]
    pub struct SendError<T>(pub T);

    impl<T> std::fmt::Display for SendError<T> {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            write!(f, "channel closed")
        }
    }

    impl<T: std::fmt::Debug> std::error::Error for SendError<T> {}

    #[derive(Debug)]
    pub enum TrySendError<T> {
        Full(T),
        Closed(T),
    }

    struct SendFuture<'a, T> {
        sender: &'a Sender<T>,
        val: Option<T>,
    }

    impl<'a, T> Future for SendFuture<'a, T> {
        type Output = Result<(), SendError<T>>;

        fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
            let this = unsafe { self.get_unchecked_mut() };
            let mut chan = this.sender.inner.lock().unwrap();
            if chan.closed {
                let val = this.val.take().unwrap();
                return Poll::Ready(Err(SendError(val)));
            }
            if chan.queue.len() < chan.capacity {
                let val = this.val.take().unwrap();
                chan.queue.push_back(val);
                for w in chan.recv_wakers.drain(..) {
                    w.wake();
                }
                return Poll::Ready(Ok(()));
            }
            chan.send_wakers.push(cx.waker().clone());
            Poll::Pending
        }
    }

    pub struct Receiver<T> {
        inner: Arc<StdMutex<Channel<T>>>,
    }

    impl<T> Receiver<T> {
        pub async fn recv(&mut self) -> Option<T> {
            RecvFuture { receiver: self }.await
        }

        pub fn try_recv(&mut self) -> Result<T, TryRecvError> {
            let mut chan = self.inner.lock().unwrap();
            if let Some(val) = chan.queue.pop_front() {
                for w in chan.send_wakers.drain(..) {
                    w.wake();
                }
                return Ok(val);
            }
            if chan.closed {
                Err(TryRecvError::Disconnected)
            } else {
                Err(TryRecvError::Empty)
            }
        }
    }

    #[derive(Debug, PartialEq, Eq)]
    pub enum TryRecvError {
        Empty,
        Disconnected,
    }

    struct RecvFuture<'a, T> {
        receiver: &'a mut Receiver<T>,
    }

    impl<'a, T> Future for RecvFuture<'a, T> {
        type Output = Option<T>;

        fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
            let mut chan = self.receiver.inner.lock().unwrap();
            if let Some(val) = chan.queue.pop_front() {
                for w in chan.send_wakers.drain(..) {
                    w.wake();
                }
                return Poll::Ready(Some(val));
            }
            if chan.closed {
                return Poll::Ready(None);
            }
            chan.recv_wakers.push(cx.waker().clone());
            Poll::Pending
        }
    }
}

pub mod oneshot {
    use super::*;

    struct State<T> {
        value: Option<T>,
        closed: bool,
        waker: Option<Waker>,
    }

    pub fn channel<T>() -> (Sender<T>, Receiver<T>) {
        let state = Arc::new(StdMutex::new(State {
            value: None,
            closed: false,
            waker: None,
        }));
        (
            Sender { state: state.clone() },
            Receiver { state },
        )
    }

    pub struct Sender<T> {
        state: Arc<StdMutex<State<T>>>,
    }

    impl<T> Sender<T> {
        pub fn send(self, val: T) -> Result<(), T> {
            let mut state = self.state.lock().unwrap();
            if state.closed {
                return Err(val);
            }
            state.value = Some(val);
            if let Some(w) = state.waker.take() {
                w.wake();
            }
            Ok(())
        }
    }

    pub struct Receiver<T> {
        state: Arc<StdMutex<State<T>>>,
    }

    impl<T> Future for Receiver<T> {
        type Output = Result<T, RecvError>;

        fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
            let mut state = self.state.lock().unwrap();
            if let Some(val) = state.value.take() {
                return Poll::Ready(Ok(val));
            }
            if state.closed {
                return Poll::Ready(Err(RecvError));
            }
            state.waker = Some(cx.waker().clone());
            Poll::Pending
        }
    }

    #[derive(Debug, PartialEq, Eq)]
    pub struct RecvError;

    impl std::fmt::Display for RecvError {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            write!(f, "oneshot channel closed")
        }
    }

    impl std::error::Error for RecvError {}
}
