use pool::pool::BufferPool;

#[test]
fn pool_starts_full() {
    let p = BufferPool::with_capacity(3);
    assert_eq!(p.available(), 3);
}
