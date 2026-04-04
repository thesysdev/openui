import { getStore } from "@/data/store";
import type { Issue, IssuePriority } from "@/data/types";
import {
  applyCursorPagination,
  asNumber,
  badRequest,
  created,
  sortByOrder,
} from "@/lib/api-helpers";
import { NextRequest, NextResponse } from "next/server";

const mapPriorityLabel = (priority: IssuePriority): Issue["priorityLabel"] => {
  switch (priority) {
    case 1:
      return "Urgent";
    case 2:
      return "High";
    case 3:
      return "Medium";
    case 4:
      return "Low";
    default:
      return "No priority";
  }
};

export async function GET(request: NextRequest) {
  const store = getStore();
  const { searchParams } = new URL(request.url);

  const filters = {
    teamId: searchParams.get("teamId"),
    stateId: searchParams.get("stateId"),
    assigneeId: searchParams.get("assigneeId"),
    projectId: searchParams.get("projectId"),
    cycleId: searchParams.get("cycleId"),
    labelId: searchParams.get("labelId"),
    priority: asNumber(searchParams.get("priority")),
  };

  let issues = store.issues.filter((item) => {
    if (filters.teamId && item.teamId !== filters.teamId) return false;
    if (filters.stateId && item.stateId !== filters.stateId) return false;
    if (filters.assigneeId && item.assigneeId !== filters.assigneeId) return false;
    if (filters.projectId && item.projectId !== filters.projectId) return false;
    if (filters.cycleId && item.cycleId !== filters.cycleId) return false;
    if (filters.labelId && !item.labelIds.includes(filters.labelId)) return false;
    if (typeof filters.priority === "number" && item.priority !== filters.priority) return false;
    return true;
  });

  const orderBy = searchParams.get("orderBy");
  issues = sortByOrder(
    issues,
    orderBy,
    orderBy?.includes("updated") ? (item) => item.updatedAt : (item) => item.sortOrder,
  );

  const first = asNumber(searchParams.get("first"));
  const after = searchParams.get("after");
  return NextResponse.json(applyCursorPagination(issues, first, after ?? undefined));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const store = getStore();

  if (!body?.title || !body?.teamId) {
    return badRequest("title and teamId are required");
  }

  const team = store.teams.find((item) => item.id === body.teamId);
  if (!team) {
    return badRequest("Unknown teamId");
  }

  const maxNumber = store.issues
    .filter((item) => item.teamId === body.teamId)
    .reduce((max, item) => Math.max(max, item.number), 0);
  const nextNumber = maxNumber + 1;
  const priority = (typeof body.priority === "number" ? body.priority : 0) as IssuePriority;
  const timestamp = new Date().toISOString();

  const createdIssue: Issue = {
    id: crypto.randomUUID(),
    identifier: `${team.key}-${nextNumber}`,
    number: nextNumber,
    title: body.title,
    description: body.description ?? "",
    priority,
    priorityLabel: mapPriorityLabel(priority),
    estimate: body.estimate ?? null,
    stateId: body.stateId ?? "state-backlog",
    teamId: body.teamId,
    projectId: body.projectId ?? null,
    cycleId: body.cycleId ?? null,
    assigneeId: body.assigneeId ?? null,
    creatorId: body.creatorId ?? store.users[0]?.id ?? "system",
    labelIds: Array.isArray(body.labelIds) ? body.labelIds : [],
    parentId: body.parentId ?? null,
    sortOrder: Date.now(),
    startedAt: null,
    completedAt: null,
    canceledAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    url: `https://linear.app/${team.name.toLowerCase()}/issue/${team.key}-${nextNumber}`,
  };

  store.issues.unshift(createdIssue);
  return created({ success: true, issue: createdIssue });
}
