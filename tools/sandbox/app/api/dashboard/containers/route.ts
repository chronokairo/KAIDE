import { NextResponse } from "next/server";
import { getContainerDashboardData } from "@/shared/lib/dashboard/data";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 5);
    const stateParam = url.searchParams.get("state");
    const state = stateParam === "active" || stateParam === "warning" || stateParam === "error"
      ? stateParam
      : "all";

    const data = getContainerDashboardData(Date.now(), {
      page,
      pageSize,
      state,
    });
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load container dashboard.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
