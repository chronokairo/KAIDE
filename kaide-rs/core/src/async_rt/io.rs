//! Async read and write extension traits over std::io.
#![allow(async_fn_in_trait)]

use std::io::{self, Read, Write};

#[allow(async_fn_in_trait)]
pub trait AsyncReadExt {
    async fn read(&mut self, buf: &mut [u8]) -> io::Result<usize>;
    async fn read_exact(&mut self, buf: &mut [u8]) -> io::Result<()>;
    async fn read_to_end(&mut self, buf: &mut Vec<u8>) -> io::Result<usize>;
}

impl<R: Read + Unpin> AsyncReadExt for R {
    async fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        R::read(self, buf)
    }

    async fn read_exact(&mut self, buf: &mut [u8]) -> io::Result<()> {
        R::read_exact(self, buf)
    }

    async fn read_to_end(&mut self, buf: &mut Vec<u8>) -> io::Result<usize> {
        R::read_to_end(self, buf)
    }
}

#[allow(async_fn_in_trait)]
pub trait AsyncWriteExt {
    async fn write(&mut self, buf: &[u8]) -> io::Result<usize>;
    async fn write_all(&mut self, buf: &[u8]) -> io::Result<()>;
    async fn flush(&mut self) -> io::Result<()>;
}

impl<W: Write + Unpin> AsyncWriteExt for W {
    async fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        W::write(self, buf)
    }

    async fn write_all(&mut self, buf: &[u8]) -> io::Result<()> {
        W::write_all(self, buf)
    }

    async fn flush(&mut self) -> io::Result<()> {
        W::flush(self)
    }
}
