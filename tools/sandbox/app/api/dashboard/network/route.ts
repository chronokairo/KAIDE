import { NextResponse } from "next/server";
import { getNetworkTopologyData } from "@/shared/lib/dashboard/data";

export async function GET() {
  try {
    const data = getNetworkTopologyData();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load network topology.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
