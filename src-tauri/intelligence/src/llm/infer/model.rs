use std::collections::HashMap;
use crate::llm::infer::gguf::{GgufReader, GgmlType};

fn half_to_f32(h: u16) -> f32 {
    let sign = ((h & 0x8000) as u32) << 16;
    let exp = ((h >> 10) & 0x1F) as i32 - 15 + 127;
    let mant = (h & 0x03FF) as u32;
    if exp <= 0 {
        let m = (mant | 0x0400) >> (1 - exp);
        let u = sign | (m << 13);
        return f32::from_le_bytes(u.to_le_bytes());
    }
    if exp >= 255 {
        let u = sign | 0x7F800000 | (mant << 13);
        return f32::from_le_bytes(u.to_le_bytes());
    }
    let u = sign | ((exp as u32) << 23) | (mant << 13);
    f32::from_le_bytes(u.to_le_bytes())
}

fn dequantize_q4_0_row(block: &[u8], out: &mut [f32], n: i64) {
    let num_blocks = (n + 31) / 32;
    for b in 0..num_blocks {
        let b_offset = b as usize * 18;
        if b_offset + 18 > block.len() {
            break;
        }
        let d_bits = u16::from_le_bytes(block[b_offset..b_offset + 2].try_into().unwrap_or_default());
        let d = half_to_f32(d_bits);
        for i in 0..16 {
            let q = block[b_offset + 2 + i];
            let idx_base = b * 32 + i as i64 * 2;
            let q0 = (((q & 0x0F) as i8) << 4) as f32 * 0.0625f32;
            let q1 = ((q & 0xF0) as i8) as f32 * 0.0625f32;
            if idx_base < n && (idx_base as usize) < out.len() {
                out[idx_base as usize] = q0 * d;
            }
            if idx_base + 1 < n && ((idx_base + 1) as usize) < out.len() {
                out[(idx_base + 1) as usize] = q1 * d;
            }
        }
    }
}

fn dequantize_q8_0_row(block: &[u8], out: &mut [f32], n: i64) {
    let num_blocks = (n + 31) / 32;
    for b in 0..num_blocks {
        let b_offset = b as usize * 34;
        if b_offset + 34 > block.len() {
            break;
        }
        let d_bits = u16::from_le_bytes(block[b_offset..b_offset + 2].try_into().unwrap_or_default());
        let d = half_to_f32(d_bits);
        for i in 0..32 {
            let q = block[b_offset + 2 + i] as i8;
            let idx = (b * 32 + i as i64) as usize;
            if (b * 32 + i as i64) < n && idx < out.len() {
                out[idx] = (q as f32) * d;
            }
        }
    }
}

fn dequantize_f16_row(block: &[u8], out: &mut [f32], n: i64) {
    let count = (n as usize).min(out.len());
    for (i, slot) in out[..count].iter_mut().enumerate() {
        let offset = i * 2;
        if offset + 2 > block.len() {
            break;
        }
        let h = u16::from_le_bytes(block[offset..offset + 2].try_into().unwrap_or_default());
        *slot = half_to_f32(h);
    }
}

pub struct Tensor {
    pub name: String,
    pub ty: GgmlType,
    pub dims: Vec<i64>,
    pub data: Vec<u8>,
}

impl Tensor {
    pub fn nelements(&self) -> i64 {
        let mut n = 1;
        for &d in &self.dims { n *= d; }
        n
    }

    pub fn dequantize_to_f32(&self, out: &mut [f32]) {
        let n = self.nelements();
        match self.ty {
            GgmlType::F32 => {
                let src = bytemuck::cast_slice::<u8, f32>(&self.data);
                out[..n as usize].copy_from_slice(&src[..n as usize]);
            },
            GgmlType::F16 => dequantize_f16_row(&self.data, out, n),
            GgmlType::Q4_0 => {
                for row in (0..n).step_by(self.dims[0] as usize) {
                    let row_size = self.dims[0];
                    let src = &self.data[(row / self.dims[0]) as usize * ((row_size + 31) / 32) as usize * 18..];
                    dequantize_q4_0_row(src, &mut out[row as usize..], row_size);
                }
            },
            GgmlType::Q8_0 => {
                for row in (0..n).step_by(self.dims[0] as usize) {
                    let row_size = self.dims[0];
                    let src = &self.data[(row / self.dims[0]) as usize * ((row_size + 31) / 32) as usize * 34..];
                    dequantize_q8_0_row(src, &mut out[row as usize..], row_size);
                }
            },
            GgmlType::Q4_K => dequantize_q4_k(&self.data, out, n),
            GgmlType::Q5_0 => dequantize_q5_0(&self.data, out, n),
            GgmlType::Q6_K => dequantize_q6_k(&self.data, out, n),
            GgmlType::Q8_K => dequantize_q8_k(&self.data, out, n),
            _ => {
                log::warn!("Unsupported type for dequantization: {:?}", self.ty);
                for o in out.iter_mut().take(n as usize) { *o = 0.0; }
            }
        }
    }
}

