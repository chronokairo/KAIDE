#!/usr/bin/env python3
"""Build, sign and package Kaide (Agent Coding App & CLI) natively for iOS 15."""
import argparse
import os
from pathlib import Path
import shutil
import subprocess
import sys
import zipfile

SCRIPT_DIR = Path(__file__).resolve().parent
if (SCRIPT_DIR / "Core").is_dir():
    KAIDE_DIR = SCRIPT_DIR
    ROOT = SCRIPT_DIR.parents[1] if len(SCRIPT_DIR.parents) > 1 else SCRIPT_DIR
elif (SCRIPT_DIR.parent / "apps" / "ios" / "Core").is_dir():
    KAIDE_DIR = SCRIPT_DIR.parent / "apps" / "ios"
    ROOT = SCRIPT_DIR.parent
elif (SCRIPT_DIR.parent / "Kaide" / "Core").is_dir():
    KAIDE_DIR = SCRIPT_DIR.parent / "Kaide"
    ROOT = SCRIPT_DIR.parent
else:
    KAIDE_DIR = SCRIPT_DIR
    ROOT = SCRIPT_DIR

SDK_PATH = "/var/jb/usr/share/SDKs/iPhoneOS.sdk"
TARGET = "arm64-apple-ios15.0"


def find_tool(name):
    path = shutil.which(name)
    if path:
        return path
    for candidate in [f"/var/jb/usr/bin/{name}", f"/var/jb/bin/{name}", f"/usr/bin/{name}"]:
        if Path(candidate).is_file():
            return candidate
    return name


def build_cli(output_dir=None, install=False):
    output_dir = Path(output_dir) if output_dir else KAIDE_DIR / "Artifacts" / "cli"
    output_dir.mkdir(parents=True, exist_ok=True)
    binary_out = output_dir / "kaide"

    sources = sorted(list((KAIDE_DIR / "Core").glob("*.swift")) + list((KAIDE_DIR / "CLI").glob("*.swift")))
    print(f"[*] Compilando CLI Kaide ({len(sources)} fontes Swift)...", flush=True)

    swiftc = find_tool("swiftc")
    ldid = find_tool("ldid")

    cmd = [
        swiftc,
        "-sdk", SDK_PATH if Path(SDK_PATH).is_dir() else "/",
        "-target", TARGET,
        "-swift-version", "5",
        "-parse-as-library",
        "-O",
        *map(str, sources),
        "-o", str(binary_out)
    ]

    print(f"[*] Executando swiftc...", flush=True)
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        print(f"[-] Erro na compilação:\n{proc.stderr}\n{proc.stdout}")
        sys.exit(proc.returncode)

    print(f"[+] Binário gerado: {binary_out}", flush=True)
    ent_cli = KAIDE_DIR / "entitlements_cli.plist"
    sign_arg = f"-S{ent_cli}" if ent_cli.is_file() else "-S"
    print(f"[*] Assinando binário com ldid {sign_arg}...", flush=True)
    sign_proc = subprocess.run([ldid, sign_arg, str(binary_out)], capture_output=True, text=True)
    if sign_proc.returncode == 0:
        print("[+] Assinatura concluída.", flush=True)

    if install:
        dest = Path("/var/jb/usr/bin/kaide")
        if dest.parent.is_dir():
            print(f"[*] Instalando CLI em {dest}...", flush=True)
            sudo_pass = os.environ.get("SUDO_PASS", "8242")
            is_root = hasattr(os, "geteuid") and os.geteuid() == 0
            cmd = ["cp", str(binary_out), str(dest)]
            run_cmd = cmd if is_root else ["sudo", "-S"] + cmd
            subprocess.run(run_cmd, input=f"{sudo_pass}\n" if not is_root else None, text=True, check=True)
            chmod_cmd = ["chmod", "755", str(dest)]
            run_chmod = chmod_cmd if is_root else ["sudo", "-S"] + chmod_cmd
            subprocess.run(run_chmod, input=f"{sudo_pass}\n" if not is_root else None, text=True, check=True)
            print("[+] Kaide CLI instalado com sucesso! Pode ser executado via NewTerm (`kaide`).", flush=True)
        else:
            fallback = Path("/usr/local/bin/kaide")
            if fallback.parent.is_dir():
                shutil.copy2(binary_out, fallback)
                fallback.chmod(0o755)
                print(f"[+] Kaide CLI instalado em {fallback}.", flush=True)

    return binary_out


