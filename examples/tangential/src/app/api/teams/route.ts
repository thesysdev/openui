import { getStore } from "@/data/store";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const store = getStore();
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const nodes = key ? store.teams.filter((item) => item.key === key) : store.teams;

  return NextResponse.json({
    nodes,
    pageInfo: {
      hasNextPage: false,
      endCursor: nodes.length ? `cursor_${nodes.length - 1}` : null,
    },
  });
}
