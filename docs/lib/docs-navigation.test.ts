import type * as PageTree from "fumadocs-core/page-tree";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GLOBAL_DOCS_TREE,
  getDefaultSidebarMode,
  getGlobalActiveItemUrl,
  getNestedDocsTree,
  getNestedRootForEntryUrl,
  getNestedRootForPathname,
  getSidebarModeForPathname,
} from "./docs-navigation";

describe("global docs navigation", () => {
  it("exposes the agreed information architecture", () => {
    const entries = GLOBAL_DOCS_TREE.children.map((node) => ({
      type: node.type,
      name: node.name,
      url: node.type === "page" ? node.url : undefined,
      children: undefined,
    }));

    assert.deepEqual(entries, [
      { type: "separator", name: "Overview", url: undefined, children: undefined },
      { type: "page", name: "Introduction", url: "/docs", children: undefined },
      {
        type: "page",
        name: "Getting Started",
        url: "/docs/getting-started",
        children: undefined,
      },
      {
        type: "page",
        name: "How OpenUI works",
        url: "/docs/architecture",
        children: undefined,
      },
      {
        type: "page",
        name: "OpenUI vs others",
        url: "/docs/openui-lang/comparison",
        children: undefined,
      },
      { type: "page", name: "Coding Agent Setup", url: "/docs/mcp", children: undefined },
      { type: "separator", name: "Build", url: undefined, children: undefined },
      {
        type: "page",
        name: "OpenUI Lang",
        url: "/docs/openui-lang",
        children: undefined,
      },
      {
        type: "page",
        name: "Build Agents",
        url: "/docs/build-agents",
        children: undefined,
      },
      { type: "separator", name: "Production", url: undefined, children: undefined },
      { type: "page", name: "Gateway", url: "/docs/gateway", children: undefined },
      {
        type: "page",
        name: "Observability",
        url: "/docs/observability",
        children: undefined,
      },
      { type: "separator", name: "Reference", url: undefined, children: undefined },
      {
        type: "page",
        name: "API Reference",
        url: "/docs/api-reference",
        children: undefined,
      },
    ]);
  });

  it("treats nested roots as navigation sections rather than products", () => {
    assert.equal(getNestedRootForEntryUrl("/docs/openui-lang"), "openui-lang");
    assert.equal(getNestedRootForEntryUrl("/docs/build-agents"), "build-agents");
    assert.equal(getNestedRootForEntryUrl("/docs/agent/getting-started/introduction"), undefined);
    assert.equal(getNestedRootForEntryUrl("/docs/gateway"), "gateway");
    assert.equal(getNestedRootForEntryUrl("/docs/observability"), "observability");
    assert.equal(getNestedRootForEntryUrl("/docs/api-reference"), "api-reference");
    assert.equal(getNestedRootForEntryUrl("/docs/openui-lang/quickstart"), undefined);
  });

  it("uses a nested sidebar for direct links into a nested section", () => {
    assert.deepEqual(getDefaultSidebarMode("/docs"), { kind: "global" });
    assert.deepEqual(getDefaultSidebarMode("/docs/overview"), { kind: "global" });
    assert.deepEqual(getDefaultSidebarMode("/docs/getting-started"), { kind: "global" });
    assert.deepEqual(getDefaultSidebarMode("/docs/openui-lang/comparison"), { kind: "global" });
    assert.deepEqual(getDefaultSidebarMode("/docs/openui-lang/quickstart"), {
      kind: "nested",
      root: "openui-lang",
    });
    assert.deepEqual(getDefaultSidebarMode("/docs/agent/core-concepts/tools"), {
      kind: "nested",
      root: "build-agents",
    });
    assert.deepEqual(getDefaultSidebarMode("/docs/build-agents/assistant-ui"), {
      kind: "nested",
      root: "build-agents",
    });
    assert.deepEqual(
      getDefaultSidebarMode("/docs/agent/agent-runtimes/vercel-ai-sdk"),
      { kind: "nested", root: "build-agents" },
    );
    assert.deepEqual(getDefaultSidebarMode("/docs/api-reference/cli"), {
      kind: "nested",
      root: "api-reference",
    });
    assert.deepEqual(getDefaultSidebarMode("/docs/gateway/reliability/error-correction"), {
      kind: "nested",
      root: "gateway",
    });
    assert.deepEqual(getDefaultSidebarMode("/docs/observability/installation"), {
      kind: "nested",
      root: "observability",
    });
    assert.deepEqual(getDefaultSidebarMode("/docs/mcp"), { kind: "global" });
  });

  it("shows the destination section after client-side navigation", () => {
    const globalOverride = {
      pathname: "/docs",
      mode: { kind: "global" } as const,
    };

    assert.deepEqual(getSidebarModeForPathname("/docs/openui-lang/renderer", globalOverride), {
      kind: "nested",
      root: "openui-lang",
    });
    assert.deepEqual(getSidebarModeForPathname("/docs", globalOverride), { kind: "global" });

    const nestedPathname = "/docs/openui-lang/renderer";
    const showGlobalOverride = {
      pathname: nestedPathname,
      mode: { kind: "global" } as const,
    };

    assert.deepEqual(getSidebarModeForPathname(nestedPathname, showGlobalOverride), {
      kind: "global",
    });
    assert.deepEqual(getSidebarModeForPathname("/docs/gateway", showGlobalOverride), {
      kind: "nested",
      root: "gateway",
    });
  });

  it("promotes overview pages while grouping product pages under their roots", () => {
    assert.equal(getGlobalActiveItemUrl("/docs/getting-started"), "/docs/getting-started");
    assert.equal(
      getGlobalActiveItemUrl("/docs/openui-lang/comparison"),
      "/docs/openui-lang/comparison",
    );
    assert.equal(getGlobalActiveItemUrl("/docs/openui-lang/quickstart"), "/docs/openui-lang");
    assert.equal(getGlobalActiveItemUrl("/docs/openui-lang/renderer"), "/docs/openui-lang");
    assert.equal(
      getGlobalActiveItemUrl("/docs/agent/core-concepts/tools"),
      "/docs/build-agents",
    );
    assert.equal(getGlobalActiveItemUrl("/docs/build-agents/copilotkit"), "/docs/build-agents");
    assert.equal(getGlobalActiveItemUrl("/docs/gateway/api/responses"), "/docs/gateway");
    assert.equal(getGlobalActiveItemUrl("/docs/observability/dashboard"), "/docs/observability");
  });
});