def build_app(output_dir=None, install=False):
    output_dir = Path(output_dir) if output_dir else KAIDE_DIR / "Artifacts" / "app"
    output_dir.mkdir(parents=True, exist_ok=True)

    app_dir = output_dir / "Kaide.app"
    if app_dir.exists():
        shutil.rmtree(app_dir)
    app_dir.mkdir(parents=True, exist_ok=True)

    sources = sorted(
        list((KAIDE_DIR / "Core").glob("*.swift")) +
        list((KAIDE_DIR / "UI").glob("*.swift")) +
        list((KAIDE_DIR / "App").glob("*.swift"))
    )

    print(f"[*] Compilando Kaide.app ({len(sources)} fontes Swift)...", flush=True)

    swiftc = find_tool("swiftc")
    ldid = find_tool("ldid")
    binary_out = app_dir / "Kaide"

    cmd = [
        swiftc,
        "-sdk", SDK_PATH if Path(SDK_PATH).is_dir() else "/",
        "-target", TARGET,
        "-swift-version", "5",
        "-parse-as-library",
        "-O",
        *map(str, sources),
        "-o", str(binary_out)
    ]

    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        print(f"[-] Erro na compilação do app:\n{proc.stderr}\n{proc.stdout}")
        sys.exit(proc.returncode)

    print(f"[+] Executável compilado: {binary_out}", flush=True)

    info_plist = KAIDE_DIR / "App" / "Info.plist"
    if info_plist.exists():
        shutil.copy2(info_plist, app_dir / "Info.plist")
    for img in (KAIDE_DIR / "App").glob("*.png"):
        shutil.copy2(img, app_dir / img.name)

    entitlements = KAIDE_DIR / "App" / "entitlements.plist"
    if entitlements.exists():
        print(f"[*] Assinando bundle .app com ldid...", flush=True)
        subprocess.run([ldid, f"-S{entitlements}", str(binary_out)], check=True)

    # Empacota em IPA
    ipa_path = output_dir / "Kaide.ipa"
    print(f"[*] Empacotando {ipa_path.name}...", flush=True)
    with zipfile.ZipFile(ipa_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for root_p, _, files in os.walk(app_dir):
            for file in files:
                full = Path(root_p) / file
                rel = full.relative_to(output_dir)
                zf.write(full, arcname=f"Payload/{rel}")

    print(f"[+] IPA gerado com sucesso: {ipa_path} ({ipa_path.stat().st_size} bytes)", flush=True)

    if install:
        helper = None
        for candidate in ["/var/jb/usr/bin/trollstorehelper", "/Applications/TrollStore.app/trollstorehelper", "/var/jb/Applications/TrollStore.app/trollstorehelper"]:
            if Path(candidate).is_file():
                helper = candidate
                break
        if not helper:
            for b in [Path("/var/containers/Bundle/Application"), Path("/private/var/containers/Bundle/Application")]:
                if b.is_dir():
                    for h in b.glob("*/TrollStore.app/trollstorehelper"):
                        if h.is_file():
                            helper = str(h)
                            break
                    if not helper:
                        for h in b.glob("*/Tips.app/trollstorehelper"):
                            if h.is_file():
                                helper = str(h)
                                break
        if not helper:
            helper = shutil.which("trollstorehelper")

        if helper:
            print(f"[*] Instalando Kaide via TrollStore ({helper})...", flush=True)
            staged = Path("/var/mobile") / "Kaide.ipa"
            try:
                shutil.copy2(ipa_path, staged)
                staged.chmod(0o777)
                target_install = staged
            except Exception:
                target_install = ipa_path

            is_root = hasattr(os, "geteuid") and os.geteuid() == 0
            sudo_pass = os.environ.get("SUDO_PASS", "8242")
            install_cmd = [helper, "install", str(target_install)]
            run_cmd = install_cmd if is_root else ["sudo", "-S"] + install_cmd
            res = subprocess.run(run_cmd, input=f"{sudo_pass}\n" if not is_root else None, text=True, capture_output=True)
            if res.returncode == 0:
                print("[+] Kaide instalado com sucesso no TrollStore!", flush=True)
            else:
                print(f"[-] Falha na instalação TrollStore: {res.stderr}\n{res.stdout}")
        else:
            print("[-] trollstorehelper não encontrado para instalação automática.")

    return ipa_path


def main():
    parser = argparse.ArgumentParser(description="Builder nativo do Kaide (App e CLI)")
    parser.add_argument("--cli", action="store_true", help="Compila o binário CLI executável no NewTerm")
    parser.add_argument("--app", action="store_true", help="Compila o aplicativo SwiftUI (.app / .ipa)")
    parser.add_argument("--install", action="store_true", help="Instala no TrollStore (app) ou /var/jb/usr/bin (cli)")
    parser.add_argument("--output", help="Diretório de saída personalizado")
    args = parser.parse_args()

    if not args.cli and not args.app:
        args.cli = True
        args.app = True

    if args.cli:
        build_cli(output_dir=args.output, install=args.install)
    if args.app:
        build_app(output_dir=args.output, install=args.install)


if __name__ == "__main__":
    main()
