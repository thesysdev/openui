import type * as PageTree from "fumadocs-core/page-tree";

export type NestedDocsRoot = "openui-lang" | "build-agents" | "gateway" | "observability" | "api-reference";

export type SidebarMode =
  | { kind: "global" }
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
  gateway: {
    title: "Gateway",
    entryUrl: "/docs/gateway",
    pathPrefix: "/docs/gateway",
    treeFolder: "gateway",
  },
  observability: {
    title: "Observability",
    entryUrl: "/docs/observability",
    pathPrefix: "/docs/observability",
    treeFolder: "observability",
  },
  "api-reference": {
    title: "API Reference",
    entryUrl: "/docs/api-reference",
    pathPrefix: "/docs/api-reference",
    treeFolder: "api-reference",
  },
};

const promotedGlobalUrls = new Set([
  "/docs",
  "/docs/getting-started",
  "/docs/architecture",
  "/docs/openui-lang/comparison",
  "/docs/mcp",
]);

export const GLOBAL_DOCS_TREE: PageTree.Root = {
  type: "root",
  $id: "docs:global",
  name: "OpenUI",
  children: [
    { type: "separator", name: "Overview" },
    { type: "page", name: "Introduction", url: "/docs" },
    { type: "page", name: "Getting Started", url: "/docs/getting-started" },
    {
      type: "page",
      name: "How OpenUI works",
      url: "/docs/architecture",
    },
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
    {
      type: "page",
      name: NESTED_DOCS_SECTIONS.gateway.title,
      url: NESTED_DOCS_SECTIONS.gateway.entryUrl,
    },
    {
      type: "page",
      name: NESTED_DOCS_SECTIONS.observability.title,
      url: NESTED_DOCS_SECTIONS.observability.entryUrl,
    },
    { type: "separator", name: "Reference" },
    {
      type: "page",
      name: NESTED_DOCS_SECTIONS["api-reference"].title,
      url: NESTED_DOCS_SECTIONS["api-reference"].entryUrl,
    },
  ],
};

function isPathWithin(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getNestedRootForEntryUrl(url: string): NestedDocsRoot | undefined {
  return (Object.entries(NESTED_DOCS_SECTIONS) as [NestedDocsRoot, NestedSection][]).find(
    ([, section]) => section.entryUrl === url,
  )?.[0];
}

export function getNestedRootForPathname(pathname: string): NestedDocsRoot | undefined {
  if (isPathWithin(pathname, "/docs/agent")) return "build-agents";

  return (Object.entries(NESTED_DOCS_SECTIONS) as [NestedDocsRoot, NestedSection][])
    .sort(([, a], [, b]) => b.pathPrefix.length - a.pathPrefix.length)
    .find(([, section]) => isPathWithin(pathname, section.pathPrefix))?.[0];
}

export function getDefaultSidebarMode(pathname: string): SidebarMode {
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

  const root = getNestedRootForPathname(pathname);
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

export function getNestedDocsTree(tree: PageTree.Root, root: NestedDocsRoot): PageTree.Root {
  const folder = findNestedFolder(tree.children, NESTED_DOCS_SECTIONS[root].treeFolder);
  if (!folder) throw new Error(`Nested docs root "${root}" was not found in the page tree.`);

  if (root === "build-agents") {
    const agentFolder = findNestedFolder(tree.children, "agent");
    if (!agentFolder) throw new Error('Nested docs folder "agent" was not found in the page tree.');

    const chatUIsIndex = folder.children.findIndex(
      (node) => node.type === "separator" && node.name === "Chat UIs",
    );
    const examplesIndex = agentFolder.children.findIndex(
      (node) => node.type === "separator" && node.name === "Examples",
    );
    if (chatUIsIndex < 0 || examplesIndex < 0) {
      throw new Error("Build Agents navigation groups were not found in the page tree.");
    }

    return {
      type: "root",
      $id: "docs:nested:build-agents",
      name: "Build Agents",
      children: [
        ...folder.children.slice(0, chatUIsIndex),
        {
          type: "folder",
          name: "Agent Interface",
          defaultOpen: true,
          children: agentFolder.children.slice(1, examplesIndex),
        },
        {
          type: "folder",
          name: "Existing Chat UIs",
          defaultOpen: true,
          children: folder.children.slice(chatUIsIndex + 1),
        },
        {
          type: "folder",
          name: "Agent Runtime Examples",
          defaultOpen: true,
          children: agentFolder.children.slice(examplesIndex + 1),
        },
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
