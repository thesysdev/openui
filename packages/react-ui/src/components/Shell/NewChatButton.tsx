import { useThreadList } from "@openuidev/react-headless";
import clsx from "clsx";
import { Plus, SquarePen } from "lucide-react";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { useShellStore } from "../_shared/store";

export const NewChatButton = ({ className }: { className?: string }) => {
  const switchToNewThread = useThreadList((s) => s.switchToNewThread);
  const { isSidebarOpen } = useShellStore((state) => ({
    isSidebarOpen: state.isSidebarOpen,
  }));

  if (!isSidebarOpen) {
    return (
      <IconButton
        icon={<SquarePen size="1em" />}
        onClick={switchToNewThread}
        variant="primary"
        size="small"
        aria-label="New chat"
        className={clsx("openui-shell-new-chat-button_collapsed", className)}
      />
    );
  }

  return (
    <Button
      className={clsx("openui-shell-new-chat-button", className)}
      iconRight={<Plus />}
      variant="primary"
      size="small"
      onClick={switchToNewThread}
    >
      New Chat
    </Button>
  );
};
