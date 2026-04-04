"use client";

import { StatusIcon } from "@/components/StatusIcon";
import { shortDate } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type APIList<T> = { nodes: T[] };

type Issue = {
  id: string;
  identifier: string;
  title: string;
  description?: string;
  priority: number;
  priorityLabel: string;
  stateId: string;
  assigneeId?: string | null;
  projectId?: string | null;
  cycleId?: string | null;
  labelIds: string[];
  createdAt: string;
  updatedAt: string;
};

type Comment = {
  id: string;
  body: string;
  userId: string;
  createdAt: string;
};

type State = { id: string; name: string };
type User = { id: string; displayName: string; email: string };
type Label = { id: string; name: string; color: string };
type Project = { id: string; name: string };
type Cycle = { id: string; name: string };

const fetchJSON = async <T,>(path: string): Promise<T> => {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Request failed: ${path}`);
  return (await res.json()) as T;
};

export const IssueDetail = ({ issueId }: { issueId: string }) => {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [issueRes, commentsRes, statesRes, usersRes, labelsRes, projectsRes, cyclesRes] =
          await Promise.all([
            fetchJSON<Issue>(`/api/issues/${issueId}`),
            fetchJSON<APIList<Comment>>(`/api/issues/${issueId}/comments`),
            fetchJSON<APIList<State>>("/api/workflow-states"),
            fetchJSON<APIList<User>>("/api/users"),
            fetchJSON<APIList<Label>>("/api/labels"),
            fetchJSON<APIList<Project>>("/api/projects"),
            fetchJSON<APIList<Cycle>>("/api/cycles"),
          ]);

        if (cancelled) return;
        setIssue(issueRes);
        setComments(commentsRes.nodes);
        setStates(statesRes.nodes);
        setUsers(usersRes.nodes);
        setLabels(labelsRes.nodes);
        setProjects(projectsRes.nodes);
        setCycles(cyclesRes.nodes);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load issue");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [issueId]);

  const lookup = useMemo(() => {
    const state = new Map(states.map((item) => [item.id, item.name]));
    const user = new Map(users.map((item) => [item.id, item.displayName || item.email]));
    const label = new Map(labels.map((item) => [item.id, item]));
    const project = new Map(projects.map((item) => [item.id, item.name]));
    const cycle = new Map(cycles.map((item) => [item.id, item.name]));
    return { state, user, label, project, cycle };
  }, [states, users, labels, projects, cycles]);

  if (loading) return <div className="p-6 text-sm text-[var(--muted)]">Loading issue...</div>;
  if (error || !issue)
    return (
      <div className="p-6 text-sm text-red-300">Issue unavailable: {error ?? "Not found"}</div>
    );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(520px,1fr)_320px]">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="mb-4">
          <Link
            href="/issues"
            className="mb-2 inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            Back to issues
          </Link>
          <div className="mb-1 text-xs font-mono text-[var(--muted)]">{issue.identifier}</div>
          <h1 className="text-xl font-semibold text-white">{issue.title}</h1>
        </div>

        <p className="mb-6 text-sm leading-6 whitespace-pre-wrap text-zinc-300">
          {issue.description?.trim() || "No description provided yet."}
        </p>

        <h2 className="mb-3 text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
          Activity
        </h2>
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-md border border-[var(--border)] bg-[var(--panel-2)] p-3"
            >
              <div className="mb-2 flex items-center justify-between text-xs text-[var(--muted)]">
                <span>{lookup.user.get(comment.userId) ?? "Unknown"}</span>
                <span>{shortDate(comment.createdAt)}</span>
              </div>
              <div className="text-sm text-zinc-200">{comment.body}</div>
            </div>
          ))}
          {!comments.length ? (
            <div className="text-sm text-[var(--muted)]">No comments yet.</div>
          ) : null}
        </div>
      </div>

      <aside className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4">
        <h3 className="mb-3 text-xs font-semibold tracking-wide text-[var(--muted)] uppercase">
          Details
        </h3>
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-[var(--muted)]">Status</dt>
            <dd className="flex items-center gap-2 text-white">
              <StatusIcon state={lookup.state.get(issue.stateId) ?? "Backlog"} />
              {lookup.state.get(issue.stateId) ?? "Unknown"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-[var(--muted)]">Priority</dt>
            <dd className="text-white">{issue.priorityLabel}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-[var(--muted)]">Assignee</dt>
            <dd className="text-white">
              {issue.assigneeId ? (lookup.user.get(issue.assigneeId) ?? "Unknown") : "Unassigned"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-[var(--muted)]">Project</dt>
            <dd className="text-right text-white">
              {issue.projectId ? (lookup.project.get(issue.projectId) ?? "Unknown") : "None"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-[var(--muted)]">Cycle</dt>
            <dd className="text-right text-white">
              {issue.cycleId ? (lookup.cycle.get(issue.cycleId) ?? "Unknown") : "None"}
            </dd>
          </div>
          <div className="space-y-2">
            <dt className="text-[var(--muted)]">Labels</dt>
            <dd className="flex flex-wrap gap-1">
              {issue.labelIds.map((labelId) => {
                const label = lookup.label.get(labelId);
                if (!label) return null;
                return (
                  <span
                    key={labelId}
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
                    style={{ background: label.color }}
                  >
                    {label.name}
                  </span>
                );
              })}
              {!issue.labelIds.length ? (
                <span className="text-xs text-[var(--muted)]">No labels</span>
              ) : null}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-[var(--muted)]">Created</dt>
            <dd className="text-white">{shortDate(issue.createdAt)}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-[var(--muted)]">Updated</dt>
            <dd className="text-white">{shortDate(issue.updatedAt)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
};
