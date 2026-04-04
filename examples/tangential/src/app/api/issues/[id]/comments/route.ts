import { getStore } from "@/data/store";
import type { Comment } from "@/data/types";
import { badRequest, created, notFound } from "@/lib/api-helpers";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const store = getStore();
  const issue = store.issues.find((item) => item.id === id);
  if (!issue) return notFound("Issue");
  const nodes = store.comments.filter((item) => item.issueId === id);
  return NextResponse.json({
    nodes,
    pageInfo: {
      hasNextPage: false,
      endCursor: nodes.length ? `cursor_${nodes.length - 1}` : null,
    },
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const store = getStore();
  const issue = store.issues.find((item) => item.id === id);
  if (!issue) return notFound("Issue");

  const body = await request.json();
  if (!body?.body) {
    return badRequest("body is required");
  }

  const comment: Comment = {
    id: crypto.randomUUID(),
    body: body.body,
    issueId: id,
    userId: body.userId ?? store.users[0]?.id ?? "system",
    parentId: body.parentId ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.comments.unshift(comment);
  return created({ success: true, comment });
}
