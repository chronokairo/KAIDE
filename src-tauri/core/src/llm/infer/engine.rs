use crate::llm::infer::model::Tensor;
use crate::llm::infer::tokenizer::Tokenizer;
use crate::llm::infer::{gguf, ops};
use crate::error::Result;


pub struct InferenceEngine {
    model: super::model::Model,
    tokenizer: Tokenizer,
    kv_cache: Vec<f32>,
    n_past: usize,
    max_seq_len: usize,
    act: Vec<f32>,
    weights: Vec<f32>,
    /// Reusable embedding row scratch buffer (`n_embd`), to avoid allocating a
    /// fresh `Vec<f32>` on every `forward()` call when extracting a single
    /// token's embedding row (TODO item 20).
    emb_buf: Vec<f32>,
    #[cfg(feature = "gpu")]
    gpu: Option<super::gpu::GpuContext>,
}

fn tn(layer: i64, base: &str) -> String {
    format!("blk.{}.{}.weight", layer, base)
}

fn dequant_tensor(t: &Tensor, weights: &mut [f32]) {
    t.dequantize_to_f32(weights);
}

/// GEMV helper: out[0..rows] = W × x[0..cols]
/// Tries GPU first; falls back to CPU dequant + matmul_nt.
fn gemv(
    name: &str,
    model: &super::model::Model,
    weights: &mut [f32],
    x: &[f32],
    out: &mut [f32],
    rows: usize,
    cols: usize,
    #[cfg(feature = "gpu")] gpu: &mut Option<super::gpu::GpuContext>,
) {
    #[cfg(feature = "gpu")]
    if let Some(ref mut ctx) = gpu {
        match ctx.gemv(name, &x[..cols], &mut out[..rows]) {
            Ok(true) => return,
            Ok(false) => {}
            Err(e) => crate::cki_debug!("GPU GEMV failed for {}: {} — using CPU", name, e),
        }
    }
    // CPU path
    if let Some(t) = model.tensors.get(name) {
        dequant_tensor(t, weights);
        ops::matmul_nt(out, x, weights, 1, rows, cols);
    }
}
// Inference hot path: many scratch buffers are passed directly to avoid a
// per-call allocation. Grouping them would add an allocation to every token.
#[allow(clippy::too_many_arguments)]
fn forward_layer(
    model: &super::model::Model,
    kv_cache: &mut [f32],
    weights: &mut [f32],
    n_past: usize,
    max_seq_len: usize,
    layer: i64,
    hidden: &mut [f32],
    scores: &mut [f32],
    attn_out: &mut [f32],
    residual: &mut [f32],
    q_buf: &mut [f32],
    k_buf: &mut [f32],
    v_buf: &mut [f32],
    gate_buf: &mut [f32],
    up_buf: &mut [f32],
    #[cfg(feature = "gpu")] gpu: &mut Option<super::gpu::GpuContext>,
) {
    let n_embd = model.n_embd as usize;
    let n_head = model.n_head as usize;
    let n_kv_head = model.n_head_kv as usize;
    let head_dim = model.n_embd_head_k as usize;
    let n_ff = model.n_ff as usize;
    let q_size = n_head * head_dim;
    let kv_size = n_kv_head * head_dim;

    residual.copy_from_slice(&hidden[..n_embd]);

    let name = tn(layer, "attn_norm");
    if let Some(t) = model.tensors.get(&name) {
        dequant_tensor(t, weights);
        ops::rms_norm_inplace(hidden, &weights[..n_embd], n_embd, 1, model.norm_eps);
    }

    gemv(
        &tn(layer, "attn_q"),
        model,
        weights,
        hidden,
        q_buf,
        q_size,
        n_embd,
        #[cfg(feature = "gpu")]
        gpu,
    );
    gemv(
        &tn(layer, "attn_k"),
        model,
        weights,
        hidden,
        k_buf,
        kv_size,
        n_embd,
        #[cfg(feature = "gpu")]
        gpu,
    );
    gemv(
        &tn(layer, "attn_v"),
        model,
        weights,
        hidden,
        v_buf,
        kv_size,
        n_embd,
        #[cfg(feature = "gpu")]
        gpu,
    );

    ops::rope(q_buf, q_size, n_head, n_past, 1, model.rope_freq_base);
    ops::rope(k_buf, kv_size, n_kv_head, n_past, 1, model.rope_freq_base);

    let k_slot_start = layer as usize * 2 * max_seq_len * n_embd;
    let (k_slot, v_slot) = kv_cache[k_slot_start..].split_at_mut(max_seq_len * n_embd);

    k_slot[n_past * n_embd..n_past * n_embd + kv_size].copy_from_slice(&k_buf[..kv_size]);
    v_slot[n_past * n_embd..n_past * n_embd + kv_size].copy_from_slice(&v_buf[..kv_size]);

    let s = n_past + 1;
    let inv_scale = 1.0 / (head_dim as f32).sqrt();
    let q_per_kv = n_head / n_kv_head;

    for h in 0..n_head {
        let h_kv = h / q_per_kv;
        for ss in 0..s {
            let mut sum = 0.0;
            for d in 0..head_dim {
                sum += q_buf[h * head_dim + d] * k_slot[ss * n_embd + h_kv * head_dim + d];
            }
            scores[h * s + ss] = sum * inv_scale;
        }
    }

    for h in 0..n_head {
        let offset = h * s;
        let mut maxv = scores[offset];
        for ss in 0..s {
            if ss > n_past {
                scores[offset + ss] = f32::NEG_INFINITY;
            } else if scores[offset + ss] > maxv {
                maxv = scores[offset + ss];
            }
        }
        let mut sum = 0.0;
        for ss in 0..=n_past {
            scores[offset + ss] = (scores[offset + ss] - maxv).exp();
            sum += scores[offset + ss];
        }
        let inv = 1.0 / sum;
        for ss in 0..s {
            scores[offset + ss] *= inv;
        }
    }

    attn_out.fill(0.0);
    for h in 0..n_head {
        let h_kv = h / q_per_kv;
        for ss in 0..=n_past {
            let w = scores[h * s + ss];
            for d in 0..head_dim {
                attn_out[h * head_dim + d] += w * v_slot[ss * n_embd + h_kv * head_dim + d];
            }
        }
    }

    // attn_output: [n_embd × n_embd]
    gemv(
        &tn(layer, "attn_output"),
        model,
        weights,
        attn_out,
        gate_buf,
        n_embd,
        n_embd,
        #[cfg(feature = "gpu")]
        gpu,
    );
    attn_out[..n_embd].copy_from_slice(&gate_buf[..n_embd]);

    for i in 0..n_embd {
        hidden[i] += attn_out[i];
    }
    residual.copy_from_slice(&hidden[..n_embd]);

    let name = tn(layer, "ffn_norm");
    if let Some(t) = model.tensors.get(&name) {
        dequant_tensor(t, weights);
        ops::rms_norm_inplace(hidden, &weights[..n_embd], n_embd, 1, model.norm_eps);
    }

    let gw_exists = model.tensors.contains_key(&tn(layer, "ffn_gate"));
    let uw_exists = model.tensors.contains_key(&tn(layer, "ffn_up"));
    if gw_exists && uw_exists {
        gemv(
            &tn(layer, "ffn_gate"),
            model,
            weights,
            hidden,
            gate_buf,
            n_ff,
            n_embd,
            #[cfg(feature = "gpu")]
            gpu,
        );
        gemv(
            &tn(layer, "ffn_up"),
            model,
            weights,
            hidden,
            up_buf,
            n_ff,
            n_embd,
            #[cfg(feature = "gpu")]
            gpu,
        );
        ops::silu_inplace(gate_buf, n_ff);
        for i in 0..n_ff {
            gate_buf[i] *= up_buf[i];
        }

        gemv(
            &tn(layer, "ffn_down"),
            model,
            weights,
            gate_buf,
            hidden,
            n_embd,
            n_ff,
            #[cfg(feature = "gpu")]
            gpu,
        );
        for i in 0..n_embd {
            hidden[i] += residual[i];
        }
    }
}

