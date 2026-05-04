import { useThreadList } from "@openuidev/react-headless";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import { EllipsisVerticalIcon, MenuIcon, Trash2Icon } from "lucide-react";
import { useEffect } from "react";
import { Button } from "../Button";
import { IconButton } from "../IconButton";

const ThreadItem = ({
  title,
  isSelected,
  onSelect,
  onDelete,
}: {
  title: string;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) => {
  return (
    <div
      className={clsx("openui-copilot-shell-thread-item", {
        "openui-copilot-shell-thread-item--selected": isSelected,
      })}
    >
      <button className="openui-copilot-shell-thread-item-title" onClick={onSelect}>
        {title}
      </button>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <IconButton
            icon={<EllipsisVerticalIcon size="1em" />}
            aria-label={`More actions for ${title}`}
            variant="tertiary"
            size="extra-small"
            className="openui-copilot-shell-thread-item-menu-trigger"
          />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="openui-copilot-shell-thread-item-menu"
            side="right"
            align="start"
            sideOffset={4}
          >
            <DropdownMenu.Item
              asChild
              onSelect={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Button
                type="button"
                variant="tertiary"
                buttonType="destructive"
                size="small"
                iconLeft={<Trash2Icon size={14} />}
                className="openui-copilot-shell-thread-item-menu-action"
              >
                Delete
              </Button>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};

export const ThreadListContainer = () => {
  const threads = useThreadList((s) => s.threads);
  const selectedThreadId = useThreadList((s) => s.selectedThreadId);
  const loadThreads = useThreadList((s) => s.loadThreads);
  const selectThread = useThreadList((s) => s.selectThread);
  const deleteThread = useThreadList((s) => s.deleteThread);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <IconButton
          icon={<MenuIcon size="1em" />}
          variant="tertiary"
          aria-label="Thread list"
          className="openui-copilot-shell-thread-list-trigger"
        />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="openui-copilot-shell-thread-list-dropdown"
          side="bottom"
          align="end"
          sideOffset={8}
        >
          <div className="openui-copilot-shell-thread-list-header">All threads</div>
          <div className="openui-copilot-shell-thread-list-items">
            {threads.map((thread) => (
              <ThreadItem
                key={thread.id}
                title={thread.title}
                isSelected={selectedThreadId === thread.id}
                onSelect={() => selectThread(thread.id)}
                onDelete={() => deleteThread(thread.id)}
              />
            ))}
            {threads.length === 0 && (
              <div className="openui-copilot-shell-thread-list-empty">No threads yet</div>
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
