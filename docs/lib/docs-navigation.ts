import type * as PageTree from "fumadocs-core/page-tree";

export type TabFolder = "cookbooks" | "integrations" | "demos" | "api-reference";

export type NestedDocsRoot =
  "openui-lang" | "build-agents" | "agent-interface" | "gateway" | "reliability";

export type SidebarMode =
  | { kind: "global" }
  | { kind: TabFolder }
  | {
      kind: "nested";
      root: NestedDocsRoot;
    };

export type SidebarModeOverride = {
  pathname: string;
  mode: SidebarMode;
};

type NestedSection = {
  title: string;
  entryUrl: string;
  pathPrefix: string;
  treeFolder: string;
  /** The section this one is entered from. Its sidebar's back link returns there instead of to all docs. */
  parent?: NestedDocsRoot;
};

export const NESTED_DOCS_SECTIONS: Record<NestedDocsRoot, NestedSection> = {
  "openui-lang": {
    title: "OpenUI Lang",
    entryUrl: "/docs/openui-lang",
    pathPrefix: "/docs/openui-lang",
    treeFolder: "openui-lang",
  },
  "build-agents": {
    title: "Build Agents",
    entryUrl: "/docs/build-agents",
    pathPrefix: "/docs/build-agents",
    treeFolder: "build-agents",
  },
  "agent-interface": {
    title: "Agent Interface",
    entryUrl: "/docs/agent/getting-started/introduction",
    pathPrefix: "/docs/agent",
    treeFolder: "agent",
    parent: "build-agents",
  },
  gateway: {
    title: "Gateway",
    entryUrl: "/docs/gateway",
    pathPrefix: "/docs/gateway",
    treeFolder: "gateway",
  },
  reliability: {
    title: "Reliability Monitoring",
    entryUrl: "/docs/reliability",
    pathPrefix: "/docs/reliability",
    treeFolder: "reliability",
  },
};

export const API_REFERENCE_URL = "/docs/api-reference";
export const COOKBOOKS_URL = "/cookbooks";
export const INTEGRATIONS_URL = "/docs/integrations";
export const DEMOS_URL = "/demos";

const promotedGlobalUrls = new Set([
  "/docs",
  "/docs/getting-started",
  "/docs/openui-lang/comparison",
  "/docs/mcp",
  "/docs/deploy",
  "/docs/production",
  "/docs/autofix",
]);

export const GLOBAL_DOCS_TREE: PageTree.Root = {
  type: "root",
  $id: "docs:global",
  name: "OpenUI",
  children: [
    { type: "separator", name: "Start" },
    { type: "page", name: "Introduction", url: "/docs" },
    { type: "page", name: "Getting Started", url: "/docs/getting-started" },
    {
      type: "page",
      name: "OpenUI vs others",
      url: "/docs/openui-lang/comparison",
    },
    { type: "page", name: "Coding Agent Setup", url: "/docs/mcp" },
    { type: "separator", name: "Build" },
    {
      type: "page",
      name: NESTED_DOCS_SECTIONS["openui-lang"].title,
      url: NESTED_DOCS_SECTIONS["openui-lang"].entryUrl,
    },
    {
      type: "page",
      name: NESTED_DOCS_SECTIONS["build-agents"].title,
      url: NESTED_DOCS_SECTIONS["build-agents"].entryUrl,
    },
    { type: "separator", name: "Production" },
    { type: "page", name: "Overview", url: "/docs/production" },
    {
      type: "page",
      name: NESTED_DOCS_SECTIONS.gateway.title,
      url: NESTED_DOCS_SECTIONS.gateway.entryUrl,
    },
    { type: "page", name: "Autofix", url: "/docs/autofix" },
    {
      type: "page",
      name: NESTED_DOCS_SECTIONS.reliability.title,
      url: NESTED_DOCS_SECTIONS.reliability.entryUrl,
    },
    { type: "page", name: "Deploy your app", url: "/docs/deploy" },
  ],
};