impl InferenceEngine {
    pub fn new(model: super::model::Model, tokenizer: Tokenizer, max_seq_len: usize) -> Self {
        let scratch = (model.n_embd * 3
            + model.n_head * model.n_embd_head_k * 2
            + model.n_ff * 2
            + model.n_head * max_seq_len as i64
            + model.n_embd) as usize;
        let act = vec![0.0f32; scratch];

        let max_tensor = model
            .tensors
            .values()
            .map(|t| t.nelements() as usize)
            .max()
            .unwrap_or(1);
        let weights = vec![0.0f32; max_tensor];

        // Reusable per-token embedding row scratch buffer — avoids a fresh
        // heap allocation on every `forward()` token (TODO item 20).
        let emb_buf = vec![0.0f32; model.n_embd as usize];

        let kv_cache_size = (model.n_layer * 2 * max_seq_len as i64 * model.n_embd) as usize;
        let kv_cache = vec![0.0f32; kv_cache_size];

        #[allow(unused_mut)]
        let mut engine = InferenceEngine {
            model,
            tokenizer,
            kv_cache,
            n_past: 0,
            max_seq_len,
            act,
            weights,
            emb_buf,
            #[cfg(feature = "gpu")]
            gpu: None,
        };
        #[cfg(feature = "gpu")]
        {
            if !std::env::var("CKC_NO_GPU").is_ok_and(|v| v == "1" || v == "true") {
                engine.init_gpu();
            }
        }
        engine
    }

