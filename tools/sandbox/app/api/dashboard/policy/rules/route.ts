import { NextResponse } from "next/server";
import { createPolicyRule, listPolicyRules } from "@/shared/lib/dashboard/store";

export async function GET() {
  try {
    const rules = listPolicyRules();
    return NextResponse.json({ rules }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load policy rules.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { title?: string };
    const rule = createPolicyRule(body.title);
    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to create policy rule.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