describe("nested docs navigation", () => {
  const fullTree: PageTree.Root = {
    name: "OpenUI",
    children: [
      {
        type: "folder",
        name: "OpenUI Lang",
        root: true,
        $ref: { folder: "openui-lang" },
        children: [
          { type: "page", name: "Introduction", url: "/docs/openui-lang" },
          { type: "page", name: "Quick Start", url: "/docs/openui-lang/quickstart" },
        ],
      },
      {
        type: "folder",
        name: "API Reference",
        root: true,
        $ref: { folder: "api-reference" },
        children: [{ type: "page", name: "Overview", url: "/docs/api-reference" }],
      },
      {
        type: "folder",
        name: "Build Agents",
        root: true,
        $ref: { folder: "build-agents" },
        children: [
          { type: "page", name: "Overview", url: "/docs/build-agents" },
          { type: "page", name: "Backend Setup", url: "/docs/build-agents/backend-setup" },
          { type: "separator", name: "Chat UIs" },
          { type: "page", name: "assistant-ui", url: "/docs/build-agents/assistant-ui" },
        ],
      },
      {
        type: "folder",
        name: "Agent Interface",
        $ref: { folder: "agent" },
        children: [
          { type: "separator", name: "Getting Started" },
          {
            type: "page",
            name: "Introduction",
            url: "/docs/agent/getting-started/introduction",
          },
          { type: "separator", name: "Core Concepts" },
          { type: "page", name: "Artifacts", url: "/docs/agent/core-concepts/artifacts" },
          { type: "separator", name: "Guides" },
          { type: "page", name: "Custom artifacts", url: "/docs/agent/guides/custom-artifacts" },
          { type: "separator", name: "Reference" },
          { type: "page", name: "Props", url: "/docs/agent/reference/agentinterface-props" },
          { type: "separator", name: "Examples" },
          { type: "page", name: "Vercel AI SDK", url: "/docs/agent/agent-runtimes/vercel-ai-sdk" },
        ],
      },
    ],
  };

  it("extracts a maintained nested tree from the Fumadocs tree", () => {
    assert.deepEqual(getNestedDocsTree(fullTree, "openui-lang"), {
      type: "root",
      $id: "docs:nested:openui-lang",
      name: "OpenUI Lang",
      children: [
        { type: "page", name: "Introduction", url: "/docs/openui-lang" },
        { type: "page", name: "Quick Start", url: "/docs/openui-lang/quickstart" },
      ],
    });
  });

  it("combines Agent Interface and existing chat integrations under Build Agents", () => {
    assert.deepEqual(getNestedDocsTree(fullTree, "build-agents"), {
      type: "root",
      $id: "docs:nested:build-agents",
      name: "Build Agents",
      children: [
        { type: "page", name: "Overview", url: "/docs/build-agents" },
        { type: "page", name: "Backend Setup", url: "/docs/build-agents/backend-setup" },
        {
          type: "folder",
          name: "Agent Interface",
          defaultOpen: true,
          children: [
            {
              type: "page",
              name: "Introduction",
              url: "/docs/agent/getting-started/introduction",
            },
            { type: "separator", name: "Core Concepts" },
            { type: "page", name: "Artifacts", url: "/docs/agent/core-concepts/artifacts" },
            { type: "separator", name: "Guides" },
            {
              type: "page",
              name: "Custom artifacts",
              url: "/docs/agent/guides/custom-artifacts",
            },
            { type: "separator", name: "Reference" },
            {
              type: "page",
              name: "Props",
              url: "/docs/agent/reference/agentinterface-props",
            },
          ],
        },
        {
          type: "folder",
          name: "Existing Chat UIs",
          defaultOpen: true,
          children: [
            { type: "page", name: "assistant-ui", url: "/docs/build-agents/assistant-ui" },
          ],
        },
        {
          type: "folder",
          name: "Agent Runtime Examples",
          defaultOpen: true,
          children: [
            {
              type: "page",
              name: "Vercel AI SDK",
              url: "/docs/agent/agent-runtimes/vercel-ai-sdk",
            },
          ],
        },
      ],
    });
  });

  it("maps any page within a nested section to its root", () => {
    assert.equal(getNestedRootForPathname("/docs/openui-lang/renderer"), "openui-lang");
    assert.equal(getNestedRootForPathname("/docs/api-reference"), "api-reference");
    assert.equal(
      getNestedRootForPathname("/docs/agent/customize/sidebar"),
      "build-agents",
    );
    assert.equal(getNestedRootForPathname("/docs/build-agents/custom-chat-ui"), "build-agents");
    assert.equal(getNestedRootForPathname("/docs"), undefined);
  });

  it("fails clearly when the requested nested root is absent", () => {
    assert.throws(
      () => getNestedDocsTree(fullTree, "gateway"),
      /Nested docs root "gateway" was not found/,
    );
  });
});
