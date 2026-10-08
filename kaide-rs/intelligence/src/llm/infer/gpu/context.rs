//! GpuContext — OpenCL 1.1+ context + pre-uploaded weight buffers.

use super::kernels::KERNELS_SRC;
use crate::llm::infer::gguf::GgmlType;
use crate::llm::infer::model::Model;
use anyhow::Result;
use ocl::{Buffer, Context, Device, DeviceType, Kernel, MemFlags, Platform, Program, Queue};
use std::collections::HashMap;

/// Returns the first OpenCL GPU platform+device found, or None.
pub fn probe_gpu() -> Option<(Platform, Device)> {
    for platform in Platform::list() {
        if let Ok(devices) = Device::list(platform, Some(DeviceType::GPU)) {
            if let Some(device) = devices.into_iter().next() {
                return Some((platform, device));
            }
        }
    }
    None
}

struct GpuBuf {
    buf: Buffer<u8>,
    ty: GgmlType,
    rows: usize,
    cols: usize,
}

/// OpenCL context with all model weights pre-uploaded to GPU VRAM.
pub struct GpuContext {
    queue: Queue,
    program: Program,
    weights: HashMap<String, GpuBuf>,
    /// Scratch buffer for the input vector (re-used each call).
    x_buf: Buffer<f32>,
    x_len: usize,
}

impl GpuContext {
    /// Build GPU context and upload all tensors from the model.
    /// Returns error if no GPU found or total VRAM insufficient.
    pub fn new(model: &Model) -> Result<Self> {
        let (platform, device) =
            probe_gpu().ok_or_else(|| anyhow::anyhow!("No OpenCL GPU found"))?;

        let device_name: String = device.name().unwrap_or_default();
        log::info!("GPU: {}", device_name);

        let context = Context::builder()
            .platform(platform)
            .devices(device)
            .build()?;
        let queue = Queue::new(&context, device, None)?;

        let program = Program::builder()
            .src(KERNELS_SRC)
            .devices(device)
            .build(&context)
            .map_err(|e| anyhow::anyhow!("OpenCL kernel compile error: {}", e))?;

        log::info!("OpenCL kernels compiled successfully");

        // Upload all weight tensors to GPU VRAM.
        let mut weights: HashMap<String, GpuBuf> = HashMap::new();
        let mut total_bytes: usize = 0;

        for (name, tensor) in &model.tensors {
            if tensor.data.is_empty() {
                continue;
            }

            // Only tensor types for which we have GPU kernels.
            let supported = matches!(
                tensor.ty,
                GgmlType::F32
                    | GgmlType::Q4_0
                    | GgmlType::Q8_0
                    | GgmlType::Q4_K
                    | GgmlType::Q6_K
                    | GgmlType::Q8_K
            );
            if !supported {
                log::debug!(
                    "GPU: skipping unsupported tensor {} ({:?})",
                    name,
                    tensor.ty
                );
                continue;
            }

            // For GEMV the weight matrix is [rows × cols] where:
            //   rows = n_out (number of output features = dim 1 in GGUF row-major)
            //   cols = n_in  (number of input  features = dim 0)
            let cols = tensor.dims[0] as usize; // inner dimension
            let rows = if tensor.dims.len() > 1 {
                tensor.dims[1] as usize
            } else {
                1
            };

            let buf = Buffer::<u8>::builder()
                .queue(queue.clone())
                .flags(MemFlags::READ_ONLY | MemFlags::COPY_HOST_PTR)
                .len(tensor.data.len())
                .copy_host_slice(&tensor.data)
                .build()
                .map_err(|e| anyhow::anyhow!("GPU upload failed for {}: {}", name, e))?;

            total_bytes += tensor.data.len();
            weights.insert(
                name.clone(),
                GpuBuf {
                    buf,
                    ty: tensor.ty,
                    rows,
                    cols,
                },
            );
        }

        log::info!(
            "GPU: uploaded {:.1} MB of weights ({} tensors)",
            total_bytes as f64 / 1_048_576.0,
            weights.len()
        );

        // Allocate scratch x_buf with max possible input dimension.
        let max_cols = model
            .tensors
            .values()
            .map(|t| t.dims[0] as usize)
            .max()
            .unwrap_or(4096);

        let x_buf = Buffer::<f32>::builder()
            .queue(queue.clone())
            .flags(MemFlags::READ_ONLY)
            .len(max_cols)
            .build()?;

        Ok(GpuContext {
            queue,
            program,
            weights,
            x_buf,
            x_len: max_cols,
        })
    }

    /// GPU GEMV: out = W × x  where W is the named weight tensor.
    /// Returns false if the tensor is not on GPU (caller should use CPU fallback).
    pub fn gemv(&mut self, name: &str, x: &[f32], out: &mut [f32]) -> Result<bool> {
        let entry = match self.weights.get(name) {
            Some(e) => e,
            None => return Ok(false),
        };

        let rows = entry.rows;
        let cols = entry.cols;

        if x.len() < cols || out.len() < rows {
            return Ok(false);
        }

        // Upload hidden state (tiny: a few KB).
        if cols > self.x_len {
            self.x_buf = Buffer::<f32>::builder()
                .queue(self.queue.clone())
                .flags(MemFlags::READ_ONLY)
                .len(cols)
                .build()?;
            self.x_len = cols;
        }
        self.x_buf.write(&x[..cols]).enq()?;

        // Allocate output buffer.
        let y_buf = Buffer::<f32>::builder()
            .queue(self.queue.clone())
            .flags(MemFlags::WRITE_ONLY)
            .len(rows)
            .build()?;

        let kernel_name = kernel_for(entry.ty);
        let kernel = build_kernel(
            &self.program,
            &self.queue,
            kernel_name,
            &entry.buf,
            &self.x_buf,
            &y_buf,
            rows,
            cols,
            entry.ty,
        )?;

        unsafe {
            kernel.cmd().global_work_size(rows).enq()?;
        }

        y_buf.read(&mut out[..rows]).enq()?;
        Ok(true)
    }

    pub fn has_tensor(&self, name: &str) -> bool {
        self.weights.contains_key(name)
    }
}

fn kernel_for(ty: GgmlType) -> &'static str {
    match ty {
        GgmlType::F32 => "f32_gemv",
        GgmlType::Q4_0 => "q4_0_gemv",
        GgmlType::Q8_0 => "q8_0_gemv",
        GgmlType::Q4_K => "q4k_gemv",
        GgmlType::Q6_K => "q6k_gemv",
        GgmlType::Q8_K => "q8k_gemv",
        _ => "f32_gemv",
    }
}

fn build_kernel(
    program: &Program,
    queue: &Queue,
    name: &str,
    a_buf: &Buffer<u8>,
    x_buf: &Buffer<f32>,
    y_buf: &Buffer<f32>,
    rows: usize,
    cols: usize,
    ty: GgmlType,
) -> Result<Kernel> {
    // Simple types (f32/q4_0/q8_0) take 4 args; K-quant types take 5 (rows + cols).
    let k = match ty {
        GgmlType::F32 | GgmlType::Q4_0 | GgmlType::Q8_0 => Kernel::builder()
            .program(program)
            .name(name)
            .queue(queue.clone())
            .arg(a_buf)
            .arg(x_buf)
            .arg(y_buf)
            .arg(cols as i32)
            .build()?,
        _ => Kernel::builder()
            .program(program)
            .name(name)
            .queue(queue.clone())
            .arg(a_buf)
            .arg(x_buf)
            .arg(y_buf)
            .arg(rows as i32)
            .arg(cols as i32)
            .build()?,
    };
    Ok(k)
}
