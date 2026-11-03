"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parseArtifactReference } from "@openuidev/react-headless";
import { useArtifactList, type ArtifactSummary } from "@openuidev/react-ui/cloud";
import { LayoutDashboard, Pin, PinOff, Trash2 } from "lucide-react";
import { useEffect } from "react";
import { useOpenDashboard } from "./dashboard";

/**
 * The user's dashboards in OpenUI Cloud: pinned ones first, then the rest, newest first. Each
 * opens in the panel by its id, and can be pinned, unpinned, or deleted. Every list and renderer
 * shares one cache, so a change shows everywhere at once and reverts if OpenUI Cloud refuses it.
 */
export function DashboardList() {
  const pinned = useArtifactList({ filter: { type: "dashboard", pinned: true } });
  const recent = useArtifactList({ filter: { type: "dashboard", pinned: false, limit: 20 } });
  const { open, setOpen, saved } = useOpenDashboard();

  // A dashboard joins the list, or shows its new title, once it's generated and saved.
  const refreshPinned = pinned.refresh;
  const refreshRecent = recent.refresh;
  useEffect(() => {
    if (saved === 0) return;
    refreshPinned();
    refreshRecent();
  }, [saved, refreshPinned, refreshRecent]);

  // Pinning moves a dashboard between the two lists, so both reload.
  const setPinned = async (id: string, next: boolean) => {
    await (next ? recent.pin(id) : pinned.unpin(id));
    pinned.refresh();
    recent.refresh();
  };
  const openId = open
    ? "id" in open
      ? open.id
      : parseArtifactReference(open.response)?.id
    : undefined;
  const remove = async (id: string) => {
    if (!window.confirm("Delete this dashboard? This can't be undone.")) return;
    if (openId === id) setOpen(null);
    await recent.deleteArtifact(id);
  };

  const row = (artifact: ArtifactSummary) => (
    <li key={artifact.id} className="group relative">
      <button
        type="button"
        onClick={() => setOpen({ key: `list:${artifact.id}`, id: artifact.id })}
        aria-current={openId === artifact.id}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 pr-16 text-left text-sm hover:bg-sidebar-accent",
          openId === artifact.id && "bg-sidebar-accent font-medium",
        )}
      >
        <LayoutDashboard className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{artifact.title || "Untitled dashboard"}</span>
      </button>
      <span className="absolute top-1/2 right-1 flex -translate-y-1/2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={artifact.pinned ? "Unpin" : "Pin"}
          onClick={() => void setPinned(artifact.id, !artifact.pinned)}
        >
          {artifact.pinned ? <PinOff /> : <Pin />}
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Delete"
          onClick={() => void remove(artifact.id)}
        >
          <Trash2 />
        </Button>
      </span>
    </li>
  );

  return (
    <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
      {pinned.artifacts.length > 0 && (
        <section className="flex flex-col gap-1">
          <h2 className="px-2 text-xs font-medium text-muted-foreground">Pinned</h2>
          <ul className="flex flex-col">{pinned.artifacts.map(row)}</ul>
        </section>
      )}
      <section className="flex flex-col gap-1">
        <h2 className="px-2 text-xs font-medium text-muted-foreground">Your dashboards</h2>
        {recent.error ? (
          <p className="px-2 text-xs text-destructive">Couldn't load your dashboards.</p>
        ) : recent.artifacts.length === 0 ? (
          <p className="px-2 text-xs text-muted-foreground">
            {recent.isLoading ? "Loading…" : "Dashboards you create show up here."}
          </p>
        ) : (
          <ul className="flex flex-col">{recent.artifacts.map(row)}</ul>
        )}
        {recent.hasMore && (
          <Button variant="ghost" size="sm" className="justify-start" onClick={recent.loadMore}>
            Show more
          </Button>
        )}
      </section>
    </nav>
  );
}
