"use client";
import { ChatModal } from "@/components/overview-components/chat-modal";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export const TryItOut = () => {
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  return (
    <div
      className="group mb-6 cursor-pointer overflow-hidden rounded-xl border-2 border-slate-200 transition-all hover:border-blue-400 hover:shadow-lg dark:border-slate-700 dark:hover:border-blue-500"
      onClick={() => setIsChatModalOpen(true)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && setIsChatModalOpen(true)}
    >
      <div className="relative">
        <Image
          src="/images/openui-lang/compare.png"
          alt="OpenUI Chat Demo - Click to try it live"
          width={1200}
          height={675}
          className="w-full m-0!"
        />
        <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/5" />
      </div>
      <div className="flex items-start justify-between border-t border-slate-200 px-5 py-4 dark:border-slate-700">
        <div>
          <h3 className="text-lg font-semibold m-0!">Try it out live</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Live interactive demo of OpenUI Chat in action
          </p>
        </div>
        <ArrowUpRight className="mt-1 size-5 shrink-0 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 dark:text-slate-500" />
      </div>
      {isChatModalOpen && <ChatModal onClose={() => setIsChatModalOpen(false)} />}
    </div>
  );
};
