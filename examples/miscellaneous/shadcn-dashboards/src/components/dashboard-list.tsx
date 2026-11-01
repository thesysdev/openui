"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useArtifactStorage, type ArtifactSummary } from "@openuidev/react-headless";
import { LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";

interface DashboardListProps {
  /** Changes when a dashboard is created or edited, to list it again. */
  refreshKey: number;
  openId?: string;
  onOpen: (dashboard: ArtifactSummary) => void;
}

/**
 * The user's dashboards, from OpenUI Cloud. `useArtifactStorage()` is the storage
 * OpenUICloudProvider set up with the user's frontend token, so it lists only their own.
 */
export function DashboardList({ refreshKey, openId, onOpen }: DashboardListProps) {
  const storage = useArtifactStorage();
  const [dashboards, setDashboards] = useState<ArtifactSummary[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!storage) return;
    let current = true;
    storage
      .list({ type: ["dashboard"], limit: 50 })
      .then(({ artifacts }) => {
        if (!current) return;
        setDashboards(artifacts);
        setFailed(false);
      })
      .catch(() => current && setFailed(true));
    return () => {
      current = false;
    };
  }, [storage, refreshKey]);

  return (
    <nav aria-label="Your dashboards" className="flex min-h-0 flex-1 flex-col">
      <h2 className="px-2 pb-2 text-xs font-medium text-muted-foreground">Your dashboards</h2>
      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
        {failed && (
          <p className="px-2 py-1 text-sm text-muted-foreground">
            Couldn&apos;t load your dashboards.
          </p>
        )}
        {!failed && dashboards === null && (
          <div className="flex flex-col gap-1" aria-hidden>
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="flex items-center gap-2.5 px-2 py-2">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-3.5 flex-1" style={{ maxWidth: `${80 - row * 12}%` }} />
              </div>
            ))}
          </div>
        )}
        {!failed && dashboards?.length === 0 && (
          <p className="px-2 py-1 text-sm leading-5 text-muted-foreground">
            Dashboards you create show up here.
          </p>
        )}
        <ul className="flex flex-col gap-0.5">
          {dashboards?.map((dashboard) => {
            const active = dashboard.id === openId;
            return (
              <li key={dashboard.id}>
                <button
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => onOpen(dashboard)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
                    active && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                  )}
                >
                  <LayoutDashboard
                    className={cn(
                      "size-4 shrink-0",
                      active ? "text-foreground" : "text-muted-foreground",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate">{dashboard.title}</span>
                  {dashboard.updatedAt !== undefined && (
                    <time
                      dateTime={new Date(dashboard.updatedAt).toISOString()}
                      className="shrink-0 text-xs text-muted-foreground"
                    >
                      {new Date(dashboard.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
