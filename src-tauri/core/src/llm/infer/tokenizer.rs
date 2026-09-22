use crate::llm::infer::gguf::GgufReader;
use std::collections::HashMap;

pub struct Tokenizer {
    pub vocab: Vec<String>,
    pub token_to_id: HashMap<String, u32>,
    pub bos_id: u32,
    pub eos_id: u32,
    pub pad_id: u32,
    pub add_bos: bool,
    pub is_bpe: bool,
    merges: Vec<(u32, u32, u32)>,
}

impl Tokenizer {
    pub fn load_from_gguf(reader: &GgufReader) -> crate::error::Result<Self> {
        let model_type = reader.get_metadata_str("tokenizer.ggml.model", "");
        let is_bpe = model_type == "gpt2" || model_type == "bpe";

        let n_vocab = reader.get_metadata_int(
            "tokenizer.ggml.vocab_size",
            reader.get_metadata_int("llama.vocab_size", 32000),
        ) as usize;

        let mut vocab = Vec::with_capacity(n_vocab);
        let mut token_to_id = HashMap::new();

        for i in 0..n_vocab {
            let key1 = format!("tokenizer.ggml.tokens_{}", i);
            let key2 = format!("tokenizer.ggml.tokens[{}]", i);
            let token_str = reader.get_metadata_str(&key1, "");
            let token_str = if token_str.is_empty() {
                reader.get_metadata_str(&key2, "")
            } else {
                token_str
            };
            vocab.push(token_str.clone());
            if !token_str.is_empty() {
                token_to_id.insert(token_str, i as u32);
            }
        }

        let bos_id = reader.get_metadata_int("tokenizer.ggml.bos_token_id", 1) as u32;
        let eos_id = reader.get_metadata_int("tokenizer.ggml.eos_token_id", 2) as u32;
        let pad_id = reader.get_metadata_int("tokenizer.ggml.pad_token_id", 0) as u32;

        crate::cki_info!(
            "Tokenizer: vocab_size={} bos={} eos={}",
            vocab.len(),
            bos_id,
            eos_id
        );

        let mut merges = Vec::new();
        if is_bpe {
            for i in 0.. {
                let key = format!("tokenizer.ggml.merges_{}", i);
                let merge_str = reader.get_metadata_str(&key, "");
                if merge_str.is_empty() {
                    break;
                }
                if let Some(space) = merge_str.find(' ') {
                    let left = &merge_str[..space];
                    let right = &merge_str[space + 1..];
                    if let (Some(&li), Some(&ri)) = (token_to_id.get(left), token_to_id.get(right))
                    {
                        let merged = format!("{}{}", left, right);
                        if let Some(&ni) = token_to_id.get(&merged) {
                            merges.push((li, ri, ni));
                        }
                    }
                }
            }
            crate::cki_info!("  BPE merges: {}", merges.len());
        }

        Ok(Tokenizer {
            vocab,
            token_to_id,
            bos_id,
            eos_id,
            pad_id,
            add_bos: false,
            is_bpe,
            merges,
        })
    }

    pub fn encode(&self, text: &str, max_len: usize) -> Vec<u32> {
        if self.is_bpe && !self.merges.is_empty() {
            self.encode_bpe(text, max_len)
        } else {
            self.encode_spm(text, max_len)
        }
    }

    pub fn decode(&self, tokens: &[u32]) -> String {
        let mut result = String::new();
        for &id in tokens {
            if let Some(s) = self.vocab.get(id as usize) {
                result.push_str(s);
            }
        }
        result
    }

