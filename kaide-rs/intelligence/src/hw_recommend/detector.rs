use std::fs;

pub struct HardwareInfo {
    pub cpu_brand: String,
    pub cpu_cores: u32,
    pub cpu_physical_cores: u32,
    pub cpu_ghz: f64,
    pub memory_total_gb: u32,
    pub memory_free_gb: u32,
    pub gpu_model: String,
    pub gpu_vram_gb: u32,
    pub gpu_vendor: String,
    pub os_arch: String,
    pub is_apple_silicon: bool,
    pub has_dedicated_gpu: bool,
    pub usable_mem_gb: f64,
}

pub fn detect_hardware() -> HardwareInfo {
    let cpu = detect_cpu();
    let memory = detect_memory();
    let gpu = detect_gpu();
    let os_arch = std::env::consts::ARCH.to_string();
    let is_apple_silicon = cfg!(target_os = "macos") && os_arch == "aarch64";

    let usable_mem_gb = (memory.total_gb as f64 * 0.7).max(1.0);

    let has_dedicated = gpu.vram_gb > 0
        || gpu.model.to_lowercase().contains("rtx")
        || gpu.model.to_lowercase().contains("gtx")
        || gpu.model.to_lowercase().contains("radeon rx")
        || gpu.model.to_lowercase().contains("tesla")
        || gpu.model.to_lowercase().contains("quadro")
        || gpu.model.to_lowercase().contains("arc a");

    HardwareInfo {
        cpu_brand: cpu.brand,
        cpu_cores: cpu.cores,
        cpu_physical_cores: cpu.physical_cores,
        cpu_ghz: cpu.ghz,
        memory_total_gb: memory.total_gb,
        memory_free_gb: memory.free_gb,
        gpu_model: gpu.model,
        gpu_vram_gb: if has_dedicated { gpu.vram_gb } else { 0 },
        gpu_vendor: gpu.vendor,
        os_arch,
        is_apple_silicon,
        has_dedicated_gpu: has_dedicated,
        usable_mem_gb,
    }
}

struct CpuInfo {
    brand: String,
    cores: u32,
    physical_cores: u32,
    ghz: f64,
}

fn detect_cpu() -> CpuInfo {
    let brand = fs::read_to_string("/proc/cpuinfo")
        .ok()
        .and_then(|s| {
            s.lines()
                .find(|l| l.starts_with("model name"))
                .and_then(|l| l.split(':').nth(1))
                .map(|s| s.trim().to_string())
        })
        .unwrap_or_else(|| "Unknown".to_string());

    let cores = std::thread::available_parallelism()
        .map(|n| n.get() as u32)
        .unwrap_or(1);

    let physical_cores = fs::read_to_string("/proc/cpuinfo")
        .ok()
        .map(|s| {
            s.lines()
                .filter(|l| l.starts_with("cpu cores"))
                .filter_map(|l| l.split(':').nth(1))
                .filter_map(|s| s.trim().parse::<u32>().ok())
                .next()
                .unwrap_or(cores)
        })
        .unwrap_or(cores);

    let ghz = fs::read_to_string("/proc/cpuinfo")
        .ok()
        .and_then(|s| {
            s.lines()
                .find(|l| l.starts_with("cpu MHz"))
                .and_then(|l| l.split(':').nth(1))
                .and_then(|s| s.trim().parse::<f64>().ok())
                .map(|mhz| mhz / 1000.0)
        })
        .unwrap_or(2.0);

    CpuInfo { brand, cores, physical_cores, ghz }
}

struct MemInfo {
    total_gb: u32,
    free_gb: u32,
}

fn detect_memory() -> MemInfo {
    let total_kb = fs::read_to_string("/proc/meminfo")
        .ok()
        .and_then(|s| {
            s.lines()
                .find(|l| l.starts_with("MemTotal"))
                .and_then(|l| l.split_whitespace().nth(1))
                .and_then(|s| s.parse::<u64>().ok())
        })
        .unwrap_or(8_000_000);

    let free_kb = fs::read_to_string("/proc/meminfo")
        .ok()
        .and_then(|s| {
            s.lines()
                .find(|l| l.starts_with("MemAvailable"))
                .and_then(|l| l.split_whitespace().nth(1))
                .and_then(|s| s.parse::<u64>().ok())
        })
        .unwrap_or(total_kb / 2);

    MemInfo {
        total_gb: (total_kb / 1024 / 1024) as u32,
        free_gb: (free_kb / 1024 / 1024) as u32,
    }
}

