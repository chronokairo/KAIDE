/// OpenCL 1.1+ kernels for LLM inference on legacy GPUs (Caicos, integrated graphics).
/// Each kernel computes a row of the output: y[row] = dot(A[row,:], x).
/// This is a GEMV (matrix-vector multiply) fused with in-kernel dequantization,
/// so quantized weights stay in GPU VRAM and never need to be expanded on the CPU first.
pub const KERNELS_SRC: &str = r#"

/* ---- F16 → F32 conversion (no cl_khr_fp16 extension needed) ---- */
float f16_to_f32(ushort h) {
    uint sign = (uint)(h & 0x8000) << 16;
    int  exp  = (h >> 10) & 0x1F;
    uint mant = (uint)(h & 0x3FF);
    uint bits;
    if (exp == 0) {
        bits = sign;                                /* subnormal → 0 (approx) */
    } else if (exp == 31) {
        bits = sign | 0x7F800000 | (mant << 13);   /* inf / NaN */
    } else {
        bits = sign | (((uint)exp + 112u) << 23) | (mant << 13);
    }
    return as_float(bits);
}

/* ---- plain F32 GEMV ---- */
__kernel void f32_gemv(
    __global const float* A,
    __global const float* x,
    __global float* y,
    int cols)
{
    int row  = get_global_id(0);
    int base = row * cols;
    float sum = 0.0f;
    for (int k = 0; k < cols; k++) sum = fma(A[base + k], x[k], sum);
    y[row] = sum;
}

/* ---- Q4_0 GEMV: block = 2(d f16) + 16(qs 4-bit) = 18 bytes / 32 values ---- */
__kernel void q4_0_gemv(
    __global const uchar* A,
    __global const float* x,
    __global float* y,
    int cols)
{
    int row = get_global_id(0);
    int nb  = cols / 32;
    __global const uchar* row_ptr = A + (long)row * nb * 18;
    float sum = 0.0f;
    for (int b = 0; b < nb; b++) {
        __global const uchar* blk = row_ptr + b * 18;
        float d = f16_to_f32(((ushort)blk[1] << 8) | blk[0]);
        __global const uchar* qs = blk + 2;
        int xb = b * 32;
        for (int l = 0; l < 16; l++) {
            sum = fma(d * (float)((int)(qs[l] & 0xF) - 8), x[xb + l],      sum);
            sum = fma(d * (float)((int)(qs[l] >> 4)  - 8), x[xb + l + 16], sum);
        }
    }
    y[row] = sum;
}

/* ---- Q8_0 GEMV: block = 2(d f16) + 32(qs i8) = 34 bytes / 32 values ---- */
__kernel void q8_0_gemv(
    __global const uchar* A,
    __global const float* x,
    __global float* y,
    int cols)
{
    int row = get_global_id(0);
    int nb  = cols / 32;
    __global const uchar* row_ptr = A + (long)row * nb * 34;
    float sum = 0.0f;
    for (int b = 0; b < nb; b++) {
        __global const uchar* blk = row_ptr + b * 34;
        float d = f16_to_f32(((ushort)blk[1] << 8) | blk[0]);
        __global const char* qs = (__global const char*)(blk + 2);
        int xb = b * 32;
        for (int l = 0; l < 32; l++) sum = fma(d * (float)qs[l], x[xb + l], sum);
    }
    y[row] = sum;
}

/* ---- Q4_K helpers (QK_K = 256 values / block = 144 bytes) ---- */
void q4k_scale_min(__global const uchar* s, int j, float* out_sc, float* out_m) {
    uchar sc, m;
    if (j < 4) {
        sc = s[j] & 63;  m = s[j + 4] & 63;
    } else {
        sc = (s[j + 4] & 0xF) | ((s[j - 4] >> 6) << 4);
        m  = (s[j + 4] >>  4) | ((s[j    ] >> 6) << 4);
    }
    *out_sc = (float)sc;  *out_m = (float)m;
}

