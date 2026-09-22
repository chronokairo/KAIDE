{ pkgs ? import <nixpkgs> { } }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    cargo
    rustc
    openssl
    pkg-config
  ];

  shellHook = ''
    echo "Rust dev environment loaded"
    echo "cargo $(cargo --version)"
    echo "rustc $(rustc --version)"
    # Point linker to system OpenCL (compile-time only, not runtime LD path)
    export LIBRARY_PATH="/usr/lib/x86_64-linux-gnu''${LIBRARY_PATH:+:$LIBRARY_PATH}"
    export CPATH="/usr/include''${CPATH:+:$CPATH}"
    export OCL_ICD_VENDORS=/etc/OpenCL/vendors
  '';
}
