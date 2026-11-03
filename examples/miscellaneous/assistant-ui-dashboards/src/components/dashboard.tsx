"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import { DashboardThemeProvider } from "@openuidev/dashboard-kit";
import { LiveArtifactRenderer, useArtifactRenderer } from "@openuidev/react-ui/cloud";
import {
  AlertTriangle,
  ChevronRight,
  LayoutDashboard,
  Loader2,
  PanelRightClose,
  RotateCw,
  X,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { library } from "../library";

/** What the renderer streams: a tool call's result, as is, or for a dashboard from the list, its id. */
export type DashboardSource = { response: string } | { id: string };

/** The dashboard in the side panel: the card or list row that opened it, and what to render. */
type Open = DashboardSource & { key: string };

const OpenDashboard = createContext<{
  open: Open | null;
  setOpen: (open: Open | null) => void;
  /** The open dashboard's artifact id, once its renderer knows it. */
  openId: string | null;
  setOpenId: (id: string | null) => void;
  /** Bumped when a dashboard finishes generating and is saved, so the lists load it. */
  saved: number;
  onSaved: () => void;
}>({
  open: null,
  setOpen: () => {},
  openId: null,
  setOpenId: () => {},
  saved: 0,
  onSaved: () => {},
});

export function OpenDashboardProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<Open | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [saved, setSaved] = useState(0);
  const onSaved = useCallback(() => setSaved((count) => count + 1), []);
  return (
    <OpenDashboard.Provider value={{ open, setOpen, openId, setOpenId, saved, onSaved }}>
      {children}
    </OpenDashboard.Provider>
  );
}

export const useOpenDashboard = () => useContext(OpenDashboard);

type DashboardToolProps = ToolCallMessagePartProps<
  { title?: string; prompt?: string; id?: string },
  string
>;

/**
 * The card in the chat for a create_dashboard or edit_dashboard call. Its result is OpenUI
 * Cloud's response, which the panel passes to the renderer as is. A new dashboard or an edit
 * opens beside the chat as soon as the tool returns.
 */
