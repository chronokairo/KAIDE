use std::sync::OnceLock;

static WORKERS: OnceLock<usize> = OnceLock::new();

/// Configure the std scoped-worker limit to half the available CPUs (min 1).
/// Actual workers are only started for sufficiently large matrix products.
pub fn init_thread_pool() {
    let workers = worker_count();
    crate::cki_info!("CPU matrix worker limit: {workers}");
}
pub fn worker_count() -> usize {
    *WORKERS.get_or_init(|| (std::thread::available_parallelism().map_or(2, |n| n.get()) / 2).max(1))
}

/// Split disjoint output cells across scoped threads without cloning inputs.
fn fill_parallel(out: &mut [f32], cost_per_cell: usize, cell: impl Fn(usize) -> f32 + Sync) {
    let work = out.len().saturating_mul(cost_per_cell);
    let workers = worker_count().min(work / 131_072).max(1).min(out.len().max(1));
    if workers == 1 {
        for (i, value) in out.iter_mut().enumerate() { *value = cell(i); }
        return;
    }
    let chunk_size = out.len().div_ceil(workers);
    std::thread::scope(|scope| {
        for (chunk_index, chunk) in out.chunks_mut(chunk_size).enumerate() {
            let cell = &cell;
            scope.spawn(move || {
                let offset = chunk_index * chunk_size;
                for (i, value) in chunk.iter_mut().enumerate() { *value = cell(offset + i); }
            });
        }
    });
}
pub fn rms_norm(out: &mut [f32], x: &[f32], weight: &[f32], n: usize, rows: usize, eps: f32) {
    for r in 0..rows {
        let offset = r * n;
        let mut ss = 0.0f32;
        for i in 0..n {
            ss += x[offset + i] * x[offset + i];
        }
        let s = 1.0 / (ss / n as f32 + eps).sqrt();
        for i in 0..n {
            out[offset + i] = x[offset + i] * s * weight[i];
        }
    }
}

pub fn rms_norm_inplace(x: &mut [f32], weight: &[f32], n: usize, rows: usize, eps: f32) {
    for r in 0..rows {
        let offset = r * n;
        let mut ss = 0.0f32;
        for i in 0..n {
            ss += x[offset + i] * x[offset + i];
        }
        let s = 1.0 / (ss / n as f32 + eps).sqrt();
        for i in 0..n {
            x[offset + i] = x[offset + i] * s * weight[i];
        }
    }
}

pub fn silu(out: &mut [f32], x: &[f32], n: usize) {
    for i in 0..n {
        out[i] = x[i] / (1.0 + (-x[i]).exp());
    }
}

pub fn silu_inplace(x: &mut [f32], n: usize) {
    for v in x[..n].iter_mut() {
        *v = *v / (1.0 + (-*v).exp());
    }
}

pub fn matmul(dst: &mut [f32], a: &[f32], b: &[f32], m: usize, n: usize, k: usize) {
    let cells = m.checked_mul(n).expect("matrix size overflow");
    fill_parallel(&mut dst[..cells], k, |index| {
        let i = index / n;
        let j = index % n;
        let mut sum = 0.0f32;
        for kk in 0..k { sum += a[i * k + kk] * b[kk * n + j]; }
        sum
    });
}

/// dst[m x n] = a[m x k] x transpose(b[n x k]).
/// Parallelizes output cells, including the single-input-row GEMV case.
pub fn matmul_nt(dst: &mut [f32], a: &[f32], b: &[f32], m: usize, n: usize, k: usize) {
    let cells = m.checked_mul(n).expect("matrix size overflow");
    fill_parallel(&mut dst[..cells], k, |index| {
        let i = index / n;
        let j = index % n;
        let a_row = &a[i * k..(i + 1) * k];
        let b_row = &b[j * k..(j + 1) * k];
        let mut sum = 0.0f32;
        for kk in 0..k { sum += a_row[kk] * b_row[kk]; }
        sum
    });
}
pub fn rope(
    x: &mut [f32],
    n_embd: usize,
    n_head: usize,
    pos: usize,
    n_tokens: usize,
    freq_base: f32,
) {
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
    for i in 0..n {
        dst[i] = a[i] + b[i];
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rectangular_matrix_and_transpose_agree() {
        let a = [1., 2., 3., 4., 5., 6.];
        let b = [7., 8., 9., 10., 11., 12.];
        let bt = [7., 9., 11., 8., 10., 12.];
        let mut actual = [0.; 5];
        let mut transposed = [0.; 5];
        matmul(&mut actual, &a, &b, 2, 2, 3);
        matmul_nt(&mut transposed, &a, &bt, 2, 2, 3);
        assert_eq!(actual, [58., 64., 139., 154., 0.]);
        assert_eq!(actual, transposed);
    }
    #[test]
    fn large_gemv_matches_scalar_reference() {
        let (n, k) = (1024, 1024);
        let a: Vec<f32> = (0..k).map(|i| (i % 7) as f32 * 0.25).collect();
        let b: Vec<f32> = (0..n*k).map(|i| (i % 11) as f32 - 5.).collect();
        let expected: Vec<f32> = b.chunks_exact(k).map(|row| row.iter().zip(&a).map(|(x,y)| x*y).sum()).collect();
        let mut actual = vec![0.; n];
        matmul_nt(&mut actual, &a, &b, 1, n, k);
        assert_eq!(actual, expected);
    }
    #[test]
    fn zero_dimensions_do_not_write() {
        let mut output = [42.; 4];
        matmul(&mut output, &[], &[], 2, 0, 0);
        matmul_nt(&mut output, &[], &[], 0, 2, 0);
        assert_eq!(output, [42.; 4]);
        matmul(&mut output, &[], &[], 2, 2, 0);
        assert_eq!(output, [0.; 4]);
    }
}