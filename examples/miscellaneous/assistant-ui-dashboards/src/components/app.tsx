"use client";

import { ThreadList } from "@/components/assistant-ui/elements/thread-list.aui";
import { Thread } from "@/components/assistant-ui/elements/thread.aui";
import { cn } from "@/lib/utils";
import { useChatRuntime } from "@assistant-ui/ai-sdk";
import {
  AssistantRuntimeProvider,
  AuiConfig,
  AuiProvider,
  Suggestions,
  Tools,
  useAui,
  useRemoteThreadListRuntime,
} from "@assistant-ui/react";
import { OpenUICloudProvider } from "@openuidev/react-ui/cloud";
import { LayoutDashboard, MessageSquare } from "lucide-react";
import { useState } from "react";
import toolkit from "../lib/toolkit";
import { DashboardPanel, OpenDashboardProvider, useOpenDashboard } from "./dashboard";
import { DashboardList } from "./dashboard-list";
import { localThreadList } from "./threads";

const token = "/api/frontend-token";

export default function App({ apiBaseUrl }: { apiBaseUrl?: string }) {
  // Each thread posts to /api/chat, which runs the dashboard tools on the server. Threads are
  // kept in this browser (src/components/threads.tsx), not in OpenUI Cloud.
  const runtime = useRemoteThreadListRuntime({
    runtimeHook: () => useChatRuntime(),
    adapter: localThreadList,
  });
  return (
    // The dashboards' renderers and list read OpenUI Cloud through this provider: it fetches the
    // frontend token from /api/frontend-token and refreshes it before it expires.
    <OpenUICloudProvider token={token} apiBaseUrl={apiBaseUrl}>
      <AssistantRuntimeProvider runtime={runtime}>
        <Scopes />
      </AssistantRuntimeProvider>
    </OpenUICloudProvider>
  );
}

function Scopes() {
  const aui = useAui();
  const config = AuiConfig({
    // The toolkit's browser build: each dashboard tool's card.
    tools: Tools({ toolkit }),
    suggestions: Suggestions([
      "Compare weekly npm downloads for react, vue and svelte over 6 months",
      "A health dashboard for vercel/next.js: stars, issues and releases",
      "Security overview for lodash: vulnerabilities by severity",
      "Release cadence and downloads for zod",
    ]),
  });
  return (
    <AuiProvider extends={aui} config={config}>
      <OpenDashboardProvider>
        <Layout />
      </OpenDashboardProvider>
    </AuiProvider>
  );
}

function Layout() {
  const { open } = useOpenDashboard();
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* With a dashboard open, the sidebar makes room for it below 1280px. */}
      <aside
        className={cn(
          "hidden w-64 shrink-0 flex-col gap-3 border-r bg-sidebar p-3 text-sidebar-foreground min-[900px]:flex",
          open && "min-[900px]:max-[1279px]:hidden",
        )}
      >
        <div className="flex items-center gap-2.5 px-1 pt-1">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <LayoutDashboard className="size-4" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">OpenUI x assistant-ui</span>
            <span className="text-xs text-muted-foreground">Dashboards</span>
          </span>
        </div>
        <Sidebar />
      </aside>
      {/* With a dashboard open, the chat narrows to a column beside it. */}
      <main
        className={cn(
          "min-w-0 flex-1",
          open && "hidden min-[900px]:block min-[900px]:w-[440px] min-[900px]:flex-none",
        )}
      >
        <Thread components={{ Welcome }} />
      </main>
      {open && (
        <aside className="fixed inset-0 z-40 min-w-0 flex-1 bg-background min-[900px]:static min-[900px]:z-auto min-[900px]:border-l">
          {/* Keyed by the card or row that opened it, so each opens a fresh panel. */}
          <DashboardPanel
            key={open.key}
            {...("id" in open ? { id: open.id } : { response: open.response })}
          />
        </aside>
      )}
    </div>
  );
}

const tabs = [
  { id: "chats", label: "Chats", icon: MessageSquare },
  { id: "dashboards", label: "Dashboards", icon: LayoutDashboard },
] as const;

/** Two tabs: the user's chats, kept in this browser, and their dashboards in OpenUI Cloud. */
function Sidebar() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("chats");
  return (
    <>
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-lg bg-sidebar-accent p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground",
              tab === id && "bg-background text-foreground shadow-xs",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>
      {tab === "chats" ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ThreadList />
        </div>
      ) : (
        <DashboardList />
      )}
    </>
  );
}

/** The chat's empty state, above assistant-ui's suggestions. */
function Welcome() {
  return (
    <div className="mb-6 flex flex-col gap-2 px-2">
      <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <LayoutDashboard className="size-5" />
      </span>
      <h1 className="text-2xl font-medium tracking-tight">OpenUI Dashboards</h1>
      <p className="text-sm text-muted-foreground">
        Ask for one and it builds beside the chat, with live data from npm, GitHub and OSV.dev.
      </p>
    </div>
  );
}
