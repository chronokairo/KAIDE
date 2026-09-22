//! Optional accelerator boundary.
//!
//! The original prototype used OpenCL, which violated the harness' zero-lib
//! policy and made builds depend on a system SDK.  The feature remains as a
//! compatibility switch, but intentionally reports an unavailable accelerator
//! and lets the inference engine use its standard-library CPU path.

#[cfg(feature = "gpu")]
pub struct GpuContext;

#[cfg(feature = "gpu")]
impl GpuContext {
    pub fn new(_model: &crate::llm::infer::model::Model) -> crate::error::Result<Self> {
        Err(crate::error::anyhow!("GPU acceleration is unavailable in zero-lib builds"))
    }

    pub fn gemv(
        &mut self,
        _name: &str,
        _x: &[f32],
        _out: &mut [f32],
    ) -> crate::error::Result<bool> {
        Ok(false)
    }
}

/// Returns true only when the gpu feature is enabled and a GPU is found.
pub fn is_available() -> bool {
    false
}
