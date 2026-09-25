import { NextResponse } from "next/server";
import { searchDashboardResources } from "@/shared/lib/dashboard/topbar";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("q") ?? "";
    const result = await searchDashboardResources(query);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to search dashboard resources.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
