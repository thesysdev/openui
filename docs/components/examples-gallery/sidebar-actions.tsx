import { siteConfig } from "@/lib/layout.shared";
import { MessageCircle, Plus, Rocket } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import styles from "./examples-gallery.module.css";

type SidebarAction = {
  title: string;
  description: string;
  href: string;
  external?: boolean;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const SIDEBAR_ACTIONS: SidebarAction[] = [
  {
    title: "Start from scratch",
    description: "Scaffold a blank app",
    href: "/docs/getting-started",
    icon: Rocket,
  },
  {
    title: "Submit your project",
    description: "Get listed on this page",
    href: "https://github.com/thesysdev/openui/issues",
    external: true,
    icon: Plus,
  },
  {
    title: "Ask on Discord",
    description: "Get help with an example",
    href: siteConfig.discordUrl,
    external: true,
    icon: MessageCircle,
  },
];

/** Next steps pinned to the bottom of the Examples sidebar, which is otherwise short. */
export function ExamplesSidebarActions() {
  return (
    <nav className={styles.sidebarActions} aria-label="Next steps">
      {SIDEBAR_ACTIONS.map(({ title, description, href, external, icon: Icon }) => {
        const content = (
          <>
            <span className={styles.sidebarActionIcon}>
              <Icon aria-hidden />
            </span>
            <span className={styles.sidebarActionText}>
              <span className={styles.sidebarActionTitle}>{title}</span>
              <span className={styles.sidebarActionDescription}>{description}</span>
            </span>
          </>
        );

        return external ? (
          <a
            key={title}
            className={styles.sidebarAction}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {content}
          </a>
        ) : (
          <Link key={title} className={styles.sidebarAction} href={href}>
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
