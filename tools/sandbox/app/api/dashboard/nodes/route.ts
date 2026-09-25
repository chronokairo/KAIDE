import { NextResponse } from "next/server";
import { createNodeSeed } from "@/shared/lib/dashboard/store";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { name?: string };
    const node = createNodeSeed(body.name);
    return NextResponse.json({ node }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create node.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
