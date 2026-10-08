//! Hidden terminal input. Mode guards restore echo on success, errors and unwind.
use std::io::{self, BufRead, IsTerminal, Write};

fn read_line(reader: &mut impl BufRead) -> io::Result<String> {
    let mut line = String::new();
    reader.read_line(&mut line)?;
    if line.ends_with('\n') { line.pop(); if line.ends_with('\r') { line.pop(); } }
    Ok(line)
}

pub fn read_password() -> io::Result<String> {
    io::stderr().flush()?;
    if !io::stdin().is_terminal() { return read_line(&mut io::stdin().lock()); }
    let guard = platform::disable_echo()?;
    let result = read_line(&mut io::stdin().lock());
    drop(guard);
    eprintln!();
    result
}

#[cfg(windows)]
mod platform {
    use std::{ffi::c_void, io};
    #[link(name = "kernel32")]
    extern "system" {
        fn GetStdHandle(which: u32) -> *mut c_void;
        fn GetConsoleMode(handle: *mut c_void, mode: *mut u32) -> i32;
        fn SetConsoleMode(handle: *mut c_void, mode: u32) -> i32;
    }
    pub struct Guard { handle: *mut c_void, mode: u32 }
    impl Drop for Guard {
        fn drop(&mut self) { unsafe { SetConsoleMode(self.handle, self.mode); } }
    }
    pub fn disable_echo() -> io::Result<Guard> {
        // STD_INPUT_HANDLE and ENABLE_ECHO_INPUT. Preserve all other mode bits.
        let handle = unsafe { GetStdHandle(-10i32 as u32) };
        let mut mode = 0;
        if unsafe { GetConsoleMode(handle, &mut mode) } == 0 { return Err(io::Error::last_os_error()); }
        if unsafe { SetConsoleMode(handle, mode & !4) } == 0 { return Err(io::Error::last_os_error()); }
        Ok(Guard { handle, mode })
    }
}

#[cfg(any(target_os = "macos", all(target_os = "linux", any(target_arch = "x86", target_arch = "x86_64", target_arch = "aarch64"))))]
mod platform {
    use std::io;
    // Linux libc termios ABI on x86, x86_64 and aarch64.
    #[repr(C)]
    #[cfg(target_os = "linux")]
    struct Termios { input: u32, output: u32, control: u32, local: u32, line: u8, chars: [u8; 32], input_speed: u32, output_speed: u32 }
    #[cfg(target_os = "macos")]
    #[repr(C)]
    struct Termios { input: std::ffi::c_ulong, output: std::ffi::c_ulong, control: std::ffi::c_ulong, local: std::ffi::c_ulong, chars: [u8; 20], input_speed: std::ffi::c_ulong, output_speed: std::ffi::c_ulong }
    extern "C" {
        fn tcgetattr(fd: i32, modes: *mut Termios) -> i32;
        fn tcsetattr(fd: i32, action: i32, modes: *const Termios) -> i32;
    }
    pub struct Guard(Termios);
    impl Drop for Guard { fn drop(&mut self) { unsafe { tcsetattr(0, 0, &self.0); } } }
    pub fn disable_echo() -> io::Result<Guard> {
        let mut original = std::mem::MaybeUninit::<Termios>::zeroed();
        if unsafe { tcgetattr(0, original.as_mut_ptr()) } != 0 { return Err(io::Error::last_os_error()); }
        let original = unsafe { original.assume_init() };
        let mut hidden = Termios { ..original };
        #[cfg(target_os = "linux")]
        { hidden.local &= !(0x8 | 0x40); } // ECHO | ECHONL
        #[cfg(target_os = "macos")]
        { hidden.local &= !(0x8 | 0x10); }
        if unsafe { tcsetattr(0, 0, &hidden) } != 0 { return Err(io::Error::last_os_error()); }
        Ok(Guard(original))
    }
}

#[cfg(not(any(windows, target_os = "macos", all(target_os = "linux", any(target_arch = "x86", target_arch = "x86_64", target_arch = "aarch64")))))]
mod platform {
    use std::io;
    pub fn disable_echo() -> io::Result<()> { Err(io::Error::new(io::ErrorKind::Unsupported, "hidden terminal input is not implemented for this platform; pipe the key through stdin")) }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn preserves_spaces_and_handles_line_endings() {
        for input in ["  secret  \n", "  secret  \r\n", "  secret  "] {
            assert_eq!(read_line(&mut input.as_bytes()).unwrap(), "  secret  ");
        }
    }
}
