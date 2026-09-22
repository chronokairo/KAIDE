//! OS entropy for identifiers; SplitMix64 for non-cryptographic model sampling.
use std::io;

pub fn system_u64() -> io::Result<u64> {
    let mut bytes = [0; 8];
    fill(&mut bytes)?;
    Ok(u64::from_ne_bytes(bytes))
}

#[cfg(windows)]
fn fill(bytes: &mut [u8]) -> io::Result<()> {
    #[link(name = "bcrypt")]
    extern "system" {
        fn BCryptGenRandom(algorithm: *mut std::ffi::c_void, buffer: *mut u8, size: u32, flags: u32) -> i32;
    }
    // BCRYPT_USE_SYSTEM_PREFERRED_RNG; the API writes exactly size bytes.
    let status = unsafe { BCryptGenRandom(std::ptr::null_mut(), bytes.as_mut_ptr(), bytes.len() as u32, 2) };
    if status < 0 { Err(io::Error::other(format!("system RNG failed: {status:#x}"))) } else { Ok(()) }
}

#[cfg(unix)]
fn fill(bytes: &mut [u8]) -> io::Result<()> {
    use std::io::Read;
    std::fs::File::open("/dev/urandom")?.read_exact(bytes)
}

#[cfg(not(any(windows, unix)))]
fn fill(_: &mut [u8]) -> io::Result<()> { Err(io::Error::new(io::ErrorKind::Unsupported, "system RNG unavailable")) }

pub struct Sampler(u64);
impl Sampler {
    pub fn new() -> io::Result<Self> { Ok(Self(system_u64()?)) }
    fn next(&mut self) -> u64 {
        self.0 = self.0.wrapping_add(0x9e3779b97f4a7c15);
        let mut z = self.0;
        z = (z ^ (z >> 30)).wrapping_mul(0xbf58476d1ce4e5b9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94d049bb133111eb);
        z ^ (z >> 31)
    }
    /// Uniform f32 in [0, 1), using all 24 significant bits.
    pub fn unit_f32(&mut self) -> f32 { (self.next() >> 40) as f32 / 16_777_216.0 }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn splitmix_reference_vector() { assert_eq!(Sampler(0).next(), 0xe220a8397b1dcdaf); }
    #[test]
    fn sample_bounds() {
        let mut rng = Sampler(42);
        for _ in 0..10000 { assert!((0.0..1.0).contains(&rng.unit_f32())); }
    }
    #[test]
    fn os_entropy_available() { system_u64().unwrap(); }
}
