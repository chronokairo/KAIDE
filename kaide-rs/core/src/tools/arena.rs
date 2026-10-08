//! Arena allocator por frame — inspirado em `microsoft/edit` `scratch_arena` (128 MiB / 512 MiB).
//! Bump allocator simples em `std` para alocações temporárias de um turno/frame.
//! Reseta com `reset()` sem free individual, reduz pressão no allocator global.

use std::cell::RefCell;

#[derive(Debug)]
pub struct Arena {
    buf: Vec<u8>,
    offset: usize,
}

impl Arena {
    pub fn new(capacity: usize) -> Self { Self { buf: vec![0u8; capacity], offset: 0 } }

    /// Aloca `size` bytes alinhados a 8 e retorna slice mutável.
    pub fn alloc(&mut self, size: usize) -> &mut [u8] {
        let aligned = (self.offset + 7) & !7;
        let end = aligned + size;
        if end > self.buf.len() {
            // grow 2x
            let new_cap = (self.buf.len().max(1) * 2).max(end).next_power_of_two();
            self.buf.resize(new_cap, 0);
        }
        self.offset = end;
        &mut self.buf[aligned..end]
    }

    pub fn alloc_str(&mut self, s: &str) -> String {
        let dst = self.alloc(s.len());
        dst.copy_from_slice(s.as_bytes());
        s.to_string()
    }

    pub fn reset(&mut self) { self.offset = 0; }
    pub fn used(&self) -> usize { self.offset }
    pub fn capacity(&self) -> usize { self.buf.len() }
}

// Thread-local scratch arena — como `edit` faz por frame.
thread_local! {
    static SCRATCH: RefCell<Arena> = RefCell::new(Arena::new(1024 * 1024));
}

pub fn with_scratch<F, R>(f: F) -> R where F: FnOnce(&mut Arena) -> R {
    SCRATCH.with(|a| f(&mut a.borrow_mut()))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn bump_and_reset() {
        let mut arena = Arena::new(64);
        let a = arena.alloc(10).as_ptr() as usize;
        let b = arena.alloc(10).as_ptr() as usize;
        assert!(b > a);
        arena.reset();
        assert_eq!(arena.used(), 0);
        let c = arena.alloc(10).as_ptr() as usize;
        assert_eq!(c, a);
    }
    #[test]
    fn grows_when_needed() {
        let mut arena = Arena::new(16);
        arena.alloc(100);
        assert!(arena.capacity() >= 100);
    }
}
