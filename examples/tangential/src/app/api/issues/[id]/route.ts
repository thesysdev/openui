import { getStore } from "@/data/store";
import type { Issue } from "@/data/types";
import { notFound } from "@/lib/api-helpers";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const store = getStore();
  const issue = store.issues.find((item) => item.id === id);
  if (!issue) return notFound("Issue");
  return NextResponse.json(issue);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const store = getStore();
  const index = store.issues.findIndex((item) => item.id === id);
  if (index < 0) return notFound("Issue");

  const patch = (await request.json()) as Partial<Issue>;
  const issue = store.issues[index];

  const next: Issue = {
    ...issue,
    ...patch,
    id: issue.id,
    number: issue.number,
    identifier: issue.identifier,
    updatedAt: new Date().toISOString(),
  };

  store.issues[index] = next;
  return NextResponse.json({ success: true, issue: next });
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const store = getStore();
  const index = store.issues.findIndex((item) => item.id === id);
  if (index < 0) return notFound("Issue");
  const [issue] = store.issues.splice(index, 1);
  return NextResponse.json({ success: true, issue });
}
