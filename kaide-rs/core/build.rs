fn main() {
    #[cfg(target_os = "windows")]
    {
        if let Some(home) = std::env::var_os("USERPROFILE").or_else(|| std::env::var_os("HOME")) {
            let lib_dir = std::path::PathBuf::from(home).join(".chronokairo").join("lib");
            if lib_dir.join("OpenCL.lib").is_file() {
                println!("cargo:rustc-link-search=native={}", lib_dir.display());
            }
        }
    }
}
