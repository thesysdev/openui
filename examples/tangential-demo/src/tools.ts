import { z } from "zod";
import {
  createIssue,
  getCycles,
  getIssue,
  getIssues,
  getLabels,
  getProjects,
  getTeams,
  getUsers,
  updateIssue,
} from "@/data/db";
import type { Issue } from "@/data/types";

const workflowStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  type: z.enum(["triage", "backlog", "unstarted", "started", "completed", "cancelled"]),
  position: z.number(),
});

const cycleSchema = z.object({
  id: z.string(),
  number: z.number(),
  name: z.string().optional(),
  startsAt: z.string(),
  endsAt: z.string(),
  completedAt: z.string().optional(),
});

const teamSchema = z.object({
  id: z.string(),
  name: z.string(),
  key: z.string(),
  icon: z.string().optional(),
  color: z.string(),
  states: z.array(workflowStateSchema),
  cycles: z.array(cycleSchema),
});

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  email: z.string(),
  avatarUrl: z.string().optional(),
  active: z.boolean(),
});

const labelSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
});

const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().optional(),
  color: z.string(),
  state: z.enum(["planned", "started", "paused", "completed", "cancelled"]),
  lead: userSchema.optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
});

const issueSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.number().int().min(0).max(4),
  stateId: z.string(),
  teamId: z.string(),
  assigneeId: z.string().optional(),
  labelIds: z.array(z.string()),
  projectId: z.string().optional(),
  cycleId: z.string().optional(),
  parentId: z.string().optional(),
  estimate: z.number().optional(),
  dueDate: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional(),
  cancelledAt: z.string().optional(),
  archivedAt: z.string().optional(),
  subIssueSortOrder: z.number().optional(),
  sortOrder: z.number(),
  number: z.number(),
});

const issueWithRelationsSchema = issueSchema.extend({
  state: workflowStateSchema,
  team: teamSchema,
  assignee: userSchema.optional(),
  labels: z.array(labelSchema),
  project: projectSchema.optional(),
  cycle: cycleSchema.optional(),
  children: z.array(issueSchema).optional(),
});

export interface ToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, z.ZodType>;
  outputSchema: z.ZodType;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

export const tools: ToolDef[] = [
  {
    name: "list_teams",
    description: "List all teams with workflow states and cycles.",
    inputSchema: {},
    outputSchema: z.object({ teams: z.array(teamSchema) }),
    execute: async () => ({ teams: getTeams() }),
  },
  {
    name: "list_issues",
    description:
      "List issues with optional filters by team, state, assignee, label, project, or cycle.",
    inputSchema: {
      teamId: z.string().optional(),
      stateId: z.string().optional(),
      assigneeId: z.string().optional(),
      labelId: z.string().optional(),
      projectId: z.string().optional(),
      cycleId: z.string().optional(),
    },
    outputSchema: z.object({ issues: z.array(issueWithRelationsSchema), totalCount: z.number() }),
    execute: async (args) => {
      const issues = getIssues({
        teamId: args.teamId as string | undefined,
        stateId: args.stateId as string | undefined,
        assigneeId: args.assigneeId as string | undefined,
        labelId: args.labelId as string | undefined,
        projectId: args.projectId as string | undefined,
        cycleId: args.cycleId as string | undefined,
      });
      return { issues, totalCount: issues.length };
    },
  },
  {
    name: "get_issue",
    description: "Get a single issue by id or identifier (example: issue-123 or ENG-24).",
    inputSchema: {
      id: z.string(),
    },
    outputSchema: z.object({
      issue: issueWithRelationsSchema.optional(),
      error: z.string().optional(),
    }),
    execute: async (args) => {
      const issue = getIssue(String(args.id));
      if (!issue) return { error: "Issue not found" };
      return { issue };
    },
  },
  {
    name: "create_issue",
    description: "Create a new issue.",
    inputSchema: {
      title: z.string().describe("Issue title"),
      teamId: z.string().describe("Team id"),
      description: z.string().optional(),
      priority: z.number().int().min(0).max(4).optional(),
      stateId: z.string().optional(),
      assigneeId: z.string().optional(),
      labelIds: z.array(z.string()).optional(),
      projectId: z.string().optional(),
      cycleId: z.string().optional(),
      estimate: z.number().optional(),
      dueDate: z.string().optional(),
    },
    outputSchema: z.object({ success: z.boolean(), issue: issueWithRelationsSchema }),
    execute: async (args) => {
      const issue = createIssue({
        title: String(args.title),
        teamId: String(args.teamId),
        description: args.description as string | undefined,
        priority: args.priority as 0 | 1 | 2 | 3 | 4 | undefined,
        stateId: args.stateId as string | undefined,
        assigneeId: args.assigneeId as string | undefined,
        labelIds: args.labelIds as string[] | undefined,
        projectId: args.projectId as string | undefined,
        cycleId: args.cycleId as string | undefined,
        estimate: args.estimate as number | undefined,
        dueDate: args.dueDate as string | undefined,
      });
      return { success: true, issue };
    },
  },
  {
    name: "update_issue",
    description: "Update an existing issue.",
    inputSchema: {
      id: z.string().describe("Issue id or identifier"),
      title: z.string().optional(),
      description: z.string().optional(),
      priority: z.number().int().min(0).max(4).optional(),
      stateId: z.string().optional(),
      teamId: z.string().optional(),
      assigneeId: z.string().optional(),
      labelIds: z.array(z.string()).optional(),
      projectId: z.string().optional(),
      cycleId: z.string().optional(),
      estimate: z.number().optional(),
      dueDate: z.string().optional(),
      completedAt: z.string().optional(),
      cancelledAt: z.string().optional(),
      archivedAt: z.string().optional(),
    },
    outputSchema: z.object({
      success: z.boolean(),
      issue: issueWithRelationsSchema.optional(),
      error: z.string().optional(),
    }),
    execute: async (args) => {
      const { id, ...input } = args;
      const issue = updateIssue(String(id), input as Partial<Issue>);
      if (!issue) return { success: false, error: "Issue not found" };
      return { success: true, issue };
    },
  },
  {
    name: "list_projects",
    description: "List all projects.",
    inputSchema: {},
    outputSchema: z.object({ projects: z.array(projectSchema) }),
    execute: async () => ({ projects: getProjects() }),
  },
  {
    name: "list_cycles",
    description: "List cycles for a team. If teamId is omitted, returns default team cycles.",
    inputSchema: { teamId: z.string().optional() },
    outputSchema: z.object({ cycles: z.array(cycleSchema) }),
    execute: async (args) => ({ cycles: getCycles(args.teamId as string | undefined) }),
  },
  {
    name: "list_labels",
    description: "List all issue labels.",
    inputSchema: {},
    outputSchema: z.object({ labels: z.array(labelSchema) }),
    execute: async () => ({ labels: getLabels() }),
  },
  {
    name: "list_users",
    description: "List all users.",
    inputSchema: {},
    outputSchema: z.object({ users: z.array(userSchema) }),
    execute: async () => ({ users: getUsers() }),
  },
];