pub struct Model {
    pub n_vocab: i64,
    pub n_embd: i64,
    pub n_mult: i64,
    pub n_head: i64,
    pub n_head_kv: i64,
    pub n_layer: i64,
    pub n_ff: i64,
    pub norm_eps: f32,
    pub n_embd_head_k: i64,
    pub n_embd_head_v: i64,
    pub n_expert: i64,
    pub n_expert_used: i64,
    pub rope_freq_base: f32,
    pub rope_freq_scale: f32,
    pub tensors: HashMap<String, Tensor>,
}

impl Model {
    pub fn load(path: &str) -> anyhow::Result<Self> {
        let reader = GgufReader::load(path)?;

        // Detect architecture prefix (gemma3, qwen3, llama, mistral, etc.)
        let arch = reader.get_metadata_str("general.architecture", "llama");
        let pfx = arch.as_str();

        macro_rules! meta_int {
            ($key:expr, $default:expr) => {
                reader.get_metadata_int(&format!("{}.{}", pfx, $key),
                    reader.get_metadata_int(&format!("llama.{}", $key), $default))
            };
        }
        macro_rules! meta_float {
            ($key:expr, $default:expr) => {
                reader.get_metadata_float(&format!("{}.{}", pfx, $key),
                    reader.get_metadata_float(&format!("llama.{}", $key), $default))
            };
        }

        let n_vocab = meta_int!("vocab_size",
            reader.get_metadata_int("tokenizer.ggml.vocab_size", 32000));
        let n_embd = meta_int!("embedding_length", 4096);
        let n_head = meta_int!("attention.head_count", 32);
        let n_head_kv = meta_int!("attention.head_count_kv", n_head);
        let n_layer = meta_int!("block_count", 32);
        let n_ff = meta_int!("feed_forward_length", 4 * n_embd);
        let norm_eps = meta_float!("attention.layer_norm_rms_epsilon", 1e-5) as f32;
        let n_expert = meta_int!("expert_count", 0);
        let n_expert_used = meta_int!("expert_used_count", 0);
        let rope_freq_base = meta_float!("rope.freq_base", 10000.0) as f32;
        let rope_freq_scale = meta_float!("rope.freq_scale", 1.0) as f32;
        let n_mult = meta_int!("feed_forward_length", 256);

        // head_dim: some models store explicitly (e.g. gemma3 uses key_length)
        let n_embd_head_k = meta_int!("attention.key_length",
            reader.get_metadata_int(&format!("{}.attention.head_dim", pfx), n_embd / n_head));
        let n_embd_head_v = meta_int!("attention.value_length", n_embd_head_k);

        let mut tensors = HashMap::new();
        for (name, info) in &reader.tensors {
            if let Some(data) = reader.tensor_data(name) {
                let t = Tensor {
                    name: name.clone(),
                    ty: info.ty,
                    dims: info.dims.clone(),
                    data: data.to_vec(),
                };
                tensors.insert(name.clone(), t);
            }
        }

        // Override n_vocab with actual output-weight row count (handles models with non-standard vocab sizes, e.g. gemma3 256K).
        let n_vocab = tensors.get("output.weight")
            .or_else(|| tensors.get("token_embd.weight"))
            .and_then(|t| t.dims.get(1).copied())
            .unwrap_or(n_vocab);

        log::info!("Model: vocab={} embd={} head={} layers={} ff={} n_head_kv={}",
            n_vocab, n_embd, n_head, n_layer, n_ff, n_head_kv);
        log::info!("Loaded {} tensors", tensors.len());

        Ok(Model {
            n_vocab, n_embd, n_mult, n_head, n_head_kv, n_layer, n_ff,
            norm_eps, n_embd_head_k, n_embd_head_v, n_expert, n_expert_used,
            rope_freq_base, rope_freq_scale, tensors,
        })
    }
}

// ── k-quant dequantization (llama.cpp ggml-quants.c compatible) ──────────────

const QK_K: usize = 256;

/// Q4_K: block = 2(d f16) + 2(dmin f16) + 12(scales) + 128(4-bit qs) = 144 bytes
fn dequantize_q4_k(data: &[u8], out: &mut [f32], n: i64) {
    const BLOCK: usize = 144;
    let nb = (n as usize).div_ceil(QK_K);
    for b in 0..nb {
        let bs = b * BLOCK;
        let d    = half_to_f32(u16::from_le_bytes([data[bs],   data[bs+1]]));
        let dmin = half_to_f32(u16::from_le_bytes([data[bs+2], data[bs+3]]));
        let scales = &data[bs+4..bs+16];
        let qs = &data[bs+16..bs+144];

        let y_base = b * QK_K;
        let y_len  = (n as usize - y_base).min(QK_K);

        let mut is = 0usize;
        let mut q_off = 0usize;
        for chunk in 0..4 {
            let (sc1, m1) = q4k_scale_min(is,     scales);
            let (sc2, m2) = q4k_scale_min(is + 1, scales);
            let d1 = d * sc1 as f32;  let m1 = dmin * m1 as f32;
            let d2 = d * sc2 as f32;  let m2 = dmin * m2 as f32;
            let base = chunk * 64;
            for l in 0..32usize {
                if base + l      < y_len { out[y_base + base + l]      = d1 * (qs[q_off+l] & 0xF) as f32 - m1; }
                if base + l + 32 < y_len { out[y_base + base + l + 32] = d2 * (qs[q_off+l] >> 4)  as f32 - m2; }
            }
            is += 2;
            q_off += 32;
        }
    }
}

