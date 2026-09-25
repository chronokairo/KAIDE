//! OpenCL GPU acceleration for LLM inference on legacy GPUs (AMD Caicos, OpenCL 1.1+).
//!
//! Strategy: upload ALL quantized weight tensors to GPU VRAM at model-load time.
//! Each forward pass uploads only the tiny hidden-state vector and downloads logits.
//! This eliminates per-GEMV host↔device transfers that would dominate latency.
//!
//! Falls back to CPU automatically if:
//! - No OpenCL GPU found
//! - Not enough VRAM (allocation failures)
//! - Tensor type not yet supported

#[cfg(feature = "gpu")]
mod kernels;

#[cfg(feature = "gpu")]
pub mod context;

#[cfg(feature = "gpu")]
pub use context::GpuContext;

/// Returns true only when the gpu feature is enabled and a GPU is found.
pub fn is_available() -> bool {
    #[cfg(feature = "gpu")]
    { context::probe_gpu().is_some() }
    #[cfg(not(feature = "gpu"))]
    { false }
}
