"use client";

import { siteConfig } from "@/lib/layout.shared";
import * as Tooltip from "@radix-ui/react-tooltip";
import { ArrowRight, ArrowUpRight, Bot, LifeBuoy, MessageCircle } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import styles from "./docs-sidebar-actions.module.css";

type SidebarAction = {
  label: string;
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ "aria-hidden"?: boolean }>;
};

const SIDEBAR_ACTIONS: SidebarAction[] = [
  {
    label: "AI setup",
    title: "Coding agent setup",
    description:
      "Connect the OpenUI docs to your coding agent through MCP, the agent skill, or LLM-friendly formats.",
    href: "/docs/mcp",
    icon: Bot,
  },
  {
    label: "Discord",
    title: "Ask on Discord",
    description: "Get help from the OpenUI team and community, and share what you're building.",
    href: siteConfig.discordUrl,
    icon: MessageCircle,
  },
  {
    label: "Talk to us",
    title: "Stuck? Talk to us",
    description:
      "Tell us what's blocking you or what we should improve, and we'll help you on a call.",
    href: "https://zcal.co/t/thesys/demo",
    icon: LifeBuoy,
  },
];

function isExternal(href: string) {
  return href.startsWith("https://");
}

function destination(href: string) {
  return isExternal(href) ? new URL(href).hostname.replace(/^www\./, "") : href;
}

/** Links pinned to the bottom of every docs sidebar, with details on hover or focus. */
export function DocsSidebarActions() {
  return (
    <Tooltip.Provider delayDuration={150} skipDelayDuration={300} disableHoverableContent>
      <nav className={styles.sidebarActions} aria-label="Get started and get help">
        {SIDEBAR_ACTIONS.map(({ label, title, description, href, icon: Icon }) => (
          <Tooltip.Root key={label}>
            <Tooltip.Trigger asChild>
              {isExternal(href) ? (
                <a
                  className={styles.sidebarAction}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={title}
                >
                  <Icon aria-hidden />
                  <span className={styles.sidebarActionLabel}>{label}</span>
                </a>
              ) : (
                <Link className={styles.sidebarAction} href={href} aria-label={title}>
                  <Icon aria-hidden />
                  <span className={styles.sidebarActionLabel}>{label}</span>
                </Link>
              )}
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="top"
                sideOffset={8}
                collisionPadding={12}
                className={styles.detailCard}
              >
                <span className={styles.detailTitle}>
                  <Icon aria-hidden />
                  {title}
                </span>
                <span className={styles.detailDescription}>{description}</span>
                <span className={styles.detailHost}>
                  {destination(href)}
                  {isExternal(href) ? <ArrowUpRight aria-hidden /> : <ArrowRight aria-hidden />}
                </span>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}
      </nav>
    </Tooltip.Provider>
  );
}
