"use client";

import dashboardImg from "@/public/images/home/d67b5e94653944c1d0d4998c6b169c37f98060ad.png";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { CopyIcon } from "./shared";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CARD_SHADOW = "0px 8px 16px -4px rgba(22,34,51,0.08)";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionTitle() {
  return (
    <p className="font-['Inter',sans-serif] font-semibold text-[22px] lg:text-4xl text-black leading-[1.25] max-w-[430px]">
      Build an AI chat in minutes
    </p>
  );
}

function SectionDescription() {
  return (
    <div className="max-w-[357px]">
      <p className="font-['Inter_Display',sans-serif] text-lg text-black/40 leading-[1.4]">
        This scaffolds a Reference chat interface with a beautiful Component library and a fully
        functional OpenUI lang and Renderer.
      </p>
    </div>
  );
}

function CtaButton() {
  const [copied, setCopied] = useState(false);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const handleClick = async () => {
    if (copied) return;

    try {
      await navigator.clipboard.writeText("npx @openuidev/cli@latest create");
      setCopied(true);
      resetTimeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex items-center justify-center lg:justify-start mt-6 lg:mt-0 pt-4">
      <button
        onClick={handleClick}
        className="bg-black rounded-full h-12 px-5 flex items-center gap-2.5 cursor-pointer relative transition-all duration-200 hover:scale-105 w-full max-w-[280px] lg:max-w-none lg:w-auto justify-center lg:justify-start"
      >
        <span className="relative size-4 flex items-center justify-center">
          <span
            className={`absolute transition-all duration-300 ${copied ? "opacity-0 scale-50" : "opacity-100 scale-100"}`}
          >
            <CopyIcon />
          </span>
          <svg
            className={`size-4 absolute transition-all duration-300 ${copied ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
            fill="none"
            viewBox="0 0 14 14"
          >
            <path
              d="M11.6667 3.5L5.25 9.91667L2.33334 7"
              stroke="white"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        </span>
        <span className="font-['Inter_Display',sans-serif] font-medium text-[18px] leading-6 text-white relative whitespace-nowrap">
          npx @openuidev/cli@latest create
        </span>
      </button>
    </div>
  );
}

function DashboardIllustration() {
  return (
    <Image
      src={dashboardImg}
      alt="AI chat dashboard illustration"
      className="w-full h-auto rounded-xl object-contain"
      placeholder="blur"
    />
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BuildChatSection() {
  return (
    <div className="w-full px-5 lg:px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="bg-white rounded-[16px] relative overflow-hidden">
          {/* Border + shadow overlay */}
          <div
            aria-hidden="true"
            className="absolute border border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[16px]"
            style={{ boxShadow: CARD_SHADOW }}
          />

          <div className="flex flex-col lg:flex-row p-6 gap-6 lg:gap-0">
            {/* Left: text content */}
            <div className="flex flex-col flex-1 justify-between min-h-[240px] lg:min-h-0">
              <div className="flex flex-col gap-3">
                <SectionTitle />
                <SectionDescription />
              </div>
              <CtaButton />
            </div>

            {/* Right: illustration */}
            <div className="w-full lg:w-[600px] shrink-0">
              <DashboardIllustration />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
