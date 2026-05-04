import type { Thread } from "@openuidev/react-headless";
import { useThreadList } from "@openuidev/react-headless";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import { EllipsisVerticalIcon, Trash2Icon } from "lucide-react";
import { Fragment, useEffect } from "react";
import { useLayoutContext } from "../../context/LayoutContext";
import { useShellStore } from "../_shared/store";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { useTheme } from "../ThemeProvider";

export const ThreadButton = ({
  id,
  title,
  className,
}: {
  id: string;
  title: string;
  className?: string;
}) => {
  const selectThread = useThreadList((s) => s.selectThread);
  const deleteThread = useThreadList((s) => s.deleteThread);
  const selectedThreadId = useThreadList((s) => s.selectedThreadId);
  const { portalThemeClassName } = useTheme();
  const { isSidebarOpen, setIsSidebarOpen } = useShellStore((state) => ({
    isSidebarOpen: state.isSidebarOpen,
    setIsSidebarOpen: state.setIsSidebarOpen,
  }));
  const { layout } = useLayoutContext();

  return (
    <div
      className={clsx(
        "openui-shell-thread-button",
        {
          "openui-shell-thread-button--selected": selectedThreadId === id,
        },
        className,
      )}
    >
      <button
        className="openui-shell-thread-button-title"
        onClick={() => {
          if (layout === "mobile") {
            setIsSidebarOpen(!isSidebarOpen);
          }
          selectThread(id);
        }}
      >
        {title}
      </button>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <IconButton
            icon={<EllipsisVerticalIcon size="1em" />}
            aria-label={`More actions for ${title}`}
            variant="tertiary"
            size={layout === "mobile" ? "small" : "extra-small"}
            className="openui-shell-thread-button-dropdown-trigger"
          />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className={clsx("openui-shell-thread-button-dropdown-menu", portalThemeClassName)}
            side="bottom"
            align="end"
            sideOffset={4}
          >
            <DropdownMenu.Item
              asChild
              onSelect={() => {
                deleteThread(id);
              }}
            >
              <Button
                type="button"
                variant="tertiary"
                buttonType="destructive"
                size="small"
                iconLeft={<Trash2Icon size={14} />}
                className="openui-shell-thread-button-dropdown-menu-item"
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

export const ThreadList = ({ className }: { className?: string }) => {
  const threads = useThreadList((s) => s.threads);
  const loadThreads = useThreadList((s) => s.loadThreads);

  useEffect(() => {
    loadThreads();
  }, []);

  const groupThreads = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);
    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);
    const thisYear = new Date(today);
    thisYear.setMonth(0, 1);

    return threads.reduce(
      (groups, thread) => {
        const threadDate = new Date(thread.createdAt);

        if (threadDate >= today) {
          groups.today = [...(groups.today || []), thread];
        } else if (threadDate >= yesterday) {
          groups.yesterday = [...(groups.yesterday || []), thread];
        } else if (threadDate >= last7Days) {
          groups.last7Days = [...(groups.last7Days || []), thread];
        } else if (threadDate >= last30Days) {
          groups.last30Days = [...(groups.last30Days || []), thread];
        } else if (threadDate >= thisYear) {
          groups.thisYear = [...(groups.thisYear || []), thread];
        } else {
          groups.older = [...(groups.older || []), thread];
        }

        return groups;
      },
      {
        today: [] as Thread[],
        yesterday: [] as Thread[],
        last7Days: [] as Thread[],
        last30Days: [] as Thread[],
        thisYear: [] as Thread[],
        older: [] as Thread[],
      },
    );
  };

  const groupedThreads = groupThreads();
  const groupLabels: { [key in keyof typeof groupedThreads]: string } = {
    today: "Today",
    yesterday: "Yesterday",
    last7Days: "Previous 7 Days",
    last30Days: "Previous 30 Days",
    thisYear: "This Year",
    older: "Older",
  };

  return (
    <div className={clsx("openui-shell-thread-list", className)}>
      {Object.entries(groupedThreads)
        .filter(([_, groupThreads]) => groupThreads.length > 0)
        .map(([group, groupThreads]) => (
          <Fragment key={group}>
            <div className="openui-shell-thread-list-group">
              {groupLabels[group as keyof typeof groupLabels]}
            </div>
            {groupThreads.map((thread) => (
              <ThreadButton key={thread.id} id={thread.id} title={thread.title} />
            ))}
          </Fragment>
        ))}
    </div>
  );
};
