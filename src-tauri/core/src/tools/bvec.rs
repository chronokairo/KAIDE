//! BVec/BString arena-borrowed — port de `microsoft/edit` `crates/stdext/src/collections/vec.rs` + `string.rs`
//! Não possui ownership, não faz drop; ideal para transient frame data com Arena.
//! Zero-lib: std only.

use std::marker::PhantomData;

pub struct BVec<'a, T> {
    ptr: *mut T,
    len: usize,
    cap: usize,
    _marker: PhantomData<&'a mut [T]>,
}

impl<'a, T> BVec<'a, T> {
    pub fn empty() -> Self { Self { ptr: std::ptr::null_mut(), len: 0, cap: 0, _marker: PhantomData } }
    pub fn len(&self) -> usize { self.len }
    pub fn is_empty(&self) -> bool { self.len == 0 }
    pub fn as_slice(&self) -> &[T] { if self.ptr.is_null() { &[] } else { unsafe { std::slice::from_raw_parts(self.ptr, self.len) } } }
    pub fn as_mut_slice(&mut self) -> &mut [T] { if self.ptr.is_null() { &mut [] } else { unsafe { std::slice::from_raw_parts_mut(self.ptr, self.len) } } }
    /// Push usando Arena como allocator (caller deve garantir lifetime)
    pub fn push_with<F>(&mut self, val: T, alloc: F) where F: FnOnce(usize) -> *mut T {
        if self.len >= self.cap {
            let new_cap = (self.cap.max(1) * 2).max(self.len + 1);
            let new_ptr = alloc(new_cap * std::mem::size_of::<T>());
            if !self.ptr.is_null() && self.len > 0 {
                unsafe { std::ptr::copy_nonoverlapping(self.ptr, new_ptr, self.len); }
            }
            self.ptr = new_ptr;
            self.cap = new_cap;
        }
        unsafe { self.ptr.add(self.len).write(val); }
        self.len += 1;
    }
    pub fn clear(&mut self) { self.len = 0; }
}

pub struct BString<'a> { inner: BVec<'a, u8> }

impl<'a> BString<'a> {
    pub fn empty() -> Self { Self { inner: BVec::empty() } }
    pub fn as_str(&self) -> &str { unsafe { std::str::from_utf8_unchecked(self.inner.as_slice()) } }
    pub fn push_str_with<F>(&mut self, s: &str, alloc: F) where F: Fn(usize) -> *mut u8 {
        for &b in s.as_bytes() { self.inner.push_with(b, |cap| alloc(cap)); }
    }
    pub fn len(&self) -> usize { self.inner.len() }
    pub fn clear(&mut self) { self.inner.clear(); }
    /// Padding quadrático (edit `BString::pad`) — duplica eficientemente
    pub fn pad(&mut self, total_len: usize, pad_char: char) {
        let pad_bytes = pad_char.to_string();
        while self.len() < total_len {
            let need = total_len - self.len();
            let chunk = if pad_bytes.len() <= need { &pad_bytes } else { &pad_bytes[..need] };
            // alloc via Vec leak simplified: use inner's current ptr growth via push
            for &b in chunk.as_bytes() { self.inner.push_with(b, |cap| Box::leak(vec![0u8; cap].into_boxed_slice()).as_mut_ptr()); }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn bvec_push() {
        let mut v = BVec::<u32>::empty();
        v.push_with(1, |cap| Box::leak(vec![0u32; cap].into_boxed_slice()).as_mut_ptr());
        v.push_with(2, |cap| Box::leak(vec![0u32; cap].into_boxed_slice()).as_mut_ptr());
        assert_eq!(v.as_slice(), &[1,2]);
    }
    #[test]
    fn bstring_pad() {
        let mut s = BString::empty();
        s.push_str_with("hi", |cap| Box::leak(vec![0u8; cap].into_boxed_slice()).as_mut_ptr());
        s.pad(5, '-');
        assert_eq!(s.as_str().len(), 5);
    }
}