export function DashboardCard({
  toolName,
  toolCallId,
  args,
  result,
  isError,
  status,
}: DashboardToolProps) {
  const { open, setOpen } = useOpenDashboard();
  const isOpen = open?.key === toolCallId;
  const response = !isError && typeof result === "string" ? result : undefined;

  // Opens once, when the result arrives, so closing the panel sticks.
  const opened = useRef(false);
  useEffect(() => {
    if (!response || opened.current) return;
    opened.current = true;
    setOpen({ key: toolCallId, response });
  }, [response, toolCallId, setOpen]);

  const title =
    args?.title ?? (toolName === "edit_dashboard" ? "Dashboard change" : "New dashboard");
  const [label, tone]: [string, Tone] = isError
    ? ["Couldn't start", "error"]
    : response
      ? [toolName === "edit_dashboard" ? "Change started" : "Live", "live"]
      : [status?.type === "running" ? "Starting" : "Waiting", "busy"];

  return (
    <button
      type="button"
      disabled={!response}
      onClick={() => setOpen(isOpen || !response ? null : { key: toolCallId, response })}
      aria-pressed={isOpen}
      className={cn(
        "group my-3 flex w-full max-w-md items-center gap-3 rounded-xl border bg-card p-3 text-left shadow-xs transition-colors",
        "hover:bg-accent/60 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-default disabled:hover:bg-card",
        isOpen && "border-foreground/25 bg-accent/60",
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-background">
        <LayoutDashboard className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-sm font-medium">{title}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <StatusDot tone={tone} />
          {label}
        </span>
      </span>
      {response && (
        <span className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground group-hover:text-foreground">
          {isOpen ? "Close" : "Open"}
          {isOpen ? <PanelRightClose className="size-4" /> : <ChevronRight className="size-4" />}
        </span>
      )}
    </button>
  );
}

/** The open dashboard, full size beside the chat. */
export function DashboardPanel(source: DashboardSource) {
  const { setOpen } = useOpenDashboard();
  const mode = useColorScheme();

  // LiveArtifactRenderer streams the dashboard from OpenUI Cloud and runs its Query() calls
  // through /api/interpreter. `preview={false}` renders it in place, framed by our Chrome. Every
  // renderer of one dashboard shares a stream, and an edit's response tells it a newer version
  // exists. The kit's components follow the system's light or dark mode.
  return (
    <DashboardThemeProvider mode={mode}>
      <LiveArtifactRenderer
        {...source}
        library={library}
        interpreter={{ url: "/api/interpreter" }}
        preview={false}
        className="h-full"
      >
        <LiveArtifactRenderer.Chrome>
          <PanelFrame
            title={<LiveArtifactRenderer.ChromeTitle className="truncate" />}
            actions={
              <>
                <StatusBadge />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setOpen(null)}
                  aria-label="Close"
                >
                  <X />
                </Button>
              </>
            }
          >
            <PanelReport />
            <LiveArtifactRenderer.Content className="relative h-full overflow-y-auto p-4 sm:p-6">
              <LiveArtifactRenderer.Loading>
                <DashboardLoading />
              </LiveArtifactRenderer.Loading>
              <LiveArtifactRenderer.Error>
                <DashboardError />
              </LiveArtifactRenderer.Error>
            </LiveArtifactRenderer.Content>
          </PanelFrame>
        </LiveArtifactRenderer.Chrome>
      </LiveArtifactRenderer>
    </DashboardThemeProvider>
  );
}

/**
 * Tells the lists which dashboard is open, by the id the renderer read from its source, and when
 * it finishes generating: OpenUI Cloud saves it then.
 */
function PanelReport() {
  const { id, isStreaming } = useArtifactRenderer();
  const { onSaved, setOpenId } = useOpenDashboard();
  useEffect(() => {
    setOpenId(id);
    return () => setOpenId(null);
  }, [id, setOpenId]);
  const wasStreaming = useRef(isStreaming);
  useEffect(() => {
    if (wasStreaming.current && !isStreaming) onSaved();
    wasStreaming.current = isStreaming;
  }, [isStreaming, onSaved]);
  return null;
}

function PanelFrame({
  title,
  actions,
  children,
}: {
  title: ReactNode;
  actions: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full w-full flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
          <LayoutDashboard className="size-4" />
        </span>
        <span className="min-w-0 flex-1 text-sm font-semibold">{title || "New dashboard"}</span>
        <span className="flex items-center gap-2">{actions}</span>
      </header>
      <div className="min-h-0 flex-1 bg-muted/30">{children}</div>
    </div>
  );
}

type Tone = "live" | "busy" | "error";

function StatusDot({ tone }: { tone: Tone }) {
  return (
    <span className="relative flex size-2">
      {tone === "busy" && (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-500 opacity-60" />
      )}
      <span
        className={cn(
          "relative inline-flex size-2 rounded-full",
          tone === "live" && "bg-emerald-500",
          tone === "busy" && "bg-amber-500",
          tone === "error" && "bg-destructive",
        )}
      />
    </span>
  );
}

/** The renderer's state, in the panel's bar. `useArtifactRenderer()` reads the renderer it sits in. */
function StatusBadge() {
  const { isStreaming, isFetching, error } = useArtifactRenderer();
  const [label, tone]: [string, Tone] = error
    ? ["Couldn't load", "error"]
    : isStreaming
      ? ["Generating", "busy"]
      : isFetching
        ? ["Loading data", "busy"]
        : ["Live", "live"];
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-normal", tone === "error" && "text-destructive")}
    >
      <StatusDot tone={tone} />
      {label}
    </Badge>
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

const darkQuery = "(prefers-color-scheme: dark)";

function useColorScheme(): "light" | "dark" {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(darkQuery);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => (window.matchMedia(darkQuery).matches ? "dark" : "light"),
    () => "light",
  );
}
