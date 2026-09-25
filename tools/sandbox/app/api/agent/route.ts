import { NextResponse } from "next/server";
import { AgentMode, AgentRequest } from "@/entities/agent/model/types";
import { runAgent } from "@/processes/agent-runtime/model/run-agent";
import { checkRateLimit } from "@/shared/lib/api/rate-limit";

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function getCallerKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: Request) {
  const callerKey = getCallerKey(req);
  const rl = checkRateLimit(callerKey, RATE_LIMIT, RATE_WINDOW_MS);

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later.", retryAfterSecs: rl.retryAfterSecs },
      {
        status: 429,
        headers: {
          "Retry-After": String(rl.retryAfterSecs),
          "X-RateLimit-Limit": String(RATE_LIMIT),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  try {
    const body = (await req.json()) as AgentRequest;

    if (!body.prompt || typeof body.prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required." },
        { status: 400 },
      );
    }

    const mode: AgentMode = body.mode ?? "debian";
    const dryRun = body.dryRun ?? false;

    const result = await runAgent({
      prompt: body.prompt,
      mode,
      dryRun,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "X-RateLimit-Limit": String(RATE_LIMIT),
        "X-RateLimit-Remaining": String(rl.remaining),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process agent request.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
