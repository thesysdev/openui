import { getStore } from "@/data/store";
import { notFound } from "@/lib/api-helpers";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const store = getStore();
  const team = store.teams.find((item) => item.id === id);
  if (!team) return notFound("Team");

  const workflowStates = store.workflowStates.filter((item) => item.teamId === id);
  const members = store.users;
  return NextResponse.json({
    ...team,
    members,
    workflowStates,
  });
}