    /// Explicitly disable GPU acceleration and release any OpenCL resources.
    pub fn disable_gpu(&mut self) {
        #[cfg(feature = "gpu")]
        {
            self.gpu = None;
            crate::cki_info!("GPU acceleration disabled; using CPU");
        }
    }

    /// Try to initialise GPU acceleration. Logs a warning if unavailable.
    pub fn init_gpu(&mut self) {
        #[cfg(feature = "gpu")]
        {
            match super::gpu::GpuContext::new(&self.model) {
                Ok(ctx) => {
                    crate::cki_info!("GPU acceleration enabled");
                    self.gpu = Some(ctx);
                }
                Err(e) => crate::cki_warn!("GPU init failed (CPU fallback): {}", e),
            }
        }
        #[cfg(not(feature = "gpu"))]
        crate::cki_warn!("Built without --features gpu; using CPU only");
    }

    pub fn gpu_active(&self) -> bool {
        #[cfg(feature = "gpu")]
        {
            self.gpu.is_some()
        }
        #[cfg(not(feature = "gpu"))]
        {
            false
        }
    }

    pub fn n_embd(&self) -> usize {
        self.model.n_embd as usize
    }

    fn forward(&mut self, token_id: u32, logits: &mut [f32]) -> Result<()> {
        let n_embd = self.model.n_embd as usize;
        let n_layers = self.model.n_layer as usize;
        let s = self.n_past + 1;

        crate::error::ensure!(s <= self.max_seq_len, "Max sequence length exceeded");

        let emb = {
            let emb = self
                .model
                .tensors
                .get("token_embd.weight")
                .or_else(|| self.model.tensors.get("tok_embeddings.weight"))
                .or_else(|| self.model.tensors.get("gpt.embd.weight"))
                .ok_or_else(|| crate::error::anyhow!("No token embedding tensor found"))?;

            let emb_row_size = emb.dims[0] as usize;
            match emb.ty {
                gguf::GgmlType::F32 => {
                    let start = token_id as usize * emb_row_size * 4;
                    let mut row = vec![0.0; emb_row_size];
                    super::model::decode_f32(&emb.data[start..start + emb_row_size * 4], &mut row);
                    row
                }
                _ => {
                    emb.dequantize_to_f32(&mut self.weights);
                    self.weights
                        [token_id as usize * emb_row_size..(token_id as usize + 1) * emb_row_size]
                        .to_vec()
                }
            }
        };

        let n_head = self.model.n_head as usize;
        let n_kv_head = self.model.n_head_kv as usize;
        let head_dim = self.model.n_embd_head_k as usize;
        let q_size = n_head * head_dim;
        let kv_size = n_kv_head * head_dim;
        let n_ff = self.model.n_ff as usize;

        let (act_head, rest) = self.act.split_at_mut(n_embd);
        let (residual, rest) = rest.split_at_mut(n_embd);
        let (q_buf, rest) = rest.split_at_mut(q_size);
        let (k_buf, rest) = rest.split_at_mut(kv_size);
        let (v_buf, rest) = rest.split_at_mut(kv_size);
        let (gate_buf, rest) = rest.split_at_mut(n_ff);
        let (up_buf, rest) = rest.split_at_mut(n_ff);
        let (scores_h, attn_out_h) = rest.split_at_mut(n_head * self.max_seq_len);

        act_head.copy_from_slice(&emb);

        for layer in 0..n_layers {
            forward_layer(
                &self.model,
                &mut self.kv_cache,
                &mut self.weights,
                self.n_past,
                self.max_seq_len,
                layer as i64,
                act_head,
                scores_h,
                attn_out_h,
                residual,
                q_buf,
                k_buf,
                v_buf,
                gate_buf,
                up_buf,
                #[cfg(feature = "gpu")]
                &mut self.gpu,
            );
        }

        {
            let norm_w = self
                .model
                .tensors
                .get("output_norm.weight")
                .or_else(|| self.model.tensors.get("norm.weight"));
            if let Some(nw) = norm_w {
                nw.dequantize_to_f32(&mut self.weights);
                ops::rms_norm_inplace(
                    act_head,
                    &self.weights[..n_embd],
                    n_embd,
                    1,
                    self.model.norm_eps,
                );
            }
        }

        {
            let output_w = self
                .model
                .tensors
                .get("output.weight")
                .or_else(|| self.model.tensors.get("token_embd.weight"));
            if let Some(ow) = output_w {
                ow.dequantize_to_f32(&mut self.weights);
                let n_out = ow.dims[1] as usize;
                let k_dim = ow.dims[0] as usize;
                ops::matmul_nt(logits, act_head, &self.weights, 1, n_out, k_dim);
            }
        }

        self.n_past += 1;
        Ok(())
    }

