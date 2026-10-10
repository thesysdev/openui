"use client";

import { DocsNavbar } from "@/components/docs-navbar";
import { DocsSidebarActions } from "@/components/docs-sidebar-actions";
import {
  GLOBAL_DOCS_TREE,
  NESTED_DOCS_SECTIONS,
  getGlobalActiveItemUrl,
  getNestedDocsTree,
  getNestedRootForEntryUrl,
  getSidebarModeForPathname,
  getTabTree,
  type NestedDocsRoot,
  type SidebarModeOverride,
} from "@/lib/docs-navigation";
import { baseOptions } from "@/lib/layout.shared";
import type * as PageTree from "fumadocs-core/page-tree";
import { SidebarItem, useSidebar } from "fumadocs-ui/components/sidebar/base";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type DocsNavigationContextValue = {
  enterNested: (root: NestedDocsRoot) => void;
  showGlobal: () => void;
};

const DocsNavigationContext = createContext<DocsNavigationContextValue | null>(null);

function useDocsNavigation() {
  const value = useContext(DocsNavigationContext);
  if (!value) throw new Error("Docs navigation must be rendered inside DocsRouteLayout.");
  return value;
}

function GlobalSidebarItem({ item }: { item: PageTree.Item }) {
  const pathname = usePathname();
  const { enterNested } = useDocsNavigation();
  const nestedRoot = getNestedRootForEntryUrl(item.url);
  const active = (getGlobalActiveItemUrl(pathname) ?? pathname) === item.url;

  return (
    <SidebarItem
      href={item.url}
      external={item.external}
      active={active}
      icon={item.icon}
      className="relative flex flex-row items-center gap-2 rounded-lg p-2 text-start text-fd-muted-foreground wrap-anywhere transition-colors hover:bg-fd-accent/50 hover:text-fd-accent-foreground data-[active=true]:bg-fd-primary/10 data-[active=true]:text-fd-primary"
      onClick={nestedRoot ? () => enterNested(nestedRoot) : undefined}
    >
      <span className="min-w-0 flex-1">{item.name}</span>
      {nestedRoot ? <ChevronRight aria-hidden className="ms-auto" size={18} /> : null}
    </SidebarItem>
  );
}

function isOtherSectionEntry(url: string, root: NestedDocsRoot): boolean {
  const target = getNestedRootForEntryUrl(url);
  return target !== undefined && target !== root;
}

// Inside a nested sidebar, links into another nested section get the same chevron as global entries.
function withSectionChevrons(tree: PageTree.Root, root: NestedDocsRoot): PageTree.Root {
  return {
    ...tree,
    children: tree.children.map((node) =>
      node.type === "page" && isOtherSectionEntry(node.url, root)
        ? {
            ...node,
            name: (
              <span className="flex flex-1 items-center gap-2">
                <span className="min-w-0 flex-1">{node.name}</span>
                <ChevronRight aria-hidden className="ms-auto" size={16} />
              </span>
            ),
          }
        : node,
    ),
  };
}

function NestedSidebarHeader({ root }: { root: NestedDocsRoot }) {
  const { enterNested, showGlobal } = useDocsNavigation();
  const { setOpen } = useSidebar();
  const parent = NESTED_DOCS_SECTIONS[root].parent;

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        className="flex items-center gap-2 rounded-lg p-2 text-sm text-fd-muted-foreground transition-colors hover:bg-fd-accent/50 hover:text-fd-accent-foreground"
        onClick={() => {
          if (parent) {
            enterNested(parent);
            return;
          }
          showGlobal();
          setOpen(false);
        }}
      >
        <ChevronLeft aria-hidden className="size-4" />
        {parent ? NESTED_DOCS_SECTIONS[parent].title : "All docs"}
      </button>
      <p className="px-2 text-sm font-semibold text-fd-foreground">
        {NESTED_DOCS_SECTIONS[root].title}
      </p>
    </div>
  );
}

type DocsRouteLayoutProps = {
  tree: React.ComponentProps<typeof DocsLayout>["tree"];
  /** URLs of pages with `sidebar: false` in their frontmatter. */
  noSidebarUrls: string[];
  children: ReactNode;
};

export function DocsRouteLayout({ tree, noSidebarUrls, children }: DocsRouteLayoutProps) {
  const pathname = usePathname();
  const [sidebarOverride, setSidebarOverride] = useState<SidebarModeOverride>();
  const sidebarMode = getSidebarModeForPathname(pathname, sidebarOverride);

  const enterNested = useCallback(
    (root: NestedDocsRoot) => {
      setSidebarOverride({ pathname, mode: { kind: "nested", root } });
    },
    [pathname],
  );
  const showGlobal = useCallback(() => {
    setSidebarOverride({ pathname, mode: { kind: "global" } });
  }, [pathname]);
  const navigationContext = useMemo(() => ({ enterNested, showGlobal }), [enterNested, showGlobal]);

  const nestedRoot = sidebarMode.kind === "nested" ? sidebarMode.root : undefined;
  const hasSidebar = !noSidebarUrls.includes(pathname);
  const tabFolder =
    sidebarMode.kind === "global" || sidebarMode.kind === "nested" ? undefined : sidebarMode.kind;
  const activeTree = useMemo(() => {
    if (tabFolder) return getTabTree(tree, tabFolder);
    return nestedRoot
      ? withSectionChevrons(getNestedDocsTree(tree, nestedRoot), nestedRoot)
      : GLOBAL_DOCS_TREE;
  }, [tabFolder, nestedRoot, tree]);

  return (
    <DocsNavigationContext.Provider value={navigationContext}>
      <DocsLayout
        tree={activeTree}
        {...baseOptions()}
        nav={{ component: <DocsNavbar showSidebarTrigger={hasSidebar} /> }}
        sidebar={{
          enabled: hasSidebar,
          tabs: false,
          collapsible: false,
          className:
            nestedRoot === "build-agents"
              ? "[&_button[aria-expanded]]:!text-fd-foreground [&_button[aria-expanded]+div]:mb-4"
              : undefined,
          banner: nestedRoot ? <NestedSidebarHeader root={nestedRoot} /> : undefined,
          footer: <DocsSidebarActions />,
          components: sidebarMode.kind === "global" ? { Item: GlobalSidebarItem } : undefined,
        }}
        searchToggle={{ enabled: false }}
        themeSwitch={{ enabled: false }}
      >
        {children}
      </DocsLayout>
    </DocsNavigationContext.Provider>
  );
}
