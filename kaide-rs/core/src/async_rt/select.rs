//! Pure std future selection / race combinator and select! macro.

use std::future::Future;
use std::pin::Pin;
use std::task::{Context, Poll};

pub enum Either<A, B> {
    Left(A),
    Right(B),
}

pub struct Select2<'a, F1, F2> {
    pub fut1: Option<&'a mut F1>,
    pub fut2: Option<&'a mut F2>,
}

impl<'a, F1: Future + Unpin, F2: Future + Unpin> Future for Select2<'a, F1, F2> {
    type Output = Either<F1::Output, F2::Output>;

    fn poll(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        if let Some(ref mut f1) = self.fut1 {
            if let Poll::Ready(res) = Pin::new(&mut **f1).poll(cx) {
                return Poll::Ready(Either::Left(res));
            }
        }
        if let Some(ref mut f2) = self.fut2 {
            if let Poll::Ready(res) = Pin::new(&mut **f2).poll(cx) {
                return Poll::Ready(Either::Right(res));
            }
        }
        Poll::Pending
    }
}

#[macro_export]
macro_rules! select {
    (
        $val1:pat = $fut1:expr => $body1:expr,
        $val2:pat = $fut2:expr => $body2:expr $(,)?
    ) => {{
        let res = {
            let mut f1 = Box::pin($fut1);
            let mut f2 = Box::pin($fut2);
            ($crate::async_rt::select::Select2 {
                fut1: Some(&mut f1),
                fut2: Some(&mut f2),
            }).await
        };
        match res {
            $crate::async_rt::select::Either::Left($val1) => $body1,
            $crate::async_rt::select::Either::Right($val2) => $body2,
        }
    }};
    (
        $val1:pat = $fut1:expr => $body1:block
        $val2:pat = $fut2:expr => $body2:expr $(,)?
    ) => {
        $crate::select!($val1 = $fut1 => $body1, $val2 = $fut2 => $body2)
    };
}
