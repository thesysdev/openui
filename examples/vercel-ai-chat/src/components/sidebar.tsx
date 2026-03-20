"use client";

import type { Thread } from "@/lib/thread-store";
import { MessageSquare, Plus, Trash2 } from "lucide-react";

interface SidebarProps {
  threads: Thread[];
  activeThreadId: string;
  isOpen: boolean;
  onNewChat: () => void;
  onSelectThread: (id: string) => void;
  onDeleteThread: (id: string) => void;
  onClose: () => void;
}

function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function groupByDate(threads: Thread[]): { label: string; threads: Thread[] }[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOfLastWeek = startOfToday - 7 * 86400000;

  const today: Thread[] = [];
  const yesterday: Thread[] = [];
  const lastWeek: Thread[] = [];
  const older: Thread[] = [];

  for (const t of threads) {
    if (t.updatedAt >= startOfToday) today.push(t);
    else if (t.updatedAt >= startOfYesterday) yesterday.push(t);
    else if (t.updatedAt >= startOfLastWeek) lastWeek.push(t);
    else older.push(t);
  }

  const groups: { label: string; threads: Thread[] }[] = [];
  if (today.length) groups.push({ label: "Today", threads: today });
  if (yesterday.length) groups.push({ label: "Yesterday", threads: yesterday });
  if (lastWeek.length) groups.push({ label: "Last 7 days", threads: lastWeek });
  if (older.length) groups.push({ label: "Older", threads: older });
  return groups;
}

export function Sidebar({
  threads,
  activeThreadId,
  isOpen,
  onNewChat,
  onSelectThread,
  onDeleteThread,
  onClose,
}: SidebarProps) {
  const groups = groupByDate(threads);

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={onClose} />}

      <aside
        className={`
          fixed z-50 top-0 left-0 h-full
          w-[280px] shrink-0
          bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800
          flex flex-col
          transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Sidebar header */}
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-[7px] rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
          >
            <Plus size={16} />
            New Chat
          </button>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto py-2">
          {groups.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-zinc-400 dark:text-zinc-500">
              No conversations yet
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="flex flex-col gap-1">
                <h3 className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {group.label}
                </h3>
                {group.threads.map((thread) => {
                  const isActive = thread.id === activeThreadId;
                  return (
                    <div
                      key={thread.id}
                      className={`group flex items-start gap-2 mx-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                        isActive
                          ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                      }`}
                      onClick={() => {
                        onSelectThread(thread.id);
                        onClose();
                      }}
                    >
                      <MessageSquare size={14} className="shrink-0 opacity-50 mt-1" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{thread.title}</p>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                          {relativeTime(thread.updatedAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteThread(thread.id);
                        }}
                        className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-opacity text-zinc-400 hover:text-red-500"
                        aria-label="Delete thread"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
