import { getStore } from "@/data/store";
import type { IssueLabel } from "@/data/types";
import { badRequest, created } from "@/lib/api-helpers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const store = getStore();
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");
  const nodes = teamId ? store.labels.filter((item) => item.teamId === teamId) : store.labels;
  return NextResponse.json({
    nodes,
    pageInfo: {
      hasNextPage: false,
      endCursor: nodes.length ? `cursor_${nodes.length - 1}` : null,
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const store = getStore();
  if (!body?.name) return badRequest("name is required");

  const label: IssueLabel = {
    id: crypto.randomUUID(),
    name: body.name,
    color: body.color ?? "#5e6ad2",
    description: body.description ?? "",
    isGroup: Boolean(body.isGroup),
    teamId: body.teamId,
    parentId: body.parentId ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.labels.unshift(label);
  return created({ success: true, label });
}
