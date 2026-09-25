#!/usr/bin/env bun
import { Harness, type HarnessEvent } from "./harness.js";
import { registerBuiltinTools } from "./tools/builtin.js";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";

const BASE_URL = process.env.CLAMP_BASE_URL ?? "http://localhost:11434/v1";
const MODEL = process.env.CLAMP_MODEL ?? "qwen2.5-coder:14b";
const API_KEY = process.env.CLAMP_API_KEY;

function cfg(): { baseURL: string; model: string; apiKey?: string } {
  return { baseURL: BASE_URL, model: MODEL, apiKey: API_KEY };
}

function formatEvent(event: HarnessEvent): string {
  switch (event.type) {
    case "plan":
      return `plan: ${event.prompt}\n  ${event.steps.map((s) => `- ${s}`).join("\n  ")}`;
    case "tool_call":
      return `\x1b[36mtool: ${event.tool}\x1b[0m ${safeInline(event.args)}`;
    case "tool_result":
      if (event.ok) {
        return `\x1b[32m  ok (${event.tool})\x1b[0m ${safeInline(event.result)}`;
      }
      return `\x1b[31m  error (${event.tool}): ${event.error ?? "unknown"}\x1b[0m`;
    case "text":
      return event.text;
    default:
      return "";
  }
}

function safeInline(value: unknown): string {
  try {
    const str = JSON.stringify(value);
    return str && str.length <= 400 ? str : `${str?.slice(0, 400)}…`;
  } catch {
    return String(value);
  }
}

function buildHarness(cwd: string): Harness {
  const harness = new Harness(cfg(), { cwd }, (event) => {
    const line = formatEvent(event);
    if (line) {
      console.log(line);
    }
  });
  harness.registerTools(registerBuiltinTools);
  return harness;
}

async function runOnce(prompt: string, cwd: string): Promise<void> {
  const harness = buildHarness(cwd);
  const answer = await harness.run(prompt);
  console.log(`\n\x1b[1manswer:\x1b[0m\n${answer}`);
}

async function repl(cwd: string): Promise<void> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });
  console.log(`Clamp — local LLM harness. model=${MODEL} base=${BASE_URL} cwd=${cwd}`);
  console.log(`Type a task, or "exit" to quit.`);
  for (;;) {
    const line = await rl.question("\n> ");
    const input = line.trim();
    if (!input) {
      continue;
    }
    if (input === "exit" || input === "quit") {
      break;
    }
    const harness = buildHarness(cwd);
    try {
      const answer = await harness.run(input);
      console.log(`\n\x1b[1manswer:\x1b[0m\n${answer}`);
    } catch (error) {
      console.error(`\x1b[31merror:\x1b[0m ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  rl.close();
}

function parseArgs(argv: string[]): { prompt?: string; cwd: string } {
  let prompt: string | undefined;
  let cwd = process.cwd();
  const args = [...argv];
  while (args.length > 0) {
    const arg = args.shift()!;
    if (arg === "--model") {
      args.shift();
    } else if (arg === "--base-url") {
      args.shift();
    } else if (arg === "--cwd") {
      cwd = resolve(args.shift() ?? ".");
    } else if (arg === "--help" || arg === "-h") {
      console.log("Usage: clamp [prompt] [--cwd <dir>] [--model <m>] [--base-url <u>]");
      process.exit(0);
    } else if (!arg.startsWith("-")) {
      prompt = arg;
    }
  }
  return { prompt, cwd };
}

async function main(): Promise<void> {
  const { prompt, cwd } = parseArgs(process.argv.slice(2));
  if (prompt) {
    await runOnce(prompt, cwd);
  } else {
    await repl(cwd);
  }
  process.exit(0);
}

void main();
