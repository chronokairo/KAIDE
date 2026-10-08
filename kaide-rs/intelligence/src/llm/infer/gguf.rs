use std::collections::HashMap;
use std::io::Read;
use anyhow::{Result, Context};

const GGUF_MAGIC: u32 = 0x46554747;

#[derive(Debug, Clone, Copy, PartialEq)]
#[repr(i32)]
#[allow(non_camel_case_types)]
pub enum GgmlType {
    F32 = 0, F16 = 1, Q4_0 = 2, Q4_1 = 3, Q5_0 = 6, Q5_1 = 7, Q8_0 = 8, Q8_1 = 9,
    Q2_K = 10, Q3_K = 11, Q4_K = 12, Q5_K = 13, Q6_K = 14, Q8_K = 15,
    IQ2_XXS = 16, IQ2_XS = 17, IQ3_XXS = 18, IQ1_S = 19, IQ4_NL = 20,
    IQ3_S = 21, IQ2_S = 22, IQ4_XS = 23, I8 = 24, I16 = 25, I32 = 26, I64 = 27,
    F64 = 28, IQ1_M = 29, BF16 = 30,
    TQ1_0 = 31, TQ2_0 = 32, NVFP4 = 33,
}

impl TryFrom<i32> for GgmlType {
    type Error = anyhow::Error;

    fn try_from(value: i32) -> Result<Self, Self::Error> {
        match value {
            0 => Ok(GgmlType::F32),
            1 => Ok(GgmlType::F16),
            2 => Ok(GgmlType::Q4_0),
            3 => Ok(GgmlType::Q4_1),
            6 => Ok(GgmlType::Q5_0),
            7 => Ok(GgmlType::Q5_1),
            8 => Ok(GgmlType::Q8_0),
            9 => Ok(GgmlType::Q8_1),
            10 => Ok(GgmlType::Q2_K),
            11 => Ok(GgmlType::Q3_K),
            12 => Ok(GgmlType::Q4_K),
            13 => Ok(GgmlType::Q5_K),
            14 => Ok(GgmlType::Q6_K),
            15 => Ok(GgmlType::Q8_K),
            16 => Ok(GgmlType::IQ2_XXS),
            17 => Ok(GgmlType::IQ2_XS),
            18 => Ok(GgmlType::IQ3_XXS),
            19 => Ok(GgmlType::IQ1_S),
            20 => Ok(GgmlType::IQ4_NL),
            21 => Ok(GgmlType::IQ3_S),
            22 => Ok(GgmlType::IQ2_S),
            23 => Ok(GgmlType::IQ4_XS),
            24 => Ok(GgmlType::I8),
            25 => Ok(GgmlType::I16),
            26 => Ok(GgmlType::I32),
            27 => Ok(GgmlType::I64),
            28 => Ok(GgmlType::F64),
            29 => Ok(GgmlType::IQ1_M),
            30 => Ok(GgmlType::BF16),
            31 => Ok(GgmlType::TQ1_0),
            32 => Ok(GgmlType::TQ2_0),
            33 => Ok(GgmlType::NVFP4),
            other => anyhow::bail!("Unsupported or invalid GgmlType tag: {other}"),
        }
    }
}

pub fn ggml_blck_size(t: GgmlType) -> usize {
    match t {
        GgmlType::F32 | GgmlType::F16 | GgmlType::BF16 | GgmlType::I8
        | GgmlType::I16 | GgmlType::I32 | GgmlType::I64 | GgmlType::F64 => 1,
        GgmlType::Q4_0 | GgmlType::Q4_1 | GgmlType::Q5_0 | GgmlType::Q5_1
        | GgmlType::Q8_0 | GgmlType::Q8_1 | GgmlType::IQ4_NL => 32,
        GgmlType::Q2_K | GgmlType::Q3_K | GgmlType::Q4_K | GgmlType::Q5_K
        | GgmlType::Q6_K | GgmlType::Q8_K | GgmlType::IQ2_XXS | GgmlType::IQ2_XS
        | GgmlType::IQ3_XXS | GgmlType::IQ1_S | GgmlType::IQ3_S | GgmlType::IQ2_S
        | GgmlType::IQ4_XS | GgmlType::IQ1_M | GgmlType::TQ1_0 | GgmlType::TQ2_0 => 256,
        GgmlType::NVFP4 => 64,
    }
}

