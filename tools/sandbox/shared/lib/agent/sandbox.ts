import { spawn } from "node:child_process";
import { AgentMode, CommandResult } from "@/entities/agent/model/types";

const MODE_IMAGE: Record<AgentMode, string> = {
  debian: "debian:12-slim",
  ubuntu: "ubuntu:24.04",
  nixos: "nixos/nix:latest",
};

function runProcess(command: string, args: string[], timeoutMs: number): Promise<CommandResult> {
  const startedAt = Date.now();

  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: process.env,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });

    proc.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    const timer = setTimeout(() => {
      proc.kill("SIGKILL");
    }, timeoutMs);

    proc.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        command: `${command} ${args.join(" ")}`,
        code: code ?? 1,
        stdout,
        stderr,
        durationMs: Date.now() - startedAt,
      });
    });
  });
}

export async function executeInSandbox(
  mode: AgentMode,
  command: string,
  timeoutMs = 30_000,
): Promise<CommandResult> {
  const useDockerSandbox = process.env.USE_DOCKER_SANDBOX !== "false";

  if (useDockerSandbox) {
    const image = MODE_IMAGE[mode];
    const memLimit = process.env.SANDBOX_MEMORY_LIMIT ?? "512m";
    const cpuLimit = process.env.SANDBOX_CPU_LIMIT ?? "1";
    const networkMode = process.env.SANDBOX_NETWORK_ISOLATED === "true" ? "none" : "bridge";

    return runProcess(
      "docker",
      [
        "run",
        "--rm",
        `--memory=${memLimit}`,
        `--cpus=${cpuLimit}`,
        `--network=${networkMode}`,
        image,
        "bash",
        "-lc",
        command,
      ],
      timeoutMs,
    );
  }

  return runProcess("bash", ["-lc", command], timeoutMs);
}
