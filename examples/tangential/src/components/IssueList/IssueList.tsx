"use client";

import { IssueGroupHeader } from "@/components/IssueList/IssueGroupHeader";
import { type IssueRowModel, IssueRow } from "@/components/IssueList/IssueRow";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

type APIList<T> = {
  nodes: T[];
};

type Issue = {
  id: string;
  identifier: string;
  title: string;
  projectId?: string | null;
  labelIds: string[];
  priority: number;
  assigneeId?: string | null;
  stateId: string;
  createdAt: string;
};

type WorkflowState = {
  id: string;
  name: string;
  position: number;
};

type Label = {
  id: string;
  name: string;
  color: string;
};

type Project = {
  id: string;
  name: string;
};

const fetchJSON = async <T,>(path: string): Promise<T> => {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Request failed: ${path}`);
  }
  return (await res.json()) as T;
};

export const IssueList = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [states, setStates] = useState<WorkflowState[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const [issuesRes, statesRes, labelsRes, projectsRes] = await Promise.all([
          fetchJSON<APIList<Issue>>("/api/issues?orderBy=sortOrder_desc"),
          fetchJSON<APIList<WorkflowState>>("/api/workflow-states"),
          fetchJSON<APIList<Label>>("/api/labels"),
          fetchJSON<APIList<Project>>("/api/projects"),
        ]);

        if (cancelled) return;
        setIssues(issuesRes.nodes);
        setStates(statesRes.nodes);
        setLabels(labelsRes.nodes);
        setProjects(projectsRes.nodes);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load issues");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const grouped = useMemo(() => {
    const stateMap = new Map(states.map((state) => [state.id, state]));
    const labelMap = new Map(labels.map((label) => [label.id, label]));
    const projectMap = new Map(projects.map((project) => [project.id, project]));
    const groups = new Map<string, { state: WorkflowState; rows: IssueRowModel[] }>();

    for (const issue of issues) {
      const state = stateMap.get(issue.stateId);
      if (!state) continue;
      if (!groups.has(state.id)) {
        groups.set(state.id, { state, rows: [] });
      }

      groups.get(state.id)?.rows.push({
        id: issue.id,
        identifier: issue.identifier,
        title: issue.title,
        projectName: issue.projectId ? projectMap.get(issue.projectId)?.name : undefined,
        labels: issue.labelIds.map((labelId) => labelMap.get(labelId)).filter(Boolean) as Array<{
          id: string;
          name: string;
          color: string;
        }>,
        priority: issue.priority,
        stateName: state.name,
        createdAt: issue.createdAt,
      });
    }

    return [...groups.values()].sort((a, b) => a.state.position - b.state.position);
  }, [issues, states, labels, projects]);

  if (loading) {
    return <div className="p-6 text-sm text-[var(--muted)]">Loading issues...</div>;
  }

  if (error) {
    return (
      <div className="m-5 rounded border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
        Failed to load issue list: {error}
      </div>
    );
  }

  return (
    <div
      className={cn("overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)]")}
    >
      {grouped.map((group) => {
        const isCollapsed = collapsed[group.state.id] ?? false;
        return (
          <section key={group.state.id}>
            <IssueGroupHeader
              name={group.state.name}
              count={group.rows.length}
              collapsed={isCollapsed}
              onToggle={() => setCollapsed((prev) => ({ ...prev, [group.state.id]: !isCollapsed }))}
            />
            {!isCollapsed && group.rows.map((issue) => <IssueRow key={issue.id} issue={issue} />)}
          </section>
        );
      })}
    </div>
  );
};
