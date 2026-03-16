import { Sparkles } from "lucide-react";
import { SidebarToggle } from "./sidebar-toggle";

interface ChatHeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function ChatHeader({ isSidebarOpen, onToggleSidebar }: ChatHeaderProps) {
  return (
    <header className="shrink-0 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
      <div className="flex items-center gap-2">
        <SidebarToggle isOpen={isSidebarOpen} onToggle={onToggleSidebar} />
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <Sparkles size={14} className="text-white" />
        </div>
        <div className="flex flex-col items-start">
        <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Vercel AI Chat</h1>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          Vercel AI SDK + OpenUI Renderer
        </span>
        </div>
      </div>
    </header>
  );
}