    pub fn generate(
        &mut self,
        prompt: &str,
        max_tokens: usize,
        temperature: f32,
        top_k: usize,
    ) -> Result<String> {
        let (text, _) = self.generate_inner(prompt, max_tokens, temperature, top_k, true)?;
        Ok(text)
    }

    /// Embed `text` into a normalized vector using the final layer's hidden
    /// state of the last token (last-token pooling, matching Qwen3-Embedding
    /// and Jina v5 retrieval models). The KV cache is reset so the engine
    /// remains reusable for later generation or embedding calls.
    pub fn embed(&mut self, text: &str) -> Result<Vec<f32>> {
        let tokens = self
            .tokenizer
            .encode(text, self.max_seq_len.saturating_sub(1));
        crate::error::ensure!(!tokens.is_empty(), "failed to tokenize text for embedding");
        self.n_past = 0;
        let n_vocab = self.model.n_vocab as usize;
        let mut logits = vec![0.0f32; n_vocab];
        for &token in &tokens {
            self.forward(token, &mut logits)?;
        }
        let n_embd = self.model.n_embd as usize;
        let mut embedding = self.act[..n_embd].to_vec();
        self.n_past = 0;
        let norm = embedding
            .iter()
            .map(|value| value * value)
            .sum::<f32>()
            .sqrt();
        if norm > 1e-12 {
            for value in embedding.iter_mut() {
                *value /= norm;
            }
        }
        Ok(embedding)
    }

    /// Silent generation for benchmarking. Returns (output_text, tokens_generated).
    pub fn generate_bench(
        &mut self,
        prompt: &str,
        max_tokens: usize,
        temperature: f32,
        top_k: usize,
    ) -> Result<(String, usize)> {
        self.generate_inner(prompt, max_tokens, temperature, top_k, false)
    }

    /// Interactive generation with streaming to stdout. Returns (output_text, tokens_generated).
    pub fn generate_interactive(
        &mut self,
        prompt: &str,
        max_tokens: usize,
        temperature: f32,
        top_k: usize,
    ) -> Result<(String, usize)> {
        self.generate_inner(prompt, max_tokens, temperature, top_k, true)
    }

    fn generate_inner(
        &mut self,
        prompt: &str,
        max_tokens: usize,
        temperature: f32,
        top_k: usize,
        verbose: bool,
    ) -> Result<(String, usize)> {
        let input_tokens = self.tokenizer.encode(prompt, 512);
        if input_tokens.is_empty() {
            crate::error::bail!("Failed to tokenize prompt");
        }

        let n_vocab = self.model.n_vocab as usize;
        let mut logits = vec![0.0f32; n_vocab];
        let mut output = String::new();
        let mut tokens_generated = 0usize;

        for &tok in &input_tokens {
            self.forward(tok, &mut logits)?;
        }

        let mut rng = crate::random::Sampler::new()?;

        for _ in 0..max_tokens {
            let mut last_token;
            if temperature < 0.01 {
                let idx = logits
                    .iter()
                    .enumerate()
                    .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal))
                    .map(|(i, _)| i)
                    .unwrap_or(0);
                last_token = idx as u32;
            } else {
                for l in logits.iter_mut() {
                    *l /= temperature;
                }
                if top_k > 0 && top_k < n_vocab {
                    let mut scored: Vec<(f32, usize)> =
                        logits.iter().enumerate().map(|(i, &v)| (v, i)).collect();
                    scored.select_nth_unstable_by(top_k - 1, |a, b| {
                        b.0.partial_cmp(&a.0).unwrap_or(std::cmp::Ordering::Equal)
                    });
                    let threshold = scored[top_k - 1].0;
                    for v in logits.iter_mut() {
                        if *v < threshold {
                            *v = f32::NEG_INFINITY;
                        }
                    }
                }
                let maxv = logits.iter().cloned().fold(f32::NEG_INFINITY, f32::max);
                let mut sum = 0.0;
                for l in logits.iter_mut() {
                    *l = (*l - maxv).exp();
                    sum += *l;
                }
                let inv = 1.0 / sum;
                for l in logits.iter_mut() {
                    *l *= inv;
                }

                let r: f32 = rng.unit_f32();
                let mut cum = 0.0;
                last_token = (n_vocab - 1) as u32;
                for (j, &v) in logits.iter().enumerate() {
                    cum += v;
                    if r < cum {
                        last_token = j as u32;
                        break;
                    }
                }
            }

            if last_token == self.tokenizer.eos_id {
                break;
            }
            let piece = self.tokenizer.decode(&[last_token]);
            output.push_str(&piece);
            tokens_generated += 1;
            if verbose {
                print!("{}", piece);
                use std::io::Write;
                std::io::stdout().flush().ok();
            }
            self.forward(last_token, &mut logits)?;
        }
        if verbose {
            println!();
        }
        Ok((output, tokens_generated))
    }
}
