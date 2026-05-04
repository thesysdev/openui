import { useThreadList } from "@openuidev/react-headless";
import clsx from "clsx";
import { SquarePen } from "lucide-react";
import { useLayoutContext } from "../../context/LayoutContext";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { useShellStore } from "../_shared/store";
import { useOptionalSidebarVisualState } from "./Sidebar";

export const NewChatButton = ({ className }: { className?: string }) => {
  const switchToNewThread = useThreadList((s) => s.switchToNewThread);
  const { isSidebarOpen } = useShellStore((state) => ({
    isSidebarOpen: state.isSidebarOpen,
  }));
  const { layout } = useLayoutContext();
  const sidebarVisualState = useOptionalSidebarVisualState();
  const showExpandedButton = sidebarVisualState
    ? sidebarVisualState.visualState === "expanded"
    : isSidebarOpen;
  const isMobile = layout === "mobile";

  if (!showExpandedButton) {
    return (
      <IconButton
        icon={<SquarePen size="1em" />}
        onClick={switchToNewThread}
        variant="secondary"
        size={isMobile ? "medium" : "small"}
        className={clsx("openui-shell-new-chat-button_collapsed", className)}
      />
    );
  }

  return (
    <Button
      className={clsx("openui-shell-new-chat-button", className)}
      iconLeft={<SquarePen />}
      variant="secondary"
      size={isMobile ? "medium" : "small"}
      onClick={switchToNewThread}
    >
      New Chat
    </Button>
  );
};
