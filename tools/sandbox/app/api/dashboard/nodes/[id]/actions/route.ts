import { NextResponse } from "next/server";
import { getContainerNodeDetails } from "@/shared/lib/dashboard/data";

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

    const actions = details.node.active
      ? [
          { id: "inspect", label: "Inspect Node", type: "read", enabled: true },
          { id: "set-offline", label: "Set Node Offline", type: "write", enabled: true },
          { id: "refresh-telemetry", label: "Refresh Telemetry", type: "read", enabled: true },
        ]
      : [
          { id: "set-online", label: "Set Node Online", type: "write", enabled: true },
          { id: "inspect", label: "Inspect Node", type: "read", enabled: false },
        ];

    return NextResponse.json({
      nodeId: id,
      actions,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load node actions.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
