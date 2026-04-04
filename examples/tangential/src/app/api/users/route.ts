import { getStore } from "@/data/store";
import { NextResponse } from "next/server";

export async function GET() {
  const store = getStore();
  const nodes = store.users;
  return NextResponse.json({
    nodes,
    pageInfo: {
      hasNextPage: false,
      endCursor: nodes.length ? `cursor_${nodes.length - 1}` : null,
    },
  });
}
