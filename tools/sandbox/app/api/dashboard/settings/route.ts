import { NextResponse } from "next/server";
import { getDashboardSettings } from "@/shared/lib/dashboard/topbar";

export async function GET() {
  try {
    const settings = getDashboardSettings();
    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load settings.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
