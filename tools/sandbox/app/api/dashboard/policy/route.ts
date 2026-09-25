import { NextResponse } from "next/server";
import { getPolicyDashboardData } from "@/shared/lib/dashboard/data";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 6);
    const toneParam = url.searchParams.get("tone");
    const tone = toneParam === "safe" || toneParam === "blocked" ? toneParam : "all";

    const data = await getPolicyDashboardData({
      page,
      pageSize,
      tone,
    });
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load policy dashboard.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