pub fn ggml_type_size(t: GgmlType) -> usize {
    match t {
        GgmlType::F32 => 4, GgmlType::F16 => 2, GgmlType::BF16 => 2, GgmlType::I8 => 1,
        GgmlType::I16 => 2, GgmlType::I32 => 4, GgmlType::I64 => 8, GgmlType::F64 => 8,
        GgmlType::Q4_0 => 18, GgmlType::Q4_1 => 20, GgmlType::Q5_0 => 22, GgmlType::Q5_1 => 24,
        GgmlType::Q8_0 => 34, GgmlType::Q8_1 => 36,
        GgmlType::Q2_K => 2 + 64 + 2, GgmlType::Q3_K => 2 + 32 + 2 + 64,
        GgmlType::Q4_K => 2 + 2 + 12 + 128, GgmlType::Q5_K => 2 + 2 + 12 + 32 + 128,
        GgmlType::Q6_K => 128 + 64 + 16 + 2, GgmlType::Q8_K => 4 + 256 + 32,
        GgmlType::IQ2_XXS | GgmlType::IQ2_XS => 2 + 4 + 32 + 64,
        GgmlType::IQ3_XXS => 2 + 4 + 64 + 32, GgmlType::IQ1_S => 2 + 4 + 32 + 32,
        GgmlType::IQ3_S => 2 + 4 + 64 + 32, GgmlType::IQ2_S => 2 + 4 + 32 + 64,
        GgmlType::IQ4_XS => 2 + 4 + 128 + 64, GgmlType::IQ1_M => 2 + 4 + 32 + 32,
        GgmlType::IQ4_NL => 2 + 16,
        GgmlType::NVFP4 => 4 + 32,
        _ => 0,
    }
}

pub struct GgufTensorInfo {
    pub name: String,
    pub dims: Vec<i64>,
    pub ty: GgmlType,
    pub offset: u64,
}

pub struct GgufReader {
    pub data: Vec<u8>,
    pub alignment: u64,
    pub tensors: HashMap<String, GgufTensorInfo>,
    pub metadata_str: HashMap<String, String>,
    pub metadata_int: HashMap<String, i64>,
    pub metadata_float: HashMap<String, f64>,
    pub tensor_data_offset: usize,
}

