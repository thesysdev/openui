import { useThreadList } from "@openuidev/react-headless";
import clsx from "clsx";
import { SquarePen } from "lucide-react";
import type { MouseEvent } from "react";
import { useLayoutContext } from "../../context/LayoutContext";
import { Button } from "../Button";
import { useOptionalSidebarVisualState } from "./Sidebar";
import { SidebarTooltip } from "./SidebarTooltip";
import { useOptionalNav } from "./_shared/navContext";
import { useAgentInterfaceStore } from "./_shared/store";

export const NewChatButton = ({ className }: { className?: string }) => {
  const switchToNewThread = useThreadList((s) => s.switchToNewThread);
  const isCreatingThread = useThreadList((s) => s.isCreatingThread);
  const { isSidebarOpen } = useAgentInterfaceStore((state) => ({
    isSidebarOpen: state.isSidebarOpen,
  }));
  const sidebarVisualState = useOptionalSidebarVisualState();
  const showExpandedButton = sidebarVisualState
    ? !sidebarVisualState.isCollapsedLayout
    : isSidebarOpen;
  const nav = useOptionalNav();
  const { layout } = useLayoutContext();
  const isMobile = layout === "mobile";

  const handleNewChat = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    switchToNewThread();
    if (nav && nav.path !== undefined) {
      nav.navigate(undefined);
    }
  };

  if (isMobile) {
    return (
      <Button
        variant="primary"
        size="large"
        iconLeft={<SquarePen size="1em" />}
        className={clsx("openui-agent-new-chat-floating-button", className)}
        onClick={handleNewChat}
        disabled={isCreatingThread}
        aria-label="New chat"
      >
        New Chat
      </Button>
    );
  }

  return (
    <SidebarTooltip content="New Chat" disabled={showExpandedButton}>
      <button
        type="button"
        className={clsx(
          "openui-agent-new-chat-button",
          { "openui-agent-new-chat-button--collapsed": !showExpandedButton },
          className,
        )}
        onClick={handleNewChat}
        disabled={isCreatingThread}
        aria-label="New chat"
      >
        <div className="openui-agent-new-chat-button__icon" aria-hidden="true">
          <SquarePen size="1em" />
        </div>
        <div className="openui-agent-new-chat-button__label">New Chat</div>
      </button>
    </SidebarTooltip>
  );
};
