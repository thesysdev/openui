import { useThreadList } from "@openuidev/react-headless";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import { History } from "lucide-react";
import { useState } from "react";
import { useLayoutContext } from "../../context/LayoutContext";
import { useOptionalSidebarVisualState } from "./Sidebar";
import { SidebarTooltip } from "./SidebarTooltip";
import { useOptionalNav } from "./_shared/navContext";
import { useAgentInterfaceStore } from "./_shared/store";

/**
 * Collapsed-rail shortcut to the thread history. Opens a menu of threads beside
 * the rail; picking one switches to it without expanding the sidebar. The
 * expanded sidebar already lists threads, so the button only renders on the
 * collapsed desktop rail.
 */
export const HistoryButton = ({ className }: { className?: string }) => {
  const { isSidebarOpen } = useAgentInterfaceStore((state) => ({
    isSidebarOpen: state.isSidebarOpen,
  }));
  const sidebarVisualState = useOptionalSidebarVisualState();
  const isCollapsed = sidebarVisualState ? sidebarVisualState.isCollapsedLayout : !isSidebarOpen;
  const { layout } = useLayoutContext();
  const threads = useThreadList((s) => s.threads);
  const isLoadingThreads = useThreadList((s) => s.isLoadingThreads);
  const selectThread = useThreadList((s) => s.selectThread);
  const selectedThreadId = useThreadList((s) => s.selectedThreadId);
  const nav = useOptionalNav();
  const [open, setOpen] = useState(false);

  if (layout === "mobile" || !isCollapsed) return null;

  const handleSelect = (id: string) => {
    selectThread(id);
    if (nav && nav.path !== undefined) {
      nav.navigate(undefined);
    }
  };

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false}>
      <SidebarTooltip content="History" disabled={open}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className={clsx("openui-agent-history-button", className)}
            aria-label="Chat history"
          >
            <History size="1em" aria-hidden="true" />
          </button>
        </DropdownMenu.Trigger>
      </SidebarTooltip>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="openui-agent-history-menu"
          side="right"
          align="start"
          sideOffset={8}
          collisionPadding={12}
        >
          <DropdownMenu.Label className="openui-agent-history-menu__label">
            Recent chats
          </DropdownMenu.Label>
          {threads.length === 0 ? (
            <div className="openui-agent-history-menu__empty">
              {isLoadingThreads ? "Loading…" : "No chats yet"}
            </div>
          ) : (
            threads.map((thread) => (
              <DropdownMenu.Item
                key={thread.id}
                className={clsx("openui-agent-history-menu__item", {
                  "openui-agent-history-menu__item--selected": thread.id === selectedThreadId,
                })}
                onSelect={() => handleSelect(thread.id)}
              >
                <span className="openui-agent-history-menu__title">{thread.title}</span>
              </DropdownMenu.Item>
            ))
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