impl GgufReader {
    pub fn load(path: &str) -> Result<Self> {
        let mut file = std::fs::File::open(path).context("Failed to open GGUF file")?;
        let mut data = Vec::new();
        file.read_to_end(&mut data)?;

        let mut pos = 0usize;
        let mut rdr = GgufReader { data, alignment: 32, tensors: HashMap::new(), metadata_str: HashMap::new(), metadata_int: HashMap::new(), metadata_float: HashMap::new(), tensor_data_offset: 0 };

        let magic = rdr.read_u32(&mut pos)?;
        anyhow::ensure!(magic == GGUF_MAGIC, "Not a valid GGUF file");
        let _version = rdr.read_u32(&mut pos)?;

        let tensor_count = rdr.read_u64(&mut pos)? as usize;
        let kv_count = rdr.read_u64(&mut pos)? as usize;

        for _ in 0..kv_count {
            let key = rdr.read_string(&mut pos)?;
            let val_type_i = rdr.read_i32(&mut pos)?;
            match val_type_i {
                0 => { let v = rdr.read_u8(&mut pos)?; rdr.metadata_uint32_insert(&key, v as u32); },
                1 => { let v = rdr.read_i8(&mut pos)?; rdr.metadata_int.insert(key.clone(), v as i64); },
                2 => { let v = rdr.read_u16(&mut pos)?; rdr.metadata_uint32_insert(&key, v as u32); },
                3 => { let v = rdr.read_i16(&mut pos)?; rdr.metadata_int.insert(key.clone(), v as i64); },
                4 => { let v = rdr.read_u32(&mut pos)?; rdr.metadata_uint32_insert(&key, v); },
                5 => { let v = rdr.read_i32(&mut pos)?; rdr.metadata_int.insert(key.clone(), v as i64); },
                6 => { let v = rdr.read_f32(&mut pos)?; rdr.metadata_float.insert(key.clone(), v as f64); },
                7 => { let v = rdr.read_u8(&mut pos)?; rdr.metadata_int.insert(key.clone(), v as i64); },
                8 => { let v = rdr.read_string(&mut pos)?; rdr.metadata_str.insert(key.clone(), v); },
                10 | 11 => { let v = rdr.read_i64(&mut pos)?; rdr.metadata_int.insert(key.clone(), v); },
                12 => { let v = rdr.read_f64(&mut pos)?; rdr.metadata_float.insert(key.clone(), v); },
                9 => {
                    let arr_type = rdr.read_i32(&mut pos)?;
                    let arr_n = rdr.read_u64(&mut pos)? as usize;
                    for i in 0..arr_n {
                        match arr_type {
                            0 | 1 | 7 => { rdr.read_u8(&mut pos)?; },
                            2 | 3     => { rdr.read_u16(&mut pos)?; },
                            4..=6 => {
                                let v = rdr.read_u32(&mut pos)?;
                                rdr.metadata_int.insert(format!("{}_{}", key, i), v as i64);
                            },
                            8 => {
                                let s = rdr.read_string(&mut pos)?;
                                rdr.metadata_str.insert(format!("{}_{}", key, i), s);
                            },
                            10..=12 => {
                                let v = rdr.read_u64(&mut pos)?;
                                rdr.metadata_int.insert(format!("{}_{}", key, i), v as i64);
                            },
                            _ => {},
                        }
                    }
                },
                _ => {},
            }
            if key == "general.alignment" {
                rdr.alignment = rdr.metadata_int.get("general.alignment").copied().unwrap_or(32) as u64;
            }
        }

        for _ in 0..tensor_count {
            let name = rdr.read_string(&mut pos)?;
            let n_dims = rdr.read_u32(&mut pos)? as usize;
            let mut dims = Vec::with_capacity(n_dims);
            for _ in 0..n_dims {
                dims.push(rdr.read_i64(&mut pos)?);
            }
            let ty_i = rdr.read_i32(&mut pos)?;
            let ty = GgmlType::try_from(ty_i)?;
            let offset = rdr.read_u64(&mut pos)?;
            rdr.tensors.insert(name.clone(), GgufTensorInfo { name, dims, ty, offset });
        }

        let align = rdr.alignment as usize;
        rdr.tensor_data_offset = (pos + align - 1) & !(align - 1);

        Ok(rdr)
    }

    pub fn tensor_data(&self, name: &str) -> Option<&[u8]> {
        let info = self.tensors.get(name)?;
        let start = self.tensor_data_offset.checked_add(info.offset as usize)?;
        let blck = ggml_blck_size(info.ty);
        if blck == 0 {
            return None;
        }
        let ts = ggml_type_size(info.ty);
        let n_blocks = (info.nelements() + blck as i64 - 1) / blck as i64;
        let nbytes = (n_blocks as usize).checked_mul(ts)?;
        let end = start.checked_add(nbytes)?;
        if end > self.data.len() {
            return None;
        }
        Some(&self.data[start..end])
    }

