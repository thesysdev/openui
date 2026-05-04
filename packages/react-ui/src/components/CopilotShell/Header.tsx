import { useThreadList } from "@openuidev/react-headless";
import clsx from "clsx";
import { SquarePen } from "lucide-react";
import { ReactNode } from "react";
import { IconButton } from "../IconButton";
import { useShellStore } from "../_shared/store";
import { ThreadListContainer } from "./ThreadListContainer";

export const CopilotNewChatButton = () => {
  const switchToNewThread = useThreadList((s) => s.switchToNewThread);

  return (
    <IconButton
      icon={<SquarePen size="1em" />}
      onClick={switchToNewThread}
      variant="tertiary"
      aria-label="New chat"
      className="openui-copilot-shell-header-new-chat-button"
    />
  );
};

interface HeaderProps {
  className?: string;
  /** Custom content to render on the rightmost side of the logo container */
  rightChildren?: ReactNode;
  /** Hide the new chat button */
  hideNewChatButton?: boolean;
  /** Hide the thread list container */
  hideThreadListContainer?: boolean;
}

export const Header = ({
  className,
  rightChildren,
  hideNewChatButton = false,
  hideThreadListContainer = false,
}: HeaderProps) => {
  const { logoUrl, agentName } = useShellStore((state) => ({
    logoUrl: state.logoUrl,
    agentName: state.agentName,
  }));

  const shouldRenderActions = rightChildren || !hideThreadListContainer || !hideNewChatButton;

  return (
    <div className={clsx("openui-copilot-shell-header", className)}>
      <div className="openui-copilot-shell-header-logo-container">
        <img className="openui-copilot-shell-header-logo" src={logoUrl} alt="Logo" />
        <span className="openui-copilot-shell-header-agent-name">{agentName}</span>
      </div>
      {shouldRenderActions && (
        <div className="openui-copilot-shell-header-actions">
          {rightChildren}
          {!hideThreadListContainer && <ThreadListContainer />}
          {!hideNewChatButton && <CopilotNewChatButton />}
        </div>
      )}
    </div>
  );
};
