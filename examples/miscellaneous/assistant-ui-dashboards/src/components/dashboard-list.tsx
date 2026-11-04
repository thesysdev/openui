"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  useArtifactDelete,
  useArtifactList,
  useArtifactPin,
  useArtifactUnpin,
  useArtifactUpdate,
  type ArtifactSummary,
} from "@openuidev/react-ui/cloud";
import { LayoutDashboard, Pencil, Pin, PinOff, Trash2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useOpenDashboard } from "./dashboard";

/**
 * The user's dashboards in OpenUI Cloud: pinned ones first, then the rest, newest first. Each
 * opens in the panel by its id, and can be pinned, unpinned, renamed, or deleted. Every list and
 * renderer shares one cache, so a change shows everywhere at once and reverts if OpenUI Cloud
 * refuses it.
 */
export function DashboardList() {
  const pinned = useArtifactList({ filter: { type: "dashboard", pinned: true } });
  const recent = useArtifactList({ filter: { type: "dashboard", pinned: false, limit: 20 } });
  const { pin } = useArtifactPin();
  const { unpin } = useArtifactUnpin();
  const { update } = useArtifactUpdate();
  const { deleteArtifact } = useArtifactDelete();
  const { open, setOpen, openId, saved } = useOpenDashboard();
  // The dashboard a dialog is about. It stays set while the dialog animates closed, so the
  // dialog keeps showing its name.
  const [renaming, setRenaming] = useState<DialogTarget>(null);
  const [deleting, setDeleting] = useState<DialogTarget>(null);

  // A dashboard joins the list, or shows its new title, once it's generated and saved.
  const refreshPinned = pinned.refresh;
  const refreshRecent = recent.refresh;
  useEffect(() => {
    if (saved === 0) return;
    refreshPinned();
    refreshRecent();
  }, [saved, refreshPinned, refreshRecent]);

  const rename = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = String(new FormData(event.currentTarget).get("title") ?? "").trim();
    if (renaming && title && title !== renaming.artifact.title) {
      void update(renaming.artifact.id, { title });
    }
    setRenaming(close);
  };
  const remove = () => {
    if (!deleting) return;
    const { id } = deleting.artifact;
    if (openId === id) setOpen(null);
    void deleteArtifact(id);
  };

  const row = (artifact: ArtifactSummary) => (
    <li key={artifact.id} className="group relative">
      <button
        type="button"
        onClick={() => setOpen({ key: `list:${artifact.id}`, id: artifact.id })}
        aria-current={open !== null && openId === artifact.id}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 pr-20 text-left text-sm hover:bg-sidebar-accent",
          open !== null && openId === artifact.id && "bg-sidebar-accent font-medium",
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
          onClick={() => void (artifact.pinned ? unpin(artifact.id) : pin(artifact.id))}
        >
          {artifact.pinned ? <PinOff /> : <Pin />}
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Rename"
          onClick={() => setRenaming({ artifact, open: true })}
        >
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label="Delete"
          onClick={() => setDeleting({ artifact, open: true })}
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

      <Dialog
        open={renaming?.open ?? false}
        onOpenChange={(isOpen) => !isOpen && setRenaming(close)}
      >
        <DialogContent>
          <form onSubmit={rename} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Rename dashboard</DialogTitle>
              <DialogDescription>
                The new name shows in your list and on the dashboard.
              </DialogDescription>
            </DialogHeader>
            <Input
              key={renaming?.artifact.id}
              name="title"
              defaultValue={renaming?.artifact.title}
              placeholder="Untitled dashboard"
              aria-label="Dashboard name"
              required
              autoFocus
              onFocus={(event) => event.currentTarget.select()}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleting?.open ?? false}
        onOpenChange={(isOpen) => !isOpen && setDeleting(close)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleting?.artifact.title ? `"${deleting.artifact.title}"` : "this dashboard"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              It's removed from OpenUI Cloud for good. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={remove}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  );
}

/** A dashboard a dialog acts on, and whether the dialog is open. */
type DialogTarget = { artifact: ArtifactSummary; open: boolean } | null;

/** Closes a dialog but keeps its dashboard, for the closing animation. */
const close = (target: DialogTarget): DialogTarget => target && { ...target, open: false };
