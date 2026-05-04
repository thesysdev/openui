import { useThreadList } from "@openuidev/react-headless";
import clsx from "clsx";
import { Menu, Plus } from "lucide-react";
import { ReactNode } from "react";
import { IconButton } from "../IconButton";
import { useShellStore } from "../_shared/store";

interface MobileHeaderProps {
  className?: string;
  rightChildren?: ReactNode;
}

export const MobileHeader = ({ className, rightChildren }: MobileHeaderProps) => {
  const switchToNewThread = useThreadList((s) => s.switchToNewThread);
  const { logoUrl, agentName, setIsSidebarOpen } = useShellStore((state) => ({
    logoUrl: state.logoUrl,
    agentName: state.agentName,
    setIsSidebarOpen: state.setIsSidebarOpen,
  }));

  return (
    <div className={clsx("openui-shell-mobile-header", className)}>
      <IconButton
        size="medium"
        icon={<Menu size="1em" />}
        onClick={() => setIsSidebarOpen(true)}
        variant="secondary"
        aria-label="Open sidebar"
      />
      <div className="openui-shell-mobile-header-logo-container">
        <img className="openui-shell-mobile-header-logo" src={logoUrl} alt="Logo" />
        <span className="openui-shell-mobile-header-agent-name">{agentName}</span>
      </div>
      <div className="openui-shell-mobile-header-actions">
        {rightChildren}
        <IconButton
          size="medium"
          icon={<Plus size="1em" />}
          onClick={switchToNewThread}
          variant="secondary"
          aria-label="New chat"
        />
      </div>
    </div>
  );
};