struct GpuInfo {
    model: String,
    vendor: String,
    vram_gb: u32,
}

fn detect_gpu() -> GpuInfo {
    let (model, vendor, vram_mb) = detect_gpu_nvidia()
        .or_else(detect_gpu_amd)
        .or_else(detect_gpu_intel)
        .or_else(detect_gpu_lspci)
        .unwrap_or_else(|| ("Unknown".into(), "Unknown".into(), 0));

    GpuInfo {
        vram_gb: if vram_mb >= 1024 { vram_mb / 1024 } else { 0 },
        vendor,
        model,
    }
}

fn detect_gpu_nvidia() -> Option<(String, String, u32)> {
    let info = fs::read_to_string("/proc/driver/nvidia/gpus/0/information").ok()?;
    let model = info.lines()
        .find(|l| l.starts_with("Model"))?
        .split(':').nth(1)?
        .trim().to_string();
    let vram_mb = info.lines()
        .find(|l| l.starts_with("Total"))
        .and_then(|l| {
            l.split_whitespace()
                .find(|w| w.parse::<u32>().is_ok())
                .and_then(|w| w.parse::<u32>().ok())
        })
        .unwrap_or(0);
    Some((model, "NVIDIA".into(), vram_mb))
}

fn detect_gpu_amd() -> Option<(String, String, u32)> {
    let path = "/sys/class/drm/";
    let entries = fs::read_dir(path).ok()?;
    for entry in entries.flatten() {
        let name = entry.file_name();
        let name_str = name.to_string_lossy();
        if !name_str.contains("card") || name_str.contains("-") {
            continue;
        }
        let dev_path = entry.path().join("device");

        let vendor = fs::read_to_string(dev_path.join("vendor")).ok()?;
        if vendor.trim() != "0x1002" {
            continue;
        }

        let model = fs::read_to_string(dev_path.join("model_name"))
            .or_else(|_| fs::read_to_string(dev_path.join("product_name")))
            .map(|s| s.trim().to_string())
            .unwrap_or_else(|_| "AMD Radeon".into());

        let vram_mb = fs::read_to_string(dev_path.join("mem_info_vram_total"))
            .ok()
            .and_then(|s| {
                let parts: Vec<&str> = s.split_whitespace().collect();
                if parts.len() >= 2 && parts[1] == "kB" {
                    parts[0].parse::<u64>().ok().map(|kb| (kb / 1024) as u32)
                } else {
                    parts.first().and_then(|v| v.parse::<u32>().ok())
                }
            })
            .unwrap_or(0);

        return Some((model, "AMD".into(), vram_mb));
    }
    None
}

fn detect_gpu_intel() -> Option<(String, String, u32)> {
    let path = "/sys/class/drm/";
    let entries = fs::read_dir(path).ok()?;
    for entry in entries.flatten() {
        let name = entry.file_name();
        let name_str = name.to_string_lossy();
        if !name_str.contains("card") || name_str.contains("-") {
            continue;
        }
        let dev_path = entry.path().join("device");

        let vendor = fs::read_to_string(dev_path.join("vendor")).ok()?;
        if vendor.trim() != "0x8086" {
            continue;
        }

        let model = fs::read_to_string(dev_path.join("model_name"))
            .or_else(|_| fs::read_to_string(dev_path.join("product_name")))
            .map(|s| s.trim().to_string())
            .unwrap_or_else(|_| "Intel GPU".into());

        return Some((model, "Intel".into(), 0));
    }
    None
}

fn detect_gpu_lspci() -> Option<(String, String, u32)> {
    let output = std::process::Command::new("lspci")
        .args(["-nn"])
        .output()
        .ok()?;
    let stdout = String::from_utf8_lossy(&output.stdout);
    for line in stdout.lines() {
        let lower = line.to_lowercase();
        if !lower.contains("vga") && !lower.contains("3d") && !lower.contains("display") {
            continue;
        }
        let name = line
            .split(':')
            .nth(2)
            .unwrap_or(line)
            .trim()
            .replace("(rev ", "")
            .replace(")", "")
            .trim()
            .to_string();

        let vendor = if lower.contains("nvidia") {
            "NVIDIA"
        } else if lower.contains("amd") || lower.contains("ati") || lower.contains("radeon") {
            "AMD"
        } else if lower.contains("intel") {
            "Intel"
        } else {
            "Unknown"
        };

        if !name.is_empty() && name != "Unknown" {
            return Some((name, vendor.into(), 0));
        }
    }
    None
}
