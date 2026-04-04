import { getStore } from "@/data/store";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const store = getStore();
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");
  const nodes = teamId
    ? store.workflowStates.filter((item) => item.teamId === teamId)
    : store.workflowStates;
  return NextResponse.json({
    nodes,
    pageInfo: {
      hasNextPage: false,
      endCursor: nodes.length ? `cursor_${nodes.length - 1}` : null,
    },
  });
}
