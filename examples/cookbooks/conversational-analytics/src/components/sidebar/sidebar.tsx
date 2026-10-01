"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { SidebarBrand } from "./sidebar-brand";
import { DriversIcon, HomeIcon, RadioIcon, StandingsIcon, TeamsIcon } from "./sidebar-icons";
import { SidebarNav } from "./sidebar-nav";
import { SidebarNavItem } from "./sidebar-nav-item";
import { SidebarNewChatButton } from "./sidebar-new-chat-button";
import { SidebarSectionLabel } from "./sidebar-section-label";
import { SidebarShell } from "./sidebar-shell";
import { SidebarThreadItem } from "./sidebar-thread-item";

export type SidebarThread = { id: string; title: string; meta?: string };

export const sidebarNav: { id: string; label: string; icon: ReactNode }[] = [
  { id: "home", label: "Home", icon: <HomeIcon /> },
  { id: "standings", label: "Standings", icon: <StandingsIcon /> },
  { id: "drivers", label: "Drivers", icon: <DriversIcon /> },
  { id: "teams", label: "Teams", icon: <TeamsIcon /> },
];

// Sample history until the chat keeps real threads.
export const sampleThreads: SidebarThread[] = [
  { id: "t1", title: "Verstappen vs Norris race pace in 2024", meta: "Today" },
  { id: "t2", title: "Who has the most wins at Monza?", meta: "Today" },
  { id: "t3", title: "Ferrari pit stop times this season", meta: "Yesterday" },
  { id: "t4", title: "Hamilton's podiums at Silverstone", meta: "Yesterday" },
  { id: "t5", title: "Monaco qualifying gaps to pole", meta: "Mon" },
  { id: "t6", title: "Constructors' points after the summer break", meta: "Last week" },
  { id: "t7", title: "Fastest laps by tyre compound at Spa", meta: "Last week" },
];

export type SidebarProps = {
  threads?: SidebarThread[];
  floating?: boolean;
  textured?: boolean;
  defaultNav?: string;
  defaultThread?: string | null;
  /** The open thread, when the page owns it (e.g. from the URL). Leave unset to let the sidebar track it. */
  activeThread?: string | null;
  /** The highlighted destination, when the page owns it; null highlights none (e.g. on a new chat). Leave unset to let the sidebar track it. */
  activeNav?: string | null;
  /** Starts as the icon rail unless set to false. */
  defaultCollapsed?: boolean;
  /** Slide in from the left on mount. */
  enter?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onNavigate?: (id: string) => void;
  onOpenThread?: (id: string) => void;
  /** The thread the agent is answering in right now: it shows ON AIR (selected or not). */
  liveThread?: string | null;
  /** Shows the red plus pill beside Team Radio (and on the collapsed rail) to start a new chat. */
  onNewChat?: () => void;
};

/**
 * The whole sidebar: the mascot and F1 with a collapse button, the four destinations,
 * then the Team Radio threads. Collapsed, it narrows to a rail of the mascot and nav icons.
 */
export function Sidebar({
  threads = sampleThreads,
  floating = false,
  textured = true,
  defaultNav = "home",
  defaultThread = null,
  activeThread,
  activeNav,
  defaultCollapsed = true,
  enter = true,
  onCollapsedChange,
  onNavigate,
  onOpenThread,
  onNewChat,
  liveThread = null,
}: SidebarProps) {
  const [ownNav, setNav] = useState<string | null>(defaultNav);
  const nav = activeNav !== undefined ? activeNav : ownNav;
  const [ownThread, setThread] = useState<string | null>(defaultThread);
  const thread = activeThread !== undefined ? activeThread : ownThread;
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const newChat = () => {
    setNav("home");
    setThread(null);
    onNewChat?.();
  };
  const toggleCollapsed = () => {
    setPeek(false);
    setCollapsed(!collapsed);
    onCollapsedChange?.(!collapsed);
  };

  // Hovering the collapsed rail opens the full sidebar over the page (the page doesn't move),
  // after a short delay so passing over it does nothing. Leaving, or clicking the backdrop, closes it.
  const [peek, setPeek] = useState(false);
  const peekTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const peeking = collapsed && peek;
  // Hover intent: it opens only once the pointer has rested on the rail for 400ms. Every move restarts
  // the wait, and a press cancels it, so someone heading for a rail icon clicks it with nothing shifting.
  const startPeek = (e: PointerEvent<HTMLElement>) => {
    if (!collapsed || peek || e.pointerType === "touch") return;
    clearTimeout(peekTimer.current);
    peekTimer.current = setTimeout(() => setPeek(true), 400);
  };
  const cancelPendingPeek = () => {
    if (!peek) clearTimeout(peekTimer.current);
  };
  const endPeek = () => {
    clearTimeout(peekTimer.current);
    setPeek(false);
  };
  useEffect(() => () => clearTimeout(peekTimer.current), []);

  return (
    <>
      {floating && (
        <div className="f1-sidebar-backdrop" data-open={peeking || undefined} aria-hidden onClick={endPeek} />
      )}
      <SidebarShell
        floating={floating}
        textured={textured}
        collapsed={collapsed && !peek}
        enter={enter}
        onPointerEnter={startPeek}
        onPointerLeave={endPeek}
        onPointerMove={startPeek}
        onPointerDown={cancelPendingPeek}
      >
        <SidebarBrand collapsed={collapsed && !peek} peeking={peeking} onToggleCollapsed={toggleCollapsed} />
        <SidebarNav active={thread === null ? nav : null}>
          {sidebarNav.map((item) => (
            <SidebarNavItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              active={thread === null && nav === item.id}
              onSelect={() => {
                setNav(item.id);
                setThread(null);
                onNavigate?.(item.id);
              }}
            />
          ))}
        </SidebarNav>
        <div className="f1-sidebar-radio-head">
          {/* The whole row starts a new chat; the pill's click bubbles up to it. */}
          <SidebarSectionLabel
            label="Team Radio"
            action={onNewChat && <SidebarNewChatButton />}
            onClick={onNewChat && newChat}
          />
          {onNewChat && <SidebarNewChatButton rail onClick={() => newChat()} />}
        </div>
        <div className="f1-sidebar-threads">
          {threads.map((t) => (
            <SidebarThreadItem
              key={t.id}
              title={t.title}
              meta={t.meta}
              status={t.id === liveThread ? "on-air" : thread === t.id ? "standby" : undefined}
              icon={<RadioIcon size={18} color="currentColor" />}
              active={thread === t.id}
              onSelect={() => {
                setThread(t.id);
                onOpenThread?.(t.id);
              }}
            />
          ))}
        </div>
      </SidebarShell>
    </>
  );
}