    fn encode_bpe(&self, text: &str, max_len: usize) -> Vec<u32> {
        let byte_table = build_gpt2_byte_table();
        let word_chunks = gpt2_pretokenize(text);
        let mut ids = Vec::new();

        for word in &word_chunks {
            let mut word_ids: Vec<u32> = word
                .bytes()
                .map(|b| {
                    let cp = byte_table[b as usize];
                    let utf8 = char::from_u32(cp)
                        .map(|c| c.to_string())
                        .unwrap_or_default();
                    self.token_to_id.get(&utf8).copied().unwrap_or(b as u32)
                })
                .collect();

            let mut changed = true;
            while changed && ids.len() + word_ids.len() < max_len {
                changed = false;
                let mut best_rank = usize::MAX;
                let mut best_pos = None;
                for i in 0..word_ids.len().saturating_sub(1) {
                    for (rank, &(l, r, ni)) in self.merges.iter().enumerate() {
                        if word_ids[i] == l && word_ids[i + 1] == r {
                            if rank < best_rank {
                                best_rank = rank;
                                best_pos = Some((i, ni));
                            }
                            break;
                        }
                    }
                }
                if let Some((pos, new_id)) = best_pos {
                    word_ids[pos] = new_id;
                    word_ids.remove(pos + 1);
                    changed = true;
                }
            }
            ids.extend(word_ids);
            if ids.len() >= max_len {
                break;
            }
        }
        ids.truncate(max_len);
        ids
    }

    /// SentencePiece-style greedy tokenizer (used by gemma, llama 1/2, mistral, qwen).
    /// Normalizes whitespace to ▁ (U+2581), then does longest-match forward greedy search.
    fn encode_spm(&self, text: &str, max_len: usize) -> Vec<u32> {
        // Normalize: prepend ▁, replace internal spaces with ▁
        let normalized = "\u{2581}".to_string() + &text.replace(' ', "\u{2581}");
        let chars: Vec<char> = normalized.chars().collect();
        let mut result = Vec::new();
        let mut i = 0;
        while i < chars.len() && result.len() < max_len {
            // Try longest match from position i
            let max_look = (chars.len() - i).min(48);
            let mut matched = false;
            for len in (1..=max_look).rev() {
                let s: String = chars[i..i + len].iter().collect();
                if let Some(&id) = self.token_to_id.get(&s) {
                    result.push(id);
                    i += len;
                    matched = true;
                    break;
                }
            }
            if !matched {
                // byte-level fallback using <0xNN> tokens
                let ch: String = chars[i..i + 1].iter().collect();
                for b in ch.as_bytes() {
                    let key = format!("<0x{:02X}>", b);
                    if let Some(&id) = self.token_to_id.get(&key) {
                        result.push(id);
                    }
                }
                i += 1;
            }
        }
        result
    }

    fn encode_fallback(&self, text: &str, max_len: usize) -> Vec<u32> {
        let mut result = Vec::new();
        let mut current = String::new();
        for ch in text.chars() {
            let candidate = format!("{}{}", current, ch);
            if self.token_to_id.contains_key(&candidate) {
                current = candidate;
            } else {
                if !current.is_empty() {
                    if let Some(&id) = self.token_to_id.get(&current) {
                        result.push(id);
                    }
                }
                if let Some(&_id) = self.token_to_id.get(&ch.to_string()) {
                    current = ch.to_string();
                } else {
                    for b in ch.to_string().bytes() {
                        let bs = (b as char).to_string();
                        if let Some(&id) = self.token_to_id.get(&bs) {
                            result.push(id);
                        }
                    }
                    current.clear();
                }
            }
            if result.len() >= max_len - 1 {
                break;
            }
        }
        if !current.is_empty() {
            if let Some(&id) = self.token_to_id.get(&current) {
                result.push(id);
            }
        }
        result
    }
}

fn build_gpt2_byte_table() -> Vec<u32> {
    let mut table = vec![0u32; 256];
    let mut n = 0u32;
    for b in 0..=255 {
        if (33..=126).contains(&b) || (161..=172).contains(&b) || (174..=255).contains(&b) {
            table[b as usize] = b as u32;
        } else {
            table[b as usize] = 256 + n;
            n += 1;
        }
    }
    table
}

fn gpt2_pretokenize(text: &str) -> Vec<String> {
    let mut words = Vec::new();
    let mut i = 0;
    let bytes = text.as_bytes();
    while i < bytes.len() {
        let start = i;
        while i < bytes.len() && bytes[i].is_ascii_whitespace() {
            i += 1;
        }
        let spaces = std::str::from_utf8(&bytes[start..i]).unwrap_or("");

        let start = i;
        while i < bytes.len() && !bytes[i].is_ascii_whitespace() {
            i += 1;
        }
        let content = std::str::from_utf8(&bytes[start..i]).unwrap_or("");

        if !content.is_empty() {
            words.push(format!("{}{}", spaces, content));
        }
    }
    words
}
