import { getStore } from "@/data/store";
import type { Project } from "@/data/types";
import { badRequest, created } from "@/lib/api-helpers";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const store = getStore();
  const nodes = store.projects;
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

  if (!body?.name) {
    return badRequest("name is required");
  }

  const project: Project = {
    id: crypto.randomUUID(),
    name: body.name,
    description: body.description ?? "",
    state: body.state ?? "planned",
    progress: body.progress ?? 0,
    targetDate: body.targetDate,
    startDate: body.startDate,
    color: body.color ?? "#5e6ad2",
    icon: body.icon ?? "briefcase",
    leadId: body.leadId,
    memberIds: Array.isArray(body.memberIds) ? body.memberIds : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.projects.unshift(project);
  return created({ success: true, project });
}
