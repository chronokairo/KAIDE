import { NextResponse } from "next/server";
import { setPolicyRuleEnabled } from "@/shared/lib/dashboard/store";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { enabled?: boolean };

    if (typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "enabled boolean is required." }, { status: 400 });
    }

    const updated = setPolicyRuleEnabled(id, body.enabled);
    if (!updated) {
      return NextResponse.json({ error: "Rule not found." }, { status: 404 });
    }

    return NextResponse.json({ rule: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to update policy rule.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
