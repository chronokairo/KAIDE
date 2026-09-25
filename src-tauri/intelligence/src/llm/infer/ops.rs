use rayon::prelude::*;

/// Initialize rayon thread pool to half the available logical CPUs (min 1).
/// Call once at startup. Safe to call multiple times (subsequent calls are no-ops).
pub fn init_thread_pool() {
    let total = std::thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(2);
    let threads = (total / 2).max(1);
    // rayon::ThreadPoolBuilder returns an error only if a pool was already built — ignore it.
    let _ = rayon::ThreadPoolBuilder::new()
        .num_threads(threads)
        .build_global();
    log::info!("CPU thread pool: {threads} threads (of {total} logical cores)");
}

pub fn rms_norm(out: &mut [f32], x: &[f32], weight: &[f32], n: usize, rows: usize, eps: f32) {
    for r in 0..rows {
        let offset = r * n;
        let mut ss = 0.0f32;
        for i in 0..n { ss += x[offset + i] * x[offset + i]; }
        let s = 1.0 / (ss / n as f32 + eps).sqrt();
        for i in 0..n { out[offset + i] = x[offset + i] * s * weight[i]; }
    }
}

pub fn rms_norm_inplace(x: &mut [f32], weight: &[f32], n: usize, rows: usize, eps: f32) {
    for r in 0..rows {
        let offset = r * n;
        let mut ss = 0.0f32;
        for i in 0..n { ss += x[offset + i] * x[offset + i]; }
        let s = 1.0 / (ss / n as f32 + eps).sqrt();
        for i in 0..n { x[offset + i] = x[offset + i] * s * weight[i]; }
    }
}

pub fn silu(out: &mut [f32], x: &[f32], n: usize) {
    for i in 0..n { out[i] = x[i] / (1.0 + (-x[i]).exp()); }
}

pub fn silu_inplace(x: &mut [f32], n: usize) {
    for v in x[..n].iter_mut() { *v = *v / (1.0 + (-*v).exp()); }
}

pub fn matmul(dst: &mut [f32], a: &[f32], b: &[f32], m: usize, n: usize, k: usize) {
    dst[..m * n]
        .par_chunks_mut(n)
        .enumerate()
        .for_each(|(i, row)| {
            for j in 0..n {
                let mut sum = 0.0f32;
                for kk in 0..k { sum += a[i * k + kk] * b[kk * n + j]; }
                row[j] = sum;
            }
        });
}

/// Matrix multiply: dst[m×n] = a[m×k] × b^T[n×k]  (b is row-major, rows=output neurons)
/// This is the hot path — parallelised over output rows.
pub fn matmul_nt(dst: &mut [f32], a: &[f32], b: &[f32], m: usize, n: usize, k: usize) {
    dst[..m * n]
        .par_chunks_mut(n)           // one chunk per output row (m chunks total)
        .enumerate()
        .for_each(|(i, row)| {
            let a_row = &a[i * k..(i + 1) * k];
            for j in 0..n {
                let b_row = &b[j * k..(j + 1) * k];
                let mut sum = 0.0f32;
                // SIMD-friendly dot product — compiler auto-vectorises this
                for kk in 0..k { sum += a_row[kk] * b_row[kk]; }
                row[j] = sum;
            }
        });
}

pub fn rope(x: &mut [f32], n_embd: usize, n_head: usize, pos: usize, n_tokens: usize, freq_base: f32) {
    let head_dim = n_embd / n_head;
    for t in 0..n_tokens {
        for h in 0..n_head {
            for hh in 0..head_dim / 2 {
                let theta = pos as f32 * freq_base.powf(-2.0 * hh as f32 / head_dim as f32);
                let cos_t = theta.cos();
                let sin_t = theta.sin();
                let row = &mut x[t * n_embd + h * head_dim..];
                let v0 = row[hh];
                let v1 = row[hh + head_dim / 2];
                row[hh] = v0 * cos_t - v1 * sin_t;
                row[hh + head_dim / 2] = v0 * sin_t + v1 * cos_t;
            }
        }
    }
}

pub fn softmax(x: &mut [f32], n: usize, rows: usize) {
    for r in 0..rows {
        let row = &mut x[r * n..(r + 1) * n];
        let maxv = row.iter().cloned().fold(f32::NEG_INFINITY, f32::max);
        let mut sum = 0.0;
        for v in row.iter_mut().take(n) {
            *v = (*v - maxv).exp();
            sum += *v;
        }
        let inv = 1.0 / sum;
        for v in row.iter_mut().take(n) {
            *v *= inv;
        }
    }
}

pub fn add(dst: &mut [f32], a: &[f32], b: &[f32], n: usize) {
    for i in 0..n { dst[i] = a[i] + b[i]; }
}
