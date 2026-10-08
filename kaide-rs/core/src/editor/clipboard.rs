//! Clipboard interno adaptado de microsoft/edit.
//!
//! Mantém uma cópia local quando o terminal não oferece OSC 52 ou quando o
//! conteúdo é grande demais para sincronizar imediatamente com o host.

#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct Clipboard {
    data: String,
    line_copy: bool,
    wants_host_sync: bool,
}

impl Clipboard {
    pub fn read(&self) -> &str { &self.data }
    pub fn is_empty(&self) -> bool { self.data.is_empty() }
    pub fn wants_host_sync(&self) -> bool { self.wants_host_sync }
    pub fn mark_as_synchronized(&mut self) { self.wants_host_sync = false; }
    pub fn is_line_copy(&self) -> bool { self.line_copy }
    pub fn write(&mut self, data: impl Into<String>) {
        self.data = data.into();
        self.line_copy = false;
        self.wants_host_sync = !self.data.is_empty();
    }
    pub fn write_line(&mut self, data: impl Into<String>) {
        self.data = data.into();
        self.line_copy = true;
        self.wants_host_sync = !self.data.is_empty();
    }
}
