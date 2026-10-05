import { useThreadList } from "@openuidev/react-headless";
import clsx from "clsx";
import { Menu, SquarePen } from "lucide-react";
import type { ReactNode } from "react";
import { IconButton } from "../IconButton";
import { useAgentInterfaceStore } from "./_shared/store";

export interface MobileHeaderProps {
  className?: string;
  logo?: ReactNode;
  agentName?: ReactNode;
  menuButton?: ReactNode | false;
  newChatButton?: ReactNode | false;
  actions?: ReactNode;
  children?: ReactNode;
}

export const MobileHeader = ({
  className,
  logo,
  agentName: agentNameProp,
  menuButton,
  newChatButton,
  actions,
  children,
}: MobileHeaderProps) => {
  const switchToNewThread = useThreadList((s) => s.switchToNewThread);
  const isCreatingThread = useThreadList((s) => s.isCreatingThread);
  const { agentName: ctxAgentName, setIsSidebarOpen } = useAgentInterfaceStore((state) => ({
    agentName: state.agentName,
    setIsSidebarOpen: state.setIsSidebarOpen,
  }));

  if (children != null) {
    if (
      typeof process !== "undefined" &&
      process.env?.["NODE_ENV"] !== "production" &&
      (logo !== undefined ||
        agentNameProp !== undefined ||
        menuButton !== undefined ||
        newChatButton !== undefined ||
        actions !== undefined)
    ) {
      console.warn(
        "[AgentInterface] <AgentInterface.MobileHeader> received both children and override props; children win.",
      );
    }
    return <div className={clsx("openui-agent-mobile-header", className)}>{children}</div>;
  }

  const defaultMenuButton = (
    <IconButton
      size="medium"
      icon={<Menu size="1em" />}
      onClick={() => setIsSidebarOpen(true)}
      variant="secondary"
      aria-label="Open sidebar"
    />
  );

  const defaultAgentName = (
    <span className="openui-agent-mobile-header-agent-name">{ctxAgentName}</span>
  );

  const defaultNewChatButton = (
    <IconButton
      size="medium"
      icon={<SquarePen size="1em" />}
      onClick={switchToNewThread}
      disabled={isCreatingThread}
      variant="secondary"
      aria-label="New chat"
    />
  );

  return (
    <div className={clsx("openui-agent-mobile-header", className)}>
      {menuButton === false ? null : (menuButton ?? defaultMenuButton)}
      <div className="openui-agent-mobile-header-logo-container">
        {logo}
        {agentNameProp ?? defaultAgentName}
      </div>
      <div className="openui-agent-mobile-header-actions">
        {newChatButton === false ? null : (newChatButton ?? defaultNewChatButton)}
        {actions}
      </div>
    </div>
  );
};
