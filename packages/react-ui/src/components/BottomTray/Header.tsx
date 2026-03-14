import { useThreadList } from "@openuidev/react-headless";
import clsx from "clsx";
import { SquarePen, X } from "lucide-react";
import { ReactNode } from "react";
import { IconButton } from "../IconButton";
import { useShellStore } from "../_shared/store";
import { ThreadListContainer } from "./ThreadListContainer";

export const BottomTrayNewChatButton = () => {
  const switchToNewThread = useThreadList((s) => s.switchToNewThread);

  return (
    <IconButton
      icon={<SquarePen size="1em" />}
      onClick={switchToNewThread}
      variant="tertiary"
      aria-label="New chat"
      className="openui-bottom-tray-header-new-chat-button"
    />
  );
};

interface HeaderProps {
  className?: string;
  /** Custom content to render on the rightmost side of the logo container */
  rightChildren?: ReactNode;
  /** Callback when minimize button is clicked */
  onMinimize?: () => void;
  /** Hide the minimize button */
  hideMinimizeButton?: boolean;
  /** Custom new chat button */
  hideNewChatButton?: boolean;
  /** Hide the thread list container */
  hideThreadListContainer?: boolean;
}

export const Header = ({
  className,
  rightChildren,
  onMinimize,
  hideMinimizeButton = false,
  hideNewChatButton = false,
  hideThreadListContainer = false,
}: HeaderProps) => {
  const { logoUrl, agentName } = useShellStore((state) => ({
    logoUrl: state.logoUrl,
    agentName: state.agentName,
  }));

  return (
    <div className={clsx("openui-bottom-tray-header", className)}>
      <div className="openui-bottom-tray-header-logo-container">
        <img className="openui-bottom-tray-header-logo" src={logoUrl} alt="Logo" />
        <span className="openui-bottom-tray-header-agent-name">{agentName}</span>
      </div>
      <div className="openui-bottom-tray-header-actions">
        {rightChildren}
        {!hideThreadListContainer && <ThreadListContainer />}
        {!hideNewChatButton && <BottomTrayNewChatButton />}
        {!hideMinimizeButton && onMinimize && (
          <IconButton
            icon={<X size="1em" />}
            onClick={onMinimize}
            variant="tertiary"
            aria-label="Minimize chat"
            className="openui-bottom-tray-header-minimize"
          />
        )}
      </div>
    </div>
  );
};
