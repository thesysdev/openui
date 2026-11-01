"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { OpenUICloudProvider } from "@openuidev/react-headless";
import { LayoutDashboard, SquarePen } from "lucide-react";
import { useCallback, useState } from "react";
import { Chat } from "./chat";
import { Dashboard, DashboardCard } from "./dashboard";
import { DashboardList } from "./dashboard-list";

/** The open dashboard: a card in the chat (`key`), or one opened from the list. */
type Open = { key: string; id: string; title?: string; fromList?: boolean };

export default function App({ apiBaseUrl }: { apiBaseUrl?: string }) {
  const [open, setOpen] = useState<Open | null>(null);
  // The side panel the open dashboard renders into.
  const [panel, setPanel] = useState<HTMLElement | null>(null);
  const [listVersion, setListVersion] = useState(0);
  const [draft, setDraft] = useState<{ text: string } | null>(null);
  // Titles of the chat's dashboards once generated, for the composer's context chip.
  const [titles, setTitles] = useState<Record<string, string>>({});
  // A new chat remounts Chat, which drops its messages and history.
  const [chatId, setChatId] = useState(0);

  const toggle = (next: Open) => (isOpen: boolean) =>
    setOpen((current) => (isOpen ? next : current?.key === next.key ? null : current));
  const edit = (title: string) => setDraft({ text: `In “${title}”, ` });
  const generated = useCallback((id: string, title?: string) => {
    setListVersion((version) => version + 1);
    if (title) setTitles((current) => ({ ...current, [id]: title }));
  }, []);
  const newChat = () => {
    setOpen(null);
    setDraft(null);
    setChatId((id) => id + 1);
  };

  const brand = (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <LayoutDashboard className="size-4" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold">OpenUI x ShadCN</span>
        <span className="text-xs text-muted-foreground">Dashboards</span>
      </span>
    </div>
  );

  return (
    // Every renderer and hook below reads OpenUI Cloud through this provider: it fetches the
    // user's frontend token from /api/frontend-token and refreshes it before it expires.
    <OpenUICloudProvider token="/api/frontend-token" apiBaseUrl={apiBaseUrl}>
      <TooltipProvider delayDuration={300}>
        <div className="flex h-dvh overflow-hidden bg-background">
          {/* With a dashboard open, the sidebar makes room for it below 1280px. */}
          <aside
            className={cn(
              "hidden w-64 shrink-0 flex-col gap-4 border-r bg-sidebar p-3 text-sidebar-foreground min-[900px]:flex",
              open && "min-[900px]:max-[1279px]:hidden",
            )}
          >
            <div className="px-1 pt-1">{brand}</div>
            <Button variant="outline" className="justify-start bg-background" onClick={newChat}>
              <SquarePen />
              New chat
            </Button>
            <Separator />
            <DashboardList
              refreshKey={listVersion}
              openId={open?.id}
              onOpen={({ id, title }) => setOpen({ key: `list:${id}`, id, title, fromList: true })}
            />
          </aside>

          {/* With a dashboard open, the chat narrows to a column beside it. */}
          <main
            className={cn(
              "flex min-w-0 flex-1 flex-col",
              open && "min-[900px]:w-[400px] min-[900px]:flex-none xl:w-[440px]",
            )}
          >
            {/* Under 900px the sidebar is hidden: a slim bar keeps the brand and New chat. */}
            <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 min-[900px]:hidden">
              {brand}
              <Button variant="ghost" size="icon" onClick={newChat} aria-label="New chat">
                <SquarePen />
              </Button>
            </header>
            <Chat
              key={chatId}
              openDashboard={
                open ? { id: open.id, title: titles[open.id] ?? open.title } : undefined
              }
              onCloseDashboard={() => setOpen(null)}
              draft={draft}
              // Open each new dashboard or edit as it's generated.
              onDashboard={(result) => setOpen({ key: result.key, id: result.id })}
              renderDashboard={(result) => {
                const self = { key: result.key, id: result.id };
                return (
                  <Dashboard
                    response={result.response}
                    isOpen={open?.key === result.key}
                    onOpenChange={toggle(self)}
                    panel={panel}
                    onEdit={edit}
                    preview={
                      <DashboardCard
                        edited={result.edited}
                        onGenerated={(title) => generated(result.id, title)}
                      />
                    }
                  />
                );
              }}
            />
          </main>

          {/* The open dashboard renders here: a side panel, or full screen under 900px. */}
          <div
            ref={setPanel}
            className={cn(
              "hidden",
              open &&
                "fixed inset-0 z-40 flex bg-background min-[900px]:static min-[900px]:z-auto min-[900px]:min-w-0 min-[900px]:flex-1 min-[900px]:border-l",
            )}
          />

          {/* A dashboard from the list has no card in the chat: its renderer shows only the
              panel. Renderers of one dashboard share a stream, so an edit reaches all of them. */}
          {open?.fromList && (
            <Dashboard
              key={open.key}
              id={open.id}
              isOpen
              onOpenChange={toggle(open)}
              panel={panel}
              onEdit={edit}
              preview={null}
            />
          )}
        </div>
      </TooltipProvider>
    </OpenUICloudProvider>
  );
}
