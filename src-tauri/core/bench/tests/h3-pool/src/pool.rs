#[derive(Debug, PartialEq)]
pub struct Buffer {
    pub data: Vec<u8>,
}

pub struct BufferPool {
    buffers: Vec<Buffer>,
}

impl BufferPool {
    pub fn with_capacity(n: usize) -> Self {
        Self {
            buffers: (0..n).map(|i| Buffer { data: vec![i as u8] }).collect(),
        }
    }

    pub fn available(&self) -> usize {
        self.buffers.len()
    }
}
