"use client";

import { siteConfig } from "@/lib/layout.shared";
import * as Tooltip from "@radix-ui/react-tooltip";
import { ArrowUpRight, CalendarDays, KeyRound, MessageCircle } from "lucide-react";
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
    label: "API key",
    title: "Get an API key",
    description:
      "Create a key in the Thesys console. OpenUI Cloud, Gateway, and most examples need one.",
    href: "https://console.thesys.dev/keys",
    icon: KeyRound,
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
    title: "Talk to us",
    description:
      "Book a demo with the Thesys team to walk through your use case or a production rollout.",
    href: "https://zcal.co/t/thesys/demo",
    icon: CalendarDays,
  },
];

function hostname(href: string) {
  return new URL(href).hostname.replace(/^www\./, "");
}

/** Links pinned to the bottom of every docs sidebar, with details on hover or focus. */
export function DocsSidebarActions() {
  return (
    <Tooltip.Provider delayDuration={150} skipDelayDuration={300}>
      <nav className={styles.sidebarActions} aria-label="Get started and get help">
        {SIDEBAR_ACTIONS.map(({ label, title, description, href, icon: Icon }) => (
          <Tooltip.Root key={label}>
            <Tooltip.Trigger asChild>
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
                  {hostname(href)}
                  <ArrowUpRight aria-hidden />
                </span>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}
      </nav>
    </Tooltip.Provider>
  );
}
