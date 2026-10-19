#!/usr/bin/env python3
"""Sync Kaide iOS app & CLI to iPhone via MCP connection."""
import argparse
import base64
import http.client
import io
import json
import os
from pathlib import Path
import sys
import tarfile
import time

DEFAULT_HOST = os.environ.get("IPHONE_HOST", "192.168.0.37")
DEFAULT_PORT = int(os.environ.get("IPHONE_PORT", "8090"))
PROTOCOL = "2025-11-25"


class DeviceClient:
    def __init__(self, host=DEFAULT_HOST, port=DEFAULT_PORT, timeout=600):
        self.host = host
        self.port = port
        self.timeout = timeout
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "MCP-Protocol-Version": PROTOCOL
        }
        self.sid = None
        self.rid = 0
        self._init_session()

    def _post(self, body):
        for attempt in range(3):
            try:
                conn = http.client.HTTPConnection(self.host, self.port, timeout=self.timeout)
                conn.request("POST", "/mcp", json.dumps(body), self.headers)
                resp = conn.getresponse()
                sid = resp.getheader("Mcp-Session-Id")
                if sid:
                    self.sid = sid
                    self.headers["Mcp-Session-Id"] = sid
                raw = resp.read().decode("utf-8", "replace")
                conn.close()
                if not raw or not raw.strip():
                    return {}
                return json.loads(raw)
            except Exception as e:
                time.sleep(1)
                if attempt == 2:
                    raise RuntimeError(f"Erro conectando ao iPhone {self.host}:{self.port} -> {e}")

    def _init_session(self):
        self.rid += 1
        self._post({
            "jsonrpc": "2.0",
            "id": self.rid,
            "method": "initialize",
            "params": {
                "protocolVersion": PROTOCOL,
                "capabilities": {},
                "clientInfo": {"name": "kaide-sync", "version": "1.0"}
            }
        })
        self._post({"jsonrpc": "2.0", "method": "notifications/initialized"})

    def call_tool(self, name, arguments=None):
        self.rid += 1
        res = self._post({
            "jsonrpc": "2.0",
            "id": self.rid,
            "method": "tools/call",
            "params": {
                "name": name,
                "arguments": arguments or {}
            }
        })
        result = res.get("result", {})
        if name != "wake_and_home":
            raw_str = json.dumps(result)
            if "device_locked_or_screen_off" in raw_str:
                self.call_tool("wake_and_home")
                time.sleep(1.2)
                self.rid += 1
                res = self._post({
                    "jsonrpc": "2.0",
                    "id": self.rid,
                    "method": "tools/call",
                    "params": {
                        "name": name,
                        "arguments": arguments or {}
                    }
                })
                result = res.get("result", {})
        return result

    def run_command(self, command, timeout=600):
        res = self.call_tool("run_command", {"command": command, "timeout": timeout})
        content = res.get("content", [])
        parts = [c.get("text", "") for c in content if c.get("type") == "text"]
        out = "\n".join(parts)
        if "device_locked_or_screen_off" in out:
            self.call_tool("wake_and_home")
            time.sleep(1.2)
            res = self.call_tool("run_command", {"command": command, "timeout": timeout})
            content = res.get("content", [])
            parts = [c.get("text", "") for c in content if c.get("type") == "text"]
            out = "\n".join(parts)
        return out


def main():
    parser = argparse.ArgumentParser(description="Sync Kaide to iPhone")
    parser.add_argument("--build", action="store_true", help="Build CLI and App on iPhone after sync")
    parser.add_argument("--install", action="store_true", help="Install Kaide.app via TrollStore after build")
    args = parser.parse_args()

    app_dir = Path(__file__).resolve().parent
    print(f"[*] Empacotando Kaide de {app_dir}...")
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode="w:gz") as tar:
        for root_dir, _, files in os.walk(app_dir):
            rel_dir = Path(root_dir).relative_to(app_dir)
            if "Artifacts" in rel_dir.parts or ".git" in rel_dir.parts or "__pycache__" in rel_dir.parts:
                continue
            for f in files:
                if f.endswith(".pyc") or f == ".DS_Store":
                    continue
                p = Path(root_dir) / f
                arcname = (rel_dir / f).as_posix()
                tar.add(str(p), arcname=arcname)

    raw_data = buffer.getvalue()
    b64 = base64.b64encode(raw_data).decode("ascii")
    print(f"[+] Arquivo compactado: {len(raw_data)} bytes ({len(b64)} chars base64)")

    client = DeviceClient()

    chunk_size = 32768
    client.run_command("> /var/jb/tmp/kaide_sync.b64")
    for i in range(0, len(b64), chunk_size):
        chunk = b64[i:i + chunk_size]
        client.run_command(f"printf '%s' '{chunk}' >> /var/jb/tmp/kaide_sync.b64")

    target_dir = "/var/jb/tmp/kaide"
    extract_cmd = (
        f"mkdir -p {target_dir} && "
        "base64 -d /var/jb/tmp/kaide_sync.b64 > /var/jb/tmp/kaide_sync.tar.gz && "
        f"cd {target_dir} && tar -xzf /var/jb/tmp/kaide_sync.tar.gz && "
        "rm -f /var/jb/tmp/kaide_sync.b64 /var/jb/tmp/kaide_sync.tar.gz && "
        f"ls -la {target_dir}"
    )
    print(f"[*] Enviando e descompactando no iPhone ({target_dir})...")
    res = client.run_command(extract_cmd)
    print("[+] Resultado no iPhone:")
    print(res)

    if args.build or args.install:
        install_flag = "--install" if args.install else ""
        build_cmd = f"cd {target_dir} && python3 build_kaide.py --cli --app {install_flag}"
        print(f"[*] Executando build no iPhone: {build_cmd}")
        build_res = client.run_command(build_cmd, timeout=300)
        print(build_res)


if __name__ == "__main__":
    main()