export function isPathWithin(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getNestedRootForEntryUrl(url: string): NestedDocsRoot | undefined {
  return (Object.entries(NESTED_DOCS_SECTIONS) as [NestedDocsRoot, NestedSection][]).find(
    ([, section]) => section.entryUrl === url,
  )?.[0];
}

export function getNestedRootForPathname(pathname: string): NestedDocsRoot | undefined {
  return (Object.entries(NESTED_DOCS_SECTIONS) as [NestedDocsRoot, NestedSection][])
    .sort(([, a], [, b]) => b.pathPrefix.length - a.pathPrefix.length)
    .find(([, section]) => isPathWithin(pathname, section.pathPrefix))?.[0];
}

export function getDefaultSidebarMode(pathname: string): SidebarMode {
  if (isPathWithin(pathname, COOKBOOKS_URL)) return { kind: "cookbooks" };
  if (isPathWithin(pathname, INTEGRATIONS_URL)) return { kind: "integrations" };
  if (isPathWithin(pathname, DEMOS_URL)) return { kind: "demos" };
  if (isPathWithin(pathname, API_REFERENCE_URL)) return { kind: "api-reference" };

  if (pathname === "/docs/overview" || promotedGlobalUrls.has(pathname)) {
    return { kind: "global" };
  }

  const root = getNestedRootForPathname(pathname);
  return root ? { kind: "nested", root } : { kind: "global" };
}

export function getSidebarModeForPathname(
  pathname: string,
  override?: SidebarModeOverride,
): SidebarMode {
  return override?.pathname === pathname ? override.mode : getDefaultSidebarMode(pathname);
}

export function getGlobalActiveItemUrl(pathname: string): string | undefined {
  if (promotedGlobalUrls.has(pathname)) return pathname;

  let root = getNestedRootForPathname(pathname);
  // A section entered from another one highlights its parent in the global sidebar.
  while (root && NESTED_DOCS_SECTIONS[root].parent) root = NESTED_DOCS_SECTIONS[root].parent;
  return root ? NESTED_DOCS_SECTIONS[root].entryUrl : undefined;
}

function findNestedFolder(nodes: PageTree.Node[], treeFolder: string): PageTree.Folder | undefined {
  for (const node of nodes) {
    if (node.type !== "folder") continue;
    if (node.$ref?.folder === treeFolder) return node;

    const nested = findNestedFolder(node.children, treeFolder);
    if (nested) return nested;
  }

  return undefined;
}

/** The sidebar for a top-level tab (Cookbooks, Integrations, Demos, API Reference) is its content folder. */
export function getTabTree(tree: PageTree.Root, treeFolder: TabFolder): PageTree.Root {
  const folder = findNestedFolder(tree.children, treeFolder);
  if (!folder) throw new Error(`Docs folder "${treeFolder}" was not found in the page tree.`);

  return {
    type: "root",
    $id: `docs:${treeFolder}`,
    name: folder.name,
    children: folder.children,
  };
}

export function getNestedDocsTree(tree: PageTree.Root, root: NestedDocsRoot): PageTree.Root {
  const folder = findNestedFolder(tree.children, NESTED_DOCS_SECTIONS[root].treeFolder);
  if (!folder) throw new Error(`Nested docs root "${root}" was not found in the page tree.`);

  if (root === "build-agents") {
    const chatUIIndex = folder.children.findIndex(
      (node) => node.type === "separator" && node.name === "Chat UI",
    );
    if (chatUIIndex < 0 || folder.children[chatUIIndex + 1]?.type !== "page") {
      throw new Error('Build Agents "Chat UI" group was not found in the page tree.');
    }
    // The Chat UI group opens with its "Choose a chat UI" page.
    const insertIndex = chatUIIndex + 2;
    const agentInterface = NESTED_DOCS_SECTIONS["agent-interface"];

    // Agent Interface is the first chat UI option, right after the page that compares them.
    // It has its own sidebar, so it appears here as an entry into that section.
    return {
      type: "root",
      $id: "docs:nested:build-agents",
      name: "Build Agents",
      children: [
        ...folder.children.slice(0, insertIndex),
        { type: "page", name: agentInterface.title, url: agentInterface.entryUrl },
        ...folder.children.slice(insertIndex),
      ],
    };
  }

  return {
    type: "root",
    $id: `docs:nested:${root}`,
    name: folder.name,
    children: folder.children,
  };
}
