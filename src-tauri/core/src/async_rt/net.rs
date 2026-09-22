//! Pure std networking primitives matching Tokio API.

use std::io::{self, Read, Write};
use std::net::{SocketAddr, ToSocketAddrs};

pub struct TcpStream {
    inner: std::net::TcpStream,
}

impl TcpStream {
    pub async fn connect<A: ToSocketAddrs>(addr: A) -> io::Result<Self> {
        let stream = std::net::TcpStream::connect(addr)?;
        Ok(Self { inner: stream })
    }

    pub fn peer_addr(&self) -> io::Result<SocketAddr> {
        self.inner.peer_addr()
    }

    pub fn local_addr(&self) -> io::Result<SocketAddr> {
        self.inner.local_addr()
    }

    pub fn into_inner(self) -> std::net::TcpStream {
        self.inner
    }
}

impl Read for TcpStream {
    fn read(&mut self, buf: &mut [u8]) -> io::Result<usize> {
        self.inner.read(buf)
    }
}

impl Write for TcpStream {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        self.inner.write(buf)
    }

    fn flush(&mut self) -> io::Result<()> {
        self.inner.flush()
    }
}

pub struct TcpListener {
    inner: std::net::TcpListener,
}

impl TcpListener {
    pub async fn bind<A: ToSocketAddrs>(addr: A) -> io::Result<Self> {
        let listener = std::net::TcpListener::bind(addr)?;
        Ok(Self { inner: listener })
    }

    pub async fn accept(&self) -> io::Result<(TcpStream, SocketAddr)> {
        let (stream, addr) = self.inner.accept()?;
        Ok((TcpStream { inner: stream }, addr))
    }

    pub fn local_addr(&self) -> io::Result<SocketAddr> {
        self.inner.local_addr()
    }
}
