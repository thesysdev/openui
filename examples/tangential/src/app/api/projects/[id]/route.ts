import { getStore } from "@/data/store";
import type { Project } from "@/data/types";
import { notFound } from "@/lib/api-helpers";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const store = getStore();
  const project = store.projects.find((item) => item.id === id);
  if (!project) return notFound("Project");
  return NextResponse.json(project);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const store = getStore();
  const index = store.projects.findIndex((item) => item.id === id);
  if (index < 0) return notFound("Project");

  const patch = (await request.json()) as Partial<Project>;
  const project = store.projects[index];
  const next: Project = {
    ...project,
    ...patch,
    id: project.id,
    createdAt: project.createdAt,
    updatedAt: new Date().toISOString(),
  };

  store.projects[index] = next;
  return NextResponse.json({ success: true, project: next });
}
