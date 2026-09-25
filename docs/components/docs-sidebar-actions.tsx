import { siteConfig } from "@/lib/layout.shared";
import { CalendarDays, KeyRound, MessageCircle } from "lucide-react";
import type { ComponentType } from "react";
import styles from "./docs-sidebar-actions.module.css";

type SidebarAction = {
  title: string;
  description: string;
  href: string;
  icon: ComponentType<{ "aria-hidden"?: boolean }>;
};

const SIDEBAR_ACTIONS: SidebarAction[] = [
  {
    title: "Get an API key",
    description: "From the Thesys console",
    href: "https://console.thesys.dev/keys",
    icon: KeyRound,
  },
  {
    title: "Ask on Discord",
    description: "Chat with the community",
    href: siteConfig.discordUrl,
    icon: MessageCircle,
  },
  {
    title: "Talk to us",
    description: "Book a demo",
    href: "https://zcal.co/t/thesys/demo",
    icon: CalendarDays,
  },
];

/** Links pinned to the bottom of every docs sidebar. */
export function DocsSidebarActions() {
  return (
    <nav className={styles.sidebarActions} aria-label="Get started and get help">
      {SIDEBAR_ACTIONS.map(({ title, description, href, icon: Icon }) => (
        <a
          key={title}
          className={styles.sidebarAction}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={styles.sidebarActionIcon}>
            <Icon aria-hidden />
          </span>
          <span className={styles.sidebarActionText}>
            <span className={styles.sidebarActionTitle}>{title}</span>
            <span className={styles.sidebarActionDescription}>{description}</span>
          </span>
        </a>
      ))}
    </nav>
  );
}
