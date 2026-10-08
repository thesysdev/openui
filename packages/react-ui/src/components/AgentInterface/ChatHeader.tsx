import { useThreadList } from "@openuidev/react-headless";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import { EllipsisIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { IconButton } from "../IconButton";
import { RenameChatDialog } from "./RenameChatDialog";
import { WorkspaceToggleButton } from "./Thread";

export interface ChatHeaderProps {
  /** Content pinned to the leading edge (e.g. a model switcher). */
  start?: ReactNode;
  /** Content centred in the header; defaults to the selected chat's title. */
  center?: ReactNode;
  /** Content pinned to the trailing edge, before the chat actions menu. */
  end?: ReactNode;
  /** Shorthand for `start`. */
  children?: ReactNode;
  /**
   * Show the selected chat's title in the centre (when `center` is unset).
   * @default true
   */
  showChatTitle?: boolean;
  /**
   * Show a trailing "…" menu with chat actions (Rename, Delete) for the
   * selected chat.
   * @default true
   */
  showChatActions?: boolean;
  className?: string;
}

const useSelectedThread = () => {
  const selectedThreadId = useThreadList((s) => s.selectedThreadId);
  const threads = useThreadList((s) => s.threads);
  if (!selectedThreadId) return null;
  return threads.find((thread) => thread.id === selectedThreadId) ?? null;
};

const ChatTitle = ({ title }: { title: string }) => (
  <div className="openui-agent-chat-header__title" title={title}>
    <span className="openui-agent-chat-header__title-text">{title}</span>
  </div>
);

const ChatActions = ({ threadId }: { threadId: string }) => {
  const deleteThread = useThreadList((s) => s.deleteThread);
  const [isRenameOpen, setIsRenameOpen] = useState(false);

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <IconButton
            className="openui-agent-chat-header__actions-trigger"
            icon={<EllipsisIcon size="1em" />}
            size="small"
            variant="tertiary"
            aria-label="Chat actions"
          />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="openui-agent-chat-header__actions-menu"
            side="bottom"
            align="end"
            sideOffset={4}
            // Let the rename dialog keep focus instead of returning it here.
            onCloseAutoFocus={(e) => {
              if (isRenameOpen) e.preventDefault();
            }}
          >
            <DropdownMenu.Item
              className="openui-agent-chat-header__actions-item"
              onSelect={() => setIsRenameOpen(true)}
            >
              <PencilIcon size={14} aria-hidden />
              Rename
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="openui-agent-chat-header__actions-item openui-agent-chat-header__actions-item--destructive"
              onSelect={() => deleteThread(threadId)}
            >
              <Trash2Icon size={14} aria-hidden />
              Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <RenameChatDialog threadId={threadId} open={isRenameOpen} onOpenChange={setIsRenameOpen} />
    </>
  );
};

/**
 * Desktop header for the thread card. Its 32px row shares a vertical centre
 * with the sidebar's logo row, and its leading inset matches its top inset,
 * so controls placed here line up with the rail's brand mark. Lays out
 * `start` content on the left, the selected chat's title in the centre, and
 * a trailing chat actions menu. Replaces `ThreadHeader` when used as a slot;
 * hidden on mobile (use `MobileHeader`).
 */
export const ChatHeader = ({
  start,
  center,
  end,
  children,
  showChatTitle = true,
  showChatActions = true,
  className,
}: ChatHeaderProps) => {
  const thread = useSelectedThread();

  return (
    <header className={clsx("openui-agent-chat-header", className)}>
      <div className="openui-agent-chat-header__start">{start ?? children}</div>
      <div className="openui-agent-chat-header__center">
        {center ?? (showChatTitle && thread?.title && <ChatTitle title={thread.title} />)}
      </div>
      <div className="openui-agent-chat-header__end">
        {end}
        <WorkspaceToggleButton />
        {showChatActions && thread && <ChatActions threadId={thread.id} />}
      </div>
    </header>
  );
};

export default ChatHeader;