    fn read_bytes<'a>(&'a self, pos: &mut usize, len: usize) -> Result<&'a [u8]> {
        let end = pos.checked_add(len).context("GGUF offset overflow")?;
        if end > self.data.len() {
            anyhow::bail!("unexpected EOF parsing GGUF at pos {pos} (requested {len} bytes, data len {})", self.data.len());
        }
        let slice = &self.data[*pos..end];
        *pos = end;
        Ok(slice)
    }

    fn read_u8(&self, pos: &mut usize) -> Result<u8> { Ok(self.read_bytes(pos, 1)?[0]) }
    fn read_i8(&self, pos: &mut usize) -> Result<i8> { Ok(self.read_bytes(pos, 1)?[0] as i8) }
    fn read_u16(&self, pos: &mut usize) -> Result<u16> { Ok(u16::from_le_bytes(self.read_bytes(pos, 2)?.try_into().unwrap())) }
    fn read_i16(&self, pos: &mut usize) -> Result<i16> { Ok(i16::from_le_bytes(self.read_bytes(pos, 2)?.try_into().unwrap())) }
    fn read_u32(&self, pos: &mut usize) -> Result<u32> { Ok(u32::from_le_bytes(self.read_bytes(pos, 4)?.try_into().unwrap())) }
    fn read_i32(&self, pos: &mut usize) -> Result<i32> { Ok(i32::from_le_bytes(self.read_bytes(pos, 4)?.try_into().unwrap())) }
    fn read_u64(&self, pos: &mut usize) -> Result<u64> { Ok(u64::from_le_bytes(self.read_bytes(pos, 8)?.try_into().unwrap())) }
    fn read_i64(&self, pos: &mut usize) -> Result<i64> { Ok(i64::from_le_bytes(self.read_bytes(pos, 8)?.try_into().unwrap())) }
    fn read_f32(&self, pos: &mut usize) -> Result<f32> { Ok(f32::from_le_bytes(self.read_bytes(pos, 4)?.try_into().unwrap())) }
    fn read_f64(&self, pos: &mut usize) -> Result<f64> { Ok(f64::from_le_bytes(self.read_bytes(pos, 8)?.try_into().unwrap())) }

    fn read_string(&self, pos: &mut usize) -> Result<String> {
        let len = self.read_u64(pos)? as usize;
        let bytes = self.read_bytes(pos, len)?;
        Ok(String::from_utf8_lossy(bytes).to_string())
    }

    fn metadata_uint32_insert(&mut self, key: &str, val: u32) {
        self.metadata_int.insert(key.to_string(), val as i64);
    }

    pub fn get_metadata_int(&self, key: &str, default: i64) -> i64 {
        self.metadata_int.get(key).copied().unwrap_or(default)
    }

    pub fn get_metadata_float(&self, key: &str, default: f64) -> f64 {
        self.metadata_float.get(key).copied().unwrap_or(default)
    }

    pub fn get_metadata_str(&self, key: &str, default: &str) -> String {
        self.metadata_str.get(key).cloned().unwrap_or(default.to_string())
    }
}

impl GgufTensorInfo {
    pub fn nelements(&self) -> i64 {
        let mut n = 1i64;
        for &d in &self.dims { n *= d; }
        n
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn invalid_ggml_type_returns_error() {
        assert!(GgmlType::try_from(999).is_err());
        assert_eq!(GgmlType::try_from(0).unwrap(), GgmlType::F32);
        assert_eq!(GgmlType::try_from(2).unwrap(), GgmlType::Q4_0);
    }

    #[test]
    fn truncated_gguf_returns_error_without_panic() {
        let truncated_data = vec![0x47, 0x55, 0x47, 0x46, 0x01]; // magic + 1 byte
        let mut pos = 0usize;
        let rdr = GgufReader {
            data: truncated_data,
            alignment: 32,
            tensors: HashMap::new(),
            metadata_str: HashMap::new(),
            metadata_int: HashMap::new(),
            metadata_float: HashMap::new(),
            tensor_data_offset: 0,
        };
        assert!(rdr.read_u32(&mut pos).is_ok());
        assert!(rdr.read_u32(&mut pos).is_err()); // should safely fail on truncated bytes
    }
}
