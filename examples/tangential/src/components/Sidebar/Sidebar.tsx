"use client";

import {
  ChevronDown,
  Inbox,
  Layers,
  LayoutGrid,
  ListTodo,
  MoreHorizontal,
  Orbit,
  PanelsTopLeft,
  Target,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
};

const primaryItems: NavItem[] = [
  { href: "/issues", label: "Inbox", icon: Inbox, badge: "99+" },
  { href: "/issues?mine=1", label: "My Issues", icon: ListTodo },
];

const workspaceItems: NavItem[] = [
  { href: "/issues?scope=initiatives", label: "Initiatives", icon: Target },
  { href: "/issues?scope=projects", label: "Projects", icon: Layers },
  { href: "/issues?scope=views", label: "Views", icon: LayoutGrid },
  { href: "/issues?scope=more", label: "More", icon: MoreHorizontal },
];

const teamItems: NavItem[] = [
  { href: "/issues", label: "Issues", icon: Orbit },
  { href: "/issues?scope=cycles", label: "Cycles", icon: Timer },
  { href: "/issues?scope=team-views", label: "Views", icon: PanelsTopLeft },
  { href: "/issues?scope=team-projects", label: "Projects", icon: Layers },
];

const Row = ({ item }: { item: NavItem }) => {
  const pathname = usePathname();
  const Icon = item.icon;
  const active =
    pathname === item.href || (item.href === "/issues" && pathname.startsWith("/issues"));

  return (
    <Link
      href={item.href}
      className={[
        "flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors",
        active
          ? "bg-[var(--hover)] text-white"
          : "text-[var(--muted)] hover:bg-[var(--hover)] hover:text-white",
      ].join(" ")}
    >
      <span className="flex items-center gap-2">
        <Icon className="size-3.5" />
        {item.label}
      </span>
      {item.badge ? <span className="text-xs text-[var(--muted)]">{item.badge}</span> : null}
    </Link>
  );
};

const Section = ({ title, items }: { title: string; items: NavItem[] }) => {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2.5 text-xs uppercase tracking-wide text-[var(--muted)]">
        <span>{title}</span>
        <ChevronDown className="size-3.5" />
      </div>
      <div className="space-y-0.5">
        {items.map((item) => (
          <Row key={item.href} item={item} />
        ))}
      </div>
    </div>
  );
};

export const Sidebar = () => {
  return (
    <aside className="hidden h-screen w-64 flex-col border-r border-[var(--border)] bg-[var(--panel)] px-3 py-3 lg:flex">
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-[#5e6ad2] text-center text-xs leading-6 font-semibold text-white">
            T
          </div>
          <div className="text-sm font-medium">Tangential</div>
        </div>
        <span className="rounded bg-[var(--hover)] px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
          v1
        </span>
      </div>

      <div className="space-y-5 overflow-y-auto pb-6">
        <div className="space-y-0.5">
          {primaryItems.map((item) => (
            <Row key={item.href} item={item} />
          ))}
        </div>
        <Section title="Workspace" items={workspaceItems} />
        <Section title="Your teams" items={teamItems} />
      </div>
    </aside>
  );
};
