"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LiveArtifactRenderer, useArtifactRenderer } from "@openuidev/react-ui/cloud";
import {
  AlertTriangle,
  ChevronRight,
  LayoutDashboard,
  Loader2,
  PanelRightClose,
  Pencil,
  RotateCw,
  X,
} from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { library } from "../library";

// The slots used below, by their short names.
const {
  Preview,
  Chrome,
  ChromeTitle,
  ChromeActions,
  CloseButton,
  Content,
  Loading,
  Error: ErrorSlot,
} = LiveArtifactRenderer;

/** What to render: the dashboard tool's result, as is, or for a dashboard from the list, its id. */
type DashboardSource = { response: string } | { id: string };

type DashboardProps = DashboardSource & {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** The side panel the dashboard opens in. */
  panel: HTMLElement | null;
  /** Puts an edit request for this dashboard in the composer. */
  onEdit: (title: string) => void;
  /** The card that opens it: `<DashboardCard />` in the chat, nothing from the list. */
  preview: ReactNode;
};

/**
 * One live dashboard. LiveArtifactRenderer streams it from OpenUI Cloud and runs its Query()
 * calls through /api/interpreter. Each slot here uses one of the three slot modes: omit it for
 * the default, pass props to adjust the default, or pass children to replace it. Here every
 * part is replaced with shadcn/ui, so the renderer needs none of react-ui's styles.
 */
export function Dashboard({
  isOpen,
  onOpenChange,
  panel,
  onEdit,
  preview,
  ...source
}: DashboardProps) {
  return (
    <LiveArtifactRenderer
      {...source}
      library={library}
      interpreter={{ url: "/api/interpreter" }}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      renderInHtmlElement={panel}
    >
      {/* Children: our own card replaces the default preview. */}
      <Preview>{preview}</Preview>
      {/* Children: our own frame, built from the chrome's parts. */}
      <Chrome>
        <div className="flex h-full w-full flex-col bg-background">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
              <LayoutDashboard className="size-4" />
            </span>
            {/* Props: the default title, styled. */}
            <ChromeTitle className="min-w-0 flex-1 truncate text-sm font-semibold" />
            {/* Always shown, so it sits in the bar rather than in ChromeLoader (shown only while loading). */}
            <StatusBadge />
            <ChromeActions>
              <EditButton onEdit={onEdit} />
              <CloseButton>
                <PanelCloseButton />
              </CloseButton>
            </ChromeActions>
          </header>
          <Content className="relative min-h-0 flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6">
            <Loading>
              <DashboardLoading />
            </Loading>
            <ErrorSlot>
              <DashboardError />
            </ErrorSlot>
          </Content>
        </div>
      </Chrome>
    </LiveArtifactRenderer>
  );
}

type Status = { label: string; tone: "live" | "busy" | "error" | "done" };

function statusOf(
  { isStreaming, isFetching, error }: ReturnType<typeof useArtifactRenderer>,
  edited = false,
): Status {
  if (error) return { label: "Couldn't load", tone: "error" };
  if (isStreaming) return { label: edited ? "Applying changes" : "Generating", tone: "busy" };
  if (isFetching) return { label: "Loading data", tone: "busy" };
  return { label: edited ? "Updated" : "Live", tone: edited ? "done" : "live" };
}

function StatusDot({ tone }: { tone: Status["tone"] }) {
  return (
    <span className="relative flex size-2">
      {tone === "busy" && (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-500 opacity-60" />
      )}
      <span
        className={cn(
          "relative inline-flex size-2 rounded-full",
          tone === "live" && "bg-emerald-500",
          tone === "done" && "bg-emerald-500",
          tone === "busy" && "bg-amber-500",
          tone === "error" && "bg-destructive",
        )}
      />
    </span>
  );
}

function StatusBadge({ edited }: { edited?: boolean }) {
  const status = statusOf(useArtifactRenderer(), edited);
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-normal", status.tone === "error" && "text-destructive")}
    >
      <StatusDot tone={status.tone} />
      {status.label}
    </Badge>
  );
}

/** The card in the chat. `useArtifactRenderer()` reads the renderer it sits in. */
export function DashboardCard({
  edited,
  onGenerated,
}: {
  edited: boolean;
  onGenerated: (title?: string) => void;
}) {
  const renderer = useArtifactRenderer();
  const { title, isStreaming, isOpen, open, close } = renderer;

  // Tell the app when generation ends, so it lists the dashboard with its final title.
  const wasStreaming = useRef(isStreaming);
  useEffect(() => {
    if (wasStreaming.current && !isStreaming) onGenerated(title);
    wasStreaming.current = isStreaming;
  }, [isStreaming, onGenerated, title]);

  return (
    <button
      type="button"
      onClick={isOpen ? close : open}
      aria-pressed={isOpen}
      className={cn(
        "group flex w-full max-w-md items-center gap-3 rounded-xl border bg-card p-3 text-left shadow-xs transition-colors",
        "hover:bg-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
        isOpen && "border-foreground/25 bg-accent/60",
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background">
        <LayoutDashboard className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-sm font-medium">{title ?? "New dashboard"}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <StatusDot tone={statusOf(renderer, edited).tone} />
          {statusOf(renderer, edited).label}
        </span>
      </span>
      <span className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground group-hover:text-foreground">
        {isOpen ? "Close" : "Open"}
        {isOpen ? <PanelRightClose className="size-4" /> : <ChevronRight className="size-4" />}
      </span>
    </button>
  );
}

function EditButton({ onEdit }: { onEdit: (title: string) => void }) {
  const { title, isStreaming } = useArtifactRenderer();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isStreaming}
          onClick={() => onEdit(title ?? "this dashboard")}
        >
          <Pencil />
          Edit
        </Button>
      </TooltipTrigger>
      <TooltipContent>Describe a change in the chat</TooltipContent>
    </Tooltip>
  );
}

function PanelCloseButton() {
  const { close } = useArtifactRenderer();
  return (
    <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Close">
      <X />
    </Button>
  );
}

/** A pill over the dashboard while it's generated or its data loads. The slot shows it only then. */
function DashboardLoading() {
  const { isStreaming } = useArtifactRenderer();
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center"
      role="status"
    >
      <span className="inline-flex items-center gap-2 rounded-full border bg-background/95 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur">
        <Loader2 className="size-3.5 animate-spin" />
        {isStreaming ? "Building your dashboard…" : "Loading live data…"}
      </span>
    </div>
  );
}

/** Above the dashboard when it fails. The slot shows it only then. */
function DashboardError() {
  const { error, retry } = useArtifactRenderer();
  return (
    <div
      role="alert"
      className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {error?.source === "query"
            ? "Some of this dashboard's data didn't load."
            : "This dashboard couldn't be shown."}
        </p>
        <p className="mt-1 break-words text-muted-foreground">{error?.message}</p>
      </div>
      {retry && (
        <Button variant="outline" size="sm" onClick={retry}>
          <RotateCw />
          Try again
        </Button>
      )}
    </div>
  );
}
