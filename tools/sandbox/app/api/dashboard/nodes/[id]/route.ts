import { NextResponse } from "next/server";
import { getContainerNodeDetails } from "@/shared/lib/dashboard/data";
import { setNodeEnabled } from "@/shared/lib/dashboard/store";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const details = getContainerNodeDetails(id);

    if (!details) {
      return NextResponse.json({ error: "Node not found." }, { status: 404 });
    }

    return NextResponse.json(details, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to inspect node.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = (await request.json()) as { enabled?: boolean };

    if (typeof body.enabled !== "boolean") {
      return NextResponse.json({ error: "enabled boolean is required." }, { status: 400 });
    }

    const updated = setNodeEnabled(id, body.enabled);
    if (!updated) {
      return NextResponse.json({ error: "Node not found." }, { status: 404 });
    }

    return NextResponse.json({ node: updated }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to update node.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
