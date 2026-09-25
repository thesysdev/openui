import { useThreadList } from "@openuidev/react-headless";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import { EllipsisIcon, Trash2Icon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLayoutContext } from "../../context/LayoutContext";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { Skeleton } from "../Skeleton";
import { useOptionalNav } from "./_shared/navContext";
import { useAgentInterfaceStore } from "./_shared/store";

const THREAD_SKELETON_WIDTHS = ["78%", "62%", "86%", "70%"];

const ThreadListSkeleton = () => (
  <div
    className="openui-agent-thread-list-skeleton"
    role="status"
    aria-live="polite"
    aria-label="Loading threads"
  >
    <div className="openui-agent-thread-list-skeleton__group" aria-hidden="true">
      <Skeleton height="12px" width="48px" />
    </div>
    {THREAD_SKELETON_WIDTHS.map((width, index) => (
      <div
        key={`${width}-${index}`}
        className="openui-agent-thread-list-skeleton__row"
        aria-hidden="true"
      >
        <Skeleton height="14px" width={width} />
      </div>
    ))}
  </div>
);

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
  const { isSidebarOpen, setIsSidebarOpen } = useAgentInterfaceStore((state) => ({
    isSidebarOpen: state.isSidebarOpen,
    setIsSidebarOpen: state.setIsSidebarOpen,
  }));
  const { layout } = useLayoutContext();
  const nav = useOptionalNav();
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  return (
    <div
      className={clsx(
        "openui-agent-thread-button",
        {
          "openui-agent-thread-button--selected": selectedThreadId === id,
          "openui-agent-thread-button--actions-open": isActionsOpen,
        },
        className,
      )}
    >
      <button
        className="openui-agent-thread-button-title"
        onClick={() => {
          if (layout === "mobile") {
            setIsSidebarOpen(!isSidebarOpen);
          }
          selectThread(id);
          // Auto-clear any active route so the thread view surfaces.
          if (nav && nav.path !== undefined) {
            nav.navigate(undefined);
          }
        }}
      >
        {title}
      </button>
      <DropdownMenu.Root open={isActionsOpen} onOpenChange={setIsActionsOpen}>
        <DropdownMenu.Trigger asChild>
          <IconButton
            className="openui-agent-thread-button-dropdown-trigger"
            icon={<EllipsisIcon size="1em" />}
            size="2-extra-small"
            variant="tertiary"
            aria-label="Thread actions"
          />
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="openui-agent-thread-button-dropdown-menu"
            side="bottom"
            align="start"
            sideOffset={4}
          >
            <DropdownMenu.Item
              asChild
              onSelect={() => {
                deleteThread(id);
              }}
            >
              <Button
                buttonType="destructive"
                className="openui-agent-thread-button-dropdown-menu-item"
                iconLeft={<Trash2Icon size="1em" />}
                size="extra-small"
                variant="tertiary"
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
  const isLoadingThreads = useThreadList((s) => s.isLoadingThreads);
  const loadThreads = useThreadList((s) => s.loadThreads);
  const [hasRequestedThreads, setHasRequestedThreads] = useState(false);
  const [scrollMasks, setScrollMasks] = useState({ top: false, bottom: false });
  const listRef = useRef<HTMLDivElement>(null);

  const updateScrollMasks = useCallback(() => {
    const list = listRef.current;
    if (!list) return;

    const maxScrollTop = list.scrollHeight - list.clientHeight;
    const nextMasks = {
      top: maxScrollTop > 0 && list.scrollTop > 1,
      bottom: maxScrollTop > 0 && list.scrollTop < maxScrollTop - 1,
    };

    setScrollMasks((current) =>
      current.top === nextMasks.top && current.bottom === nextMasks.bottom ? current : nextMasks,
    );
  }, []);

  useEffect(() => {
    setHasRequestedThreads(true);
    loadThreads();
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    updateScrollMasks();

    const resizeObserver = new ResizeObserver(updateScrollMasks);
    resizeObserver.observe(list);
    const mutationObserver = new MutationObserver(updateScrollMasks);
    mutationObserver.observe(list, { childList: true, subtree: true });
    list.addEventListener("scroll", updateScrollMasks, { passive: true });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      list.removeEventListener("scroll", updateScrollMasks);
    };
  }, [updateScrollMasks]);

  const showSkeleton = !hasRequestedThreads || isLoadingThreads;

  return (
    <div
      ref={listRef}
      className={clsx(
        "openui-agent-thread-list",
        {
          "openui-agent-thread-list--mask-top": scrollMasks.top,
          "openui-agent-thread-list--mask-bottom": scrollMasks.bottom,
        },
        className,
      )}
    >
      {showSkeleton ? (
        <ThreadListSkeleton />
      ) : (
        <div className="openui-agent-thread-list-content">
          {threads.length > 0 && <div className="openui-agent-thread-list-group">Threads</div>}
          {threads.map((thread) => (
            <ThreadButton key={thread.id} id={thread.id} title={thread.title} />
          ))}
        </div>
      )}
    </div>
  );
};
