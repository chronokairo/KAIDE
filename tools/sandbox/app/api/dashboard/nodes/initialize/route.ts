import { NextResponse } from "next/server";
import { initializeAllNodeSeeds, listNodeSeeds } from "@/shared/lib/dashboard/store";

export async function POST() {
  try {
    const initialized = initializeAllNodeSeeds();
    return NextResponse.json(
      {
        initialized,
        totalNodes: listNodeSeeds().length,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to initialize nodes.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