fn q4k_scale_min(j: usize, q: &[u8]) -> (u8, u8) {
    if j < 4 {
        (q[j] & 63, q[j + 4] & 63)
    } else {
        (
            (q[j + 4] & 0xF) | ((q[j - 4] >> 6) << 4),
            (q[j + 4] >>  4) | ((q[j    ] >> 6) << 4),
        )
    }
}

/// Q6_K: block = 128(ql) + 64(qh) + 16(scales i8) + 2(d f16) = 210 bytes
fn dequantize_q6_k(data: &[u8], out: &mut [f32], n: i64) {
    const BLOCK: usize = 210;
    let nb = (n as usize).div_ceil(QK_K);
    for b in 0..nb {
        let bs = b * BLOCK;
        let ql = &data[bs..bs+128];
        let qh = &data[bs+128..bs+192];
        let _sc = &data[bs+192..bs+208];
        let d_all = half_to_f32(u16::from_le_bytes([data[bs+208], data[bs+209]]));

        let y_base = b * QK_K;
        let y_len  = (n as usize - y_base).min(QK_K);

        let mut ql_off = 0usize;
        let mut qh_off = 0usize;
        let mut sc_off = 0usize;
        for _half in 0..2 {
            for l in 0..32usize {
                let is = l / 16;
                let q1 = (((ql[ql_off+l]    & 0xF) | ((qh[qh_off+l] & 3) << 4)) as i8).wrapping_sub(32);
                let q2 = (((ql[ql_off+l+32] & 0xF) | (((qh[qh_off+l] >> 2) & 3) << 4)) as i8).wrapping_sub(32);
                let q3 = (((ql[ql_off+l]    >> 4)  | (((qh[qh_off+l] >> 4) & 3) << 4)) as i8).wrapping_sub(32);
                let q4 = (((ql[ql_off+l+32] >> 4)  | (((qh[qh_off+l] >> 6) & 3) << 4)) as i8).wrapping_sub(32);
                let s1 = data[bs+192 + sc_off + is    ] as i8 as f32;
                let s2 = data[bs+192 + sc_off + is + 2] as i8 as f32;
                let s3 = data[bs+192 + sc_off + is + 4] as i8 as f32;
                let s4 = data[bs+192 + sc_off + is + 6] as i8 as f32;
                let y_base2 = y_base + _half * 128;
                if l      < y_len.saturating_sub(_half*128) { out[y_base2 + l]      = d_all * s1 * q1 as f32; }
                if l + 32 < y_len.saturating_sub(_half*128) { out[y_base2 + l + 32] = d_all * s2 * q2 as f32; }
                if l + 64 < y_len.saturating_sub(_half*128) { out[y_base2 + l + 64] = d_all * s3 * q3 as f32; }
                if l + 96 < y_len.saturating_sub(_half*128) { out[y_base2 + l + 96] = d_all * s4 * q4 as f32; }
            }
            ql_off += 64;
            qh_off += 32;
            sc_off += 8;
        }
    }
}

/// Q8_K: block = 4(d f32) + 256(qs i8) + 32(bsums i16) = 292 bytes
fn dequantize_q8_k(data: &[u8], out: &mut [f32], n: i64) {
    const BLOCK: usize = 292;
    let nb = (n as usize).div_ceil(QK_K);
    for b in 0..nb {
        let bs = b * BLOCK;
        let d = f32::from_le_bytes([data[bs], data[bs+1], data[bs+2], data[bs+3]]);
        let qs = &data[bs+4..bs+260];
        let y_base = b * QK_K;
        let y_len  = (n as usize - y_base).min(QK_K);
        for i in 0..y_len {
            out[y_base + i] = d * (qs[i] as i8) as f32;
        }
    }
}

/// Q5_0: block = 2(d f16) + 4(qh upper bits) + 16(qs lower 4 bits) = 22 bytes / 32 values
fn dequantize_q5_0(data: &[u8], out: &mut [f32], n: i64) {
    const BLOCK: usize = 22;
    const QK: usize = 32;
    let nb = (n as usize).div_ceil(QK);
    for b in 0..nb {
        let bs = b * BLOCK;
        let d = half_to_f32(u16::from_le_bytes([data[bs], data[bs+1]]));
        let qh = &data[bs+2..bs+6];   // 4 bytes = 32 bits, one per value
        let qs = &data[bs+6..bs+22];  // 16 bytes = 32 nibbles
        let y_base = b * QK;
        let y_len = (n as usize - y_base).min(QK);
        for i in 0..y_len {
            let nibble = (qs[i / 2] >> ((i % 2) * 4)) & 0xF;
            let upper_bit = (qh[i / 8] >> (i % 8)) & 1;
            let q = (nibble | (upper_bit << 4)) as i8 as i32 - 16;
            out[y_base + i] = d * q as f32;
        }
    }
}