/* ---- Q4_K GEMV ---- */
__kernel void q4k_gemv(
    __global const uchar* A,
    __global const float* x,
    __global float* y,
    int rows, int cols)
{
    int row = get_global_id(0);
    if (row >= rows) return;
    int nb = cols / 256;
    __global const uchar* row_ptr = A + (long)row * nb * 144;
    float sum = 0.0f;
    for (int b = 0; b < nb; b++) {
        __global const uchar* blk = row_ptr + b * 144;
        float d    = f16_to_f32(((ushort)blk[1] << 8) | blk[0]);
        float dmin = f16_to_f32(((ushort)blk[3] << 8) | blk[2]);
        __global const uchar* sc_ptr = blk + 4;
        __global const uchar* qs    = blk + 16;
        int xb = b * 256;
        int is = 0, q_off = 0;
        for (int chunk = 0; chunk < 4; chunk++) {
            float sc1, m1, sc2, m2;
            q4k_scale_min(sc_ptr, is,     &sc1, &m1);
            q4k_scale_min(sc_ptr, is + 1, &sc2, &m2);
            float d1 = d * sc1, dm1 = dmin * m1;
            float d2 = d * sc2, dm2 = dmin * m2;
            for (int l = 0; l < 32; l++) {
                sum = fma(d1*(float)(qs[q_off+l]&0xF)-dm1, x[xb+chunk*64+l   ], sum);
                sum = fma(d2*(float)(qs[q_off+l]>>4 )-dm2, x[xb+chunk*64+l+32], sum);
            }
            is += 2;  q_off += 32;
        }
    }
    y[row] = sum;
}

/* ---- Q6_K GEMV: block = 128+64+16(sc i8)+2(d f16) = 210 bytes / 256 values ---- */
__kernel void q6k_gemv(
    __global const uchar* A,
    __global const float* x,
    __global float* y,
    int rows, int cols)
{
    int row = get_global_id(0);
    if (row >= rows) return;
    int nb = cols / 256;
    __global const uchar* row_ptr = A + (long)row * nb * 210;
    float sum = 0.0f;
    for (int b = 0; b < nb; b++) {
        __global const uchar* blk = row_ptr + b * 210;
        __global const uchar* ql = blk;
        __global const uchar* qh = blk + 128;
        __global const char*  sc = (__global const char*)(blk + 192);
        float d = f16_to_f32(((ushort)blk[209] << 8) | blk[208]);
        int xb = b * 256;
        int ql_off = 0, qh_off = 0, sc_off = 0;
        for (int half = 0; half < 2; half++) {
            for (int l = 0; l < 32; l++) {
                int is = l / 16;
                char q1 = (char)(((ql[ql_off+l   ]&0xF)|((((qh[qh_off+l]>>0)&3)<<4)))-32);
                char q2 = (char)(((ql[ql_off+l+32]&0xF)|((((qh[qh_off+l]>>2)&3)<<4)))-32);
                char q3 = (char)(((ql[ql_off+l   ]>>4 )|((((qh[qh_off+l]>>4)&3)<<4)))-32);
                char q4 = (char)(((ql[ql_off+l+32]>>4 )|((((qh[qh_off+l]>>6)&3)<<4)))-32);
                float s1=d*(float)sc[sc_off+is  ], s2=d*(float)sc[sc_off+is+2];
                float s3=d*(float)sc[sc_off+is+4], s4=d*(float)sc[sc_off+is+6];
                int yb = xb + half*128;
                sum = fma(s1*(float)q1, x[yb+l   ], sum);
                sum = fma(s2*(float)q2, x[yb+l+32], sum);
                sum = fma(s3*(float)q3, x[yb+l+64], sum);
                sum = fma(s4*(float)q4, x[yb+l+96], sum);
            }
            ql_off += 64;  qh_off += 32;  sc_off += 8;
        }
    }
    y[row] = sum;
}

/* ---- Q8_K GEMV: block = 4(d f32) + 256(qs i8) + 32(bsums i16) = 292 bytes ---- */
__kernel void q8k_gemv(
    __global const uchar* A,
    __global const float* x,
    __global float* y,
    int rows, int cols)
{
    int row = get_global_id(0);
    if (row >= rows) return;
    int nb = cols / 256;
    __global const uchar* row_ptr = A + (long)row * nb * 292;
    float sum = 0.0f;
    for (int b = 0; b < nb; b++) {
        __global const uchar* blk = row_ptr + b * 292;
        float d = as_float(((uint)blk[3]<<24)|((uint)blk[2]<<16)|((uint)blk[1]<<8)|blk[0]);
        __global const char* qs = (__global const char*)(blk + 4);
        int xb = b * 256;
        for (int l = 0; l < 256; l++) sum = fma(d*(float)qs[l], x[xb+l], sum);
    }
    y[row] = sum;
}

"#;
