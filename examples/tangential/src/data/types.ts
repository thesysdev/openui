export type IssuePriority = 0 | 1 | 2 | 3 | 4;
export type ProjectState = "planned" | "started" | "paused" | "completed" | "canceled";
export type WorkflowStateType = "backlog" | "unstarted" | "started" | "completed" | "cancelled";

export interface Team {
  id: string;
  key: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  active: boolean;
  admin: boolean;
  createdAt: string;
}

export interface WorkflowState {
  id: string;
  name: string;
  color: string;
  type: WorkflowStateType;
  position: number;
  teamId: string;
  description?: string;
}

export interface IssueLabel {
  id: string;
  name: string;
  color: string;
  description?: string;
  isGroup: boolean;
  teamId?: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  state: ProjectState;
  progress: number;
  targetDate?: string;
  startDate?: string;
  color: string;
  icon?: string;
  leadId?: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Cycle {
  id: string;
  number: number;
  name: string;
  description?: string;
  startsAt: string;
  endsAt: string;
  completedAt?: string | null;
  progress: number;
  teamId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  identifier: string;
  number: number;
  title: string;
  description?: string;
  priority: IssuePriority;
  priorityLabel: "No priority" | "Urgent" | "High" | "Medium" | "Low";
  estimate?: number | null;
  stateId: string;
  teamId: string;
  projectId?: string | null;
  cycleId?: string | null;
  assigneeId?: string | null;
  creatorId: string;
  labelIds: string[];
  parentId?: string | null;
  sortOrder: number;
  startedAt?: string | null;
  completedAt?: string | null;
  canceledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  url: string;
}

export interface Comment {
  id: string;
  body: string;
  issueId: string;
  userId: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceData {
  teams: Team[];
  users: User[];
  workflowStates: WorkflowState[];
  labels: IssueLabel[];
  projects: Project[];
  cycles: Cycle[];
  issues: Issue[];
  comments: Comment[];
}
