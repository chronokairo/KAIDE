use pool::pool::{Buffer, BufferPool};

// FIXED ACCEPTANCE TEST — part of the task specification. Do not modify.
// Pins the required API:
//   checkout(&mut self) -> Result<Buffer, String>   (owned buffer, LIFO)
//   checkin(&mut self, buffer: Buffer)

#[test]
fn checkout_returns_owned_buffer_lifo() {
    let mut p = BufferPool::with_capacity(3);
    let b: Buffer = p.checkout().expect("buffer must be available");
    assert_eq!(b.data, vec![2], "checkout must pop the LAST buffer");
    assert_eq!(p.available(), 2);
}

#[test]
fn checkout_empty_pool_is_string_err() {
    let mut p = BufferPool::with_capacity(0);
    let res: Result<Buffer, String> = p.checkout();
    assert!(res.is_err(), "empty pool must return Err(String)");
}

#[test]
fn checkin_restores_availability() {
    let mut p = BufferPool::with_capacity(2);
    let b = p.checkout().unwrap();
    assert_eq!(p.available(), 1);
    p.checkin(b);
    assert_eq!(p.available(), 2, "checkin must restore the buffer");
}

#[test]
fn checkin_then_checkout_roundtrip() {
    let mut p = BufferPool::with_capacity(1);
    let b = p.checkout().unwrap();
    assert_eq!(b.data, vec![0]);
    p.checkin(b);
    let again = p.checkout().unwrap();
    assert_eq!(again.data, vec![0], "roundtripped buffer keeps its data");
}
