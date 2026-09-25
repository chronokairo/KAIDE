import { NextResponse } from "next/server";
import { getDashboardNotifications } from "@/shared/lib/dashboard/topbar";

export async function GET() {
  try {
    const items = await getDashboardNotifications();
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load notifications.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
