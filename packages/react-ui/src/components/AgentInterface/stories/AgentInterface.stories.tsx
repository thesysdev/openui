import type { Message } from "@openuidev/react-headless";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  HelpCircle,
  MessageSquare,
  Presentation as PresentationIcon,
  Settings,
  Share,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { makeMockLLM, makeMockStorage, mockSSEResponse } from "../../../__test-helpers/mockChat";
import type { PromptTemplate } from "../../../types/PromptTemplate";
import { Button } from "../../Button";
import { IconButton } from "../../IconButton";
import { AgentInterface } from "../AgentInterface";
import { useNav } from "../_shared/navContext";
import logoUrl from "./thesysdev_logo.jpeg";

function getLastUserContent(messages: Message[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return "";
  return typeof lastUser.content === "string" ? lastUser.content : "";
}

const populatedStorage = makeMockStorage({
  listThreads: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      threads: [
        { id: "1", title: "First chat", createdAt: Date.now() },
        { id: "2", title: "Second chat", createdAt: Date.now() },
        { id: "3", title: "Third chat", createdAt: Date.now() },
      ],
    };
  },
  getMessages: async (threadId) => {
    if (!threadId) return [];
    return [
      { id: crypto.randomUUID(), role: "user", content: "Hello" },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Hi! How can I help today?",
      },
    ] as Message[];
  },
});

const emptyStorage = makeMockStorage({});

const defaultLLM = makeMockLLM({
  send: async () => {
    await new Promise((r) => setTimeout(r, 100));
    return mockSSEResponse("This is a response from the AI assistant.", 1000);
  },
});

const echoLLM = makeMockLLM({
  send: async ({ messages }) => {
    const content = getLastUserContent(messages);
    return mockSSEResponse(`You asked: "${content}"`, 1000);
  },
});

const SAMPLE_STARTERS = [
  {
    displayText: "Help me get started",
    prompt: "Help me get started",
    icon: <Sparkles size={16} />,
  },
  {
    displayText: "What can you do?",
    prompt: "What can you do?",
  },
  {
    displayText: "Tell me about your features",
    prompt: "Tell me about your features",
    icon: <MessageSquare size={16} />,
  },
];

const COMPOSER_STARTERS = [
  ...SAMPLE_STARTERS,
  {
    displayText: "Show me examples",
    prompt: "Show me examples",
    icon: <BookOpen size={16} />,
  },
  {
    displayText: "What's new?",
    prompt: "What's new?",
    icon: <Star size={16} />,
  },
  {
    displayText: "Open settings",
    prompt: "Open settings",
    icon: <Settings size={16} />,
  },
];

const LONG_STARTERS = [
  {
    displayText: "Help me get started with this application and guide me through the features",
    prompt: "Help me get started",
    icon: <Sparkles size={16} />,
  },
  {
    displayText: "What can you do? I'd like to know all your capabilities",
    prompt: "What can you do?",
    icon: <Zap size={16} />,
  },
];

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    displayText: "Create a presentation",
    prompt: "Create a presentation about ",
    icon: <PresentationIcon size={16} />,
    completions: [
      { displayText: "Our Q2 business review", prompt: "our Q2 business review", icon: <></> },
      { displayText: "A product launch plan", prompt: "a product launch plan", icon: <></> },
      {
        displayText: "The future of electric vehicles",
        prompt: "the future of electric vehicles",
        icon: <></>,
      },
    ],
  },
  {
    displayText: "Write a report",
    prompt: "Write a report on ",
    icon: <FileText size={16} />,
    completions: [
      { displayText: "The EV market in 2026", prompt: "the EV market in 2026", icon: <></> },
      {
        displayText: "Our quarterly performance",
        prompt: "our quarterly performance",
        icon: <></>,
      },
      {
        displayText: "Enterprise adoption of AI",
        prompt: "enterprise adoption of AI",
        icon: <></>,
      },
    ],
  },
];

export default {
  title: "Components/AgentInterface",
  tags: ["dev"],
};

/** Bare default — everything renders from AgentInterface's internals. */
export const Default = {
  render: () => (
    <AgentInterface
      storage={populatedStorage}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
    />
  ),
};

/** Override only the composer at top level — sidebar + thread defaults persist. */
export const CustomComposer = {
  render: () => (
    <AgentInterface
      storage={populatedStorage}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
    >
      <AgentInterface.Composer>
        <div style={{ padding: 16, background: "#f0f0f0", borderRadius: 8 }}>
          Custom composer placeholder — replaces the default input.
        </div>
      </AgentInterface.Composer>
    </AgentInterface>
  ),
};

/** Tweak just the sidebar header — Mode B props on SidebarHeader. */
export const CustomSidebarHeader = {
  render: () => (
    <AgentInterface
      storage={populatedStorage}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
    >
      <AgentInterface.SidebarHeader
        logo={<div style={{ fontSize: 24 }}>🚀</div>}
        agentName={<strong style={{ color: "#7c3aed" }}>Custom Brand</strong>}
        collapseButton={false}
      />
    </AgentInterface>
  ),
};

/** Full sidebar override — user composes the inside. */
export const FullSidebarOverride = {
  render: () => (
    <AgentInterface
      storage={populatedStorage}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
    >
      <AgentInterface.Sidebar>
        <AgentInterface.SidebarHeader logo={<div style={{ fontSize: 24 }}>🚀</div>} />
        <div style={{ padding: 12, fontSize: 12, color: "#666" }}>Custom nav section</div>
        <AgentInterface.SidebarSeparator />
        <AgentInterface.ThreadList />
      </AgentInterface.Sidebar>
    </AgentInterface>
  ),
};

/** Welcome screen with title, image, and inherited starters. */
export const WithWelcome = {
  args: {
    glowAnimation: false,
  },
  argTypes: {
    glowAnimation: {
      control: "boolean",
      description: "Play the one-shot welcome entrance and composer glow animation.",
    },
  },
  render: ({ glowAnimation }: { glowAnimation: boolean }) => (
    <AgentInterface
      storage={emptyStorage}
      llm={echoLLM}
      logoUrl={logoUrl}
      agentName="OpenUI Assistant"
      starters={SAMPLE_STARTERS}
      starterVariant="long"
    >
      <AgentInterface.Welcome
        title="OpenUI Assistant"
        description="Everything you'll need, in one place"
        image={{ url: logoUrl }}
        glowAnimation={glowAnimation}
      />
    </AgentInterface>
  ),
};

/** Welcome with prompt templates — a chip prefills the composer; a completion submits it. */
export const WelcomeWithPrefillChips = {
  render: () => (
    <AgentInterface
      storage={emptyStorage}
      llm={echoLLM}
      logoUrl={logoUrl}
      agentName="OpenUI Assistant"
      starters={LONG_STARTERS}
      starterVariant="long"
    >
      <AgentInterface.Welcome
        title="Good to see you"
        description="What's on your mind today?"
        promptTemplates={PROMPT_TEMPLATES}
        glowAnimation
      />
    </AgentInterface>
  ),
};

/** Composer-only starters (no Welcome) — chips above the input. */
export const ComposerStarters = {
  args: {
    starterVariant: "short",
  },
  argTypes: {
    starterVariant: {
      control: "select",
      options: ["short", "long"],
      description: "Switch between pill and list-style conversation starters.",
    },
  },
  render: ({ starterVariant }: { starterVariant: "short" | "long" }) => (
    <AgentInterface
      storage={emptyStorage}
      llm={echoLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
      starters={COMPOSER_STARTERS}
      starterVariant={starterVariant}
    />
  ),
};

/** Custom thread header — Mode C children on ThreadHeader. */
export const WithThreadHeader = {
  render: () => (
    <AgentInterface storage={emptyStorage} llm={echoLLM} logoUrl={logoUrl} agentName="OpenUI">
      <AgentInterface.ThreadHeader>
        <IconButton icon={<Share size={16} />} variant="tertiary" size="small" aria-label="Share" />
      </AgentInterface.ThreadHeader>
    </AgentInterface>
  ),
};

/** Custom mobile header — Mode B props with an extra actions button. */
export const CustomMobileHeader = {
  render: () => (
    <AgentInterface
      storage={populatedStorage}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
    >
      <AgentInterface.MobileHeader
        actions={
          <IconButton
            icon={<Share size={16} />}
            aria-label="Share"
            size="medium"
            variant="secondary"
          />
        }
      />
    </AgentInterface>
  ),
};

/** Long-variant starters with welcome. */
export const LongStarters = {
  render: () => (
    <AgentInterface
      storage={emptyStorage}
      llm={echoLLM}
      logoUrl={logoUrl}
      agentName="OpenUI Assistant"
      starters={LONG_STARTERS}
      starterVariant="long"
    >
      <AgentInterface.Welcome
        title="Welcome"
        description="Pick a starter or type your own."
        image={{ url: logoUrl }}
      />
    </AgentInterface>
  ),
};

/** Welcome Mode C — fully custom hero content (title/image/starters props ignored). */
export const WelcomeCustomChildren = {
  render: () => (
    <AgentInterface
      storage={emptyStorage}
      llm={echoLLM}
      logoUrl={logoUrl}
      agentName="OpenUI Assistant"
    >
      <AgentInterface.Welcome>
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          <div
            style={{
              width: 96,
              height: 96,
              margin: "0 auto 16px",
              borderRadius: 24,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={48} color="white" />
          </div>
          <h2 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 600 }}>Fully custom hero</h2>
          <p style={{ margin: 0, color: "rgba(0,0,0,0.5)", fontSize: 16 }}>
            When Welcome has children, all Mode B props (title/description/image/starters) are
            ignored.
          </p>
        </div>
      </AgentInterface.Welcome>
    </AgentInterface>
  ),
};

/** SidebarHeader Mode C — children fully replace the header (top row gone). */
export const SidebarHeaderCustomChildren = {
  render: () => (
    <AgentInterface
      storage={populatedStorage}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
    >
      <AgentInterface.SidebarHeader>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            background: "#7c3aed",
            color: "white",
            borderRadius: 8,
            margin: 8,
          }}
        >
          <Sparkles size={20} />
          <strong>Branded header</strong>
        </div>
      </AgentInterface.SidebarHeader>
    </AgentInterface>
  ),
};

/** MobileHeader Mode C — replaces the whole bar. (Resize narrow to see.) */
export const MobileHeaderCustomChildren = {
  render: () => (
    <AgentInterface
      storage={populatedStorage}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
    >
      <AgentInterface.MobileHeader>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px 16px",
            background: "#111827",
            color: "white",
            width: "100%",
            fontWeight: 600,
          }}
        >
          Custom mobile bar
        </div>
      </AgentInterface.MobileHeader>
    </AgentInterface>
  ),
};

/** Explicit `components` — replace AssistantMessage + UserMessage rendering. */
export const CustomMessageComponents = {
  render: () => (
    <AgentInterface
      storage={populatedStorage}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
      components={{
        AssistantMessage: ({ message, isStreaming }) => (
          <div
            style={{
              padding: 12,
              margin: "8px 16px",
              background: "#eef2ff",
              borderRadius: 12,
              borderLeft: "3px solid #4f46e5",
            }}
          >
            <strong style={{ color: "#4f46e5" }}>
              Assistant{isStreaming ? " (streaming)" : ""}
            </strong>
            <div style={{ marginTop: 4 }}>
              {typeof message.content === "string" ? message.content : "[non-text content]"}
            </div>
          </div>
        ),
        UserMessage: ({ message }) => (
          <div
            style={{
              padding: 12,
              margin: "8px 16px",
              background: "#fef3c7",
              borderRadius: 12,
              borderLeft: "3px solid #d97706",
              textAlign: "right",
            }}
          >
            <strong style={{ color: "#d97706" }}>You</strong>
            <div style={{ marginTop: 4 }}>
              {typeof message.content === "string" ? message.content : "[non-text content]"}
            </div>
          </div>
        ),
      }}
    />
  ),
};

/** Starters override: Welcome's own `starters` prop wins over the top-level. */
export const StartersOverrideAtWelcome = {
  render: () => (
    <AgentInterface
      storage={emptyStorage}
      llm={echoLLM}
      logoUrl={logoUrl}
      agentName="OpenUI Assistant"
      starters={[{ displayText: "Top-level starter (should NOT show)", prompt: "x" }]}
    >
      <AgentInterface.Welcome
        title="Welcome"
        description="Welcome's own starters override the top-level."
        image={{ url: logoUrl }}
        starters={SAMPLE_STARTERS}
        starterVariant="long"
      />
    </AgentInterface>
  ),
};

/**
 * Hierarchical-ownership warning: top-level SidebarHeader is IGNORED when
 * <AgentInterface.Sidebar> is also at top level. Open the console to see the
 * dev warning. The branded header inside Sidebar is what actually renders.
 */
export const HierarchicalOwnershipWarning = {
  render: () => (
    <AgentInterface
      storage={populatedStorage}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
    >
      {/* This top-level SidebarHeader is ignored (dev warning logged) */}
      <AgentInterface.SidebarHeader logo={<div>🚫 Should not render</div>} agentName="Ignored" />
      <AgentInterface.Sidebar>
        <AgentInterface.SidebarHeader logo={<div style={{ fontSize: 22 }}>✅</div>} />
        <AgentInterface.SidebarSeparator />
        <AgentInterface.ThreadList />
      </AgentInterface.Sidebar>
    </AgentInterface>
  ),
};

/**
 * SidebarItem alongside ThreadList. Custom nav items inherit the same visual
 * language (hover, selected, padding) as ThreadList entries, so they blend
 * naturally above or below the thread history.
 */
const SidebarItemsStory = () => {
  const [section, setSection] = useState<"home" | "favorites" | "docs">("home");

  return (
    <AgentInterface
      storage={populatedStorage}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
    >
      <AgentInterface.Sidebar>
        <AgentInterface.SidebarHeader />

        {/* Top section: custom SidebarItems with icons + selected state */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <AgentInterface.SidebarItem
            icon={<Sparkles size={14} />}
            selected={section === "home"}
            onClick={() => setSection("home")}
          >
            Home
          </AgentInterface.SidebarItem>
          <AgentInterface.SidebarItem
            icon={<Star size={14} />}
            selected={section === "favorites"}
            onClick={() => setSection("favorites")}
            trailing={3}
          >
            Favorites
          </AgentInterface.SidebarItem>
          <AgentInterface.SidebarItem
            icon={<BookOpen size={14} />}
            selected={section === "docs"}
            onClick={() => setSection("docs")}
          >
            Docs
          </AgentInterface.SidebarItem>
        </div>

        {/* Default ThreadList below */}
        <AgentInterface.SidebarContent>
          <AgentInterface.ThreadList />
        </AgentInterface.SidebarContent>

        {/* Footer items */}
        <div
          style={{
            marginTop: "auto",
            padding: "8px 0",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <AgentInterface.SidebarItem icon={<Settings size={14} />}>
            Settings
          </AgentInterface.SidebarItem>
          <AgentInterface.SidebarItem icon={<HelpCircle size={14} />}>
            Help & feedback
          </AgentInterface.SidebarItem>
        </div>
      </AgentInterface.Sidebar>
    </AgentInterface>
  );
};

export const SidebarItems = {
  render: () => <SidebarItemsStory />,
};

/**
 * Routing with `<AgentInterface.Route>` and `SidebarItem.path`. The thread
 * region is fully replaced by the matched Route's content. Demonstrates two
 * ways to return to the thread:
 *   1. Explicit "Back to chat" button calling `navigate(undefined)` from
 *      inside the route page (see SettingsPage / DocsPage).
 *   2. Implicit — clicking any thread in the sidebar's ThreadList
 *      auto-clears the path (ThreadButton calls navigate(undefined) internally).
 */
const BackToChatButton = () => {
  const { navigate } = useNav();
  return (
    <Button
      variant="secondary"
      size="small"
      iconLeft={<ArrowLeft size={14} />}
      onClick={() => navigate(undefined)}
    >
      Back to chat
    </Button>
  );
};

const RoutePage = ({ title, body }: { title: string; body: string }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: 24,
      height: "100%",
      overflowY: "auto",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>{title}</h1>
      <BackToChatButton />
    </div>
    <p style={{ margin: 0, color: "rgba(0,0,0,0.6)" }}>{body}</p>
  </div>
);

const RoutingStory = () => (
  <AgentInterface storage={populatedStorage} llm={defaultLLM} logoUrl={logoUrl} agentName="OpenUI">
    <AgentInterface.Sidebar>
      <AgentInterface.SidebarHeader />

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <AgentInterface.SidebarItem path="/settings" icon={<Settings size={14} />}>
          Settings
        </AgentInterface.SidebarItem>
        <AgentInterface.SidebarItem path="/docs" icon={<BookOpen size={14} />}>
          Docs
        </AgentInterface.SidebarItem>
        <AgentInterface.SidebarItem path="/help" icon={<HelpCircle size={14} />}>
          Help
        </AgentInterface.SidebarItem>
      </div>

      <AgentInterface.SidebarContent>
        <AgentInterface.ThreadList />
      </AgentInterface.SidebarContent>
    </AgentInterface.Sidebar>

    <AgentInterface.Route path="/settings">
      <RoutePage
        title="Settings"
        body="This entire thread region is replaced when the active path matches the Route. Click 'Back to chat' to call navigate(undefined), or click any thread in the sidebar to auto-clear the path."
      />
    </AgentInterface.Route>

    <AgentInterface.Route path="/docs">
      <RoutePage
        title="Docs"
        body="Routes are siblings under <AgentInterface>. Exact-string match (no wildcards). When no Route matches, the thread view re-emerges with its defaults."
      />
    </AgentInterface.Route>

    <AgentInterface.Route path="/help">
      <RoutePage
        title="Help"
        body="Multiple Routes are supported. Each is a top-level <AgentInterface.Route> with a unique path."
      />
    </AgentInterface.Route>
  </AgentInterface>
);

export const Routing = {
  render: () => <RoutingStory />,
};

/**
 * Same routing setup but in *controlled* mode — `path` + `onNavigate` come
 * from parent state. Useful when syncing with Next.js / React Router / your
 * own custom router. Defaults to `/settings` so the route content shows
 * immediately on mount.
 */
const ControlledRoutingStory = () => {
  const [path, setPath] = useState<string | undefined>("/settings");

  return (
    <AgentInterface
      storage={populatedStorage}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
      path={path}
      onNavigate={setPath}
    >
      <AgentInterface.Sidebar>
        <AgentInterface.SidebarHeader />

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <AgentInterface.SidebarItem path="/settings" icon={<Settings size={14} />}>
            Settings
          </AgentInterface.SidebarItem>
          <AgentInterface.SidebarItem path="/docs" icon={<BookOpen size={14} />}>
            Docs
          </AgentInterface.SidebarItem>
        </div>

        <AgentInterface.SidebarContent>
          <AgentInterface.ThreadList />
        </AgentInterface.SidebarContent>

        <div style={{ padding: 8, fontSize: 11, color: "#666" }}>
          current path: {path === undefined ? "(thread)" : path}
        </div>
      </AgentInterface.Sidebar>

      <AgentInterface.Route path="/settings">
        <RoutePage title="Settings (controlled)" body="Parent owns `path` state." />
      </AgentInterface.Route>

      <AgentInterface.Route path="/docs">
        <RoutePage title="Docs (controlled)" body="Sync with your router here." />
      </AgentInterface.Route>
    </AgentInterface>
  );
};

export const ControlledRouting = {
  render: () => <ControlledRoutingStory />,
};

/**
 * Global artifact browser. `artifactCategories` split the sidebar nav into
 * "Apps" + "Artifacts"; clicking one opens the searchable artifact list
 * (reserved path `artifacts/{category}`); clicking an artifact opens the
 * full-page view with Back + "Go to thread".
 */
const MOCK_ARTIFACT_TYPES = [
  { type: "th_dashboard", titlePrefix: "Sales dashboard" },
  { type: "th_report", titlePrefix: "Quarterly report" },
  { type: "th_presentation", titlePrefix: "Market overview" },
] as const;

const MOCK_LONG_ARTIFACT_TITLES: Record<number, string> = {
  3: "Executive market overview presentation for global sales leadership",
  4: "Sales dashboard with regional revenue attribution and pipeline movement",
  8: "Quarterly report covering customer expansion, renewals, and churn signals",
};

const MOCK_ARTIFACTS = Array.from({ length: 12 }, (_, i) => {
  const artifactType = MOCK_ARTIFACT_TYPES[i % MOCK_ARTIFACT_TYPES.length]!;
  const title = MOCK_LONG_ARTIFACT_TITLES[i + 1] ?? `${artifactType.titlePrefix} ${i + 1}`;

  return {
    id: `artifact-${i + 1}`,
    title,
    type: artifactType.type,
    threadId: String((i % 3) + 1),
    updatedAt: new Date(Date.UTC(2026, 5, 16, 9, 30 - i * 7)).toISOString(),
    content: {
      heading: title,
      body: `Stored content for artifact ${i + 1}.`,
    },
  };
});

const mockArtifactStorage = {
  list: async ({ name, type }: { name?: string; type?: string[]; cursor?: string } = {}) => {
    await new Promise((r) => setTimeout(r, 300));
    const filtered = MOCK_ARTIFACTS.filter(
      (a) =>
        (!name || a.title.toLowerCase().includes(name.toLowerCase())) &&
        (!type || type.includes(a.type)),
    );
    return {
      artifacts: filtered.map(({ content: _c, ...summary }) => summary),
      nextCursor: undefined,
    };
  },
  get: async (id: string) => {
    await new Promise((r) => setTimeout(r, 300));
    const found = MOCK_ARTIFACTS.find((a) => a.id === id);
    if (!found) throw new Error(`Artifact ${id} not found`);
    return found;
  },
  update: async ({ id }: { id: string; content: unknown }) => {
    const { content: _c, ...summary } = MOCK_ARTIFACTS.find((a) => a.id === id)!;
    return summary;
  },
};

const storedArtifactRenderer = (type: string) => ({
  type,
  toolName: `${type}:create`,
  parser: ({ response }: { args: unknown; response: unknown }) => {
    const content = response as { heading: string; body: string } | null;
    if (!content?.heading) return null;
    return { props: content, meta: { id: content.heading, version: 1, heading: content.heading } };
  },
  preview: (props: { heading: string }) => <div>{props.heading}</div>,
  actual: (props: { heading: string; body: string }) => (
    <div style={{ padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>{props.heading}</h2>
      <p>{props.body}</p>
      <p style={{ color: "rgba(0,0,0,0.4)", fontSize: 13 }}>
        Rendered from storage via the type-matched artifact renderer.
      </p>
    </div>
  ),
});

const ARTIFACT_RENDERERS = [
  storedArtifactRenderer("th_dashboard"),
  storedArtifactRenderer("th_report"),
  storedArtifactRenderer("th_presentation"),
];

const ARTIFACT_CATEGORIES = [
  { name: "Apps", filter: { type: ["th_dashboard"] } },
  { name: "Artifacts", filter: { type: ["th_report", "th_presentation"] } },
];

export const ArtifactBrowser = {
  render: () => (
    <AgentInterface
      storage={{ ...makeMockStorage(), artifact: mockArtifactStorage }}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
      artifactRenderers={ARTIFACT_RENDERERS}
      artifactCategories={ARTIFACT_CATEGORIES}
    />
  ),
};

/** Without categories: a single "Artifacts" sidebar item browsing everything. */
export const ArtifactBrowserUncategorized = {
  render: () => (
    <AgentInterface
      storage={{ ...makeMockStorage(), artifact: mockArtifactStorage }}
      llm={defaultLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
      artifactRenderers={ARTIFACT_RENDERERS}
    />
  ),
};

/**
 * Per-thread Workspace rail. Send a message (or click the starter) — the
 * mock LLM replies with a `dashboard:create` tool call; the matched artifact
 * renderer registers an entry in the ThreadContext. Use the header Workspace
 * button to open the rail, then click the entry to open its DetailedView.
 */
const toolCallSSE = (toolName: string, args: object, result: object): Promise<Response> => {
  const events = [
    { type: "TEXT_MESSAGE_CONTENT", delta: "Sure — here's your dashboard. " },
    { type: "TOOL_CALL_START", toolCallId: "tc-1", toolCallName: toolName },
    { type: "TOOL_CALL_ARGS", toolCallId: "tc-1", delta: JSON.stringify(args) },
    { type: "TOOL_CALL_END", toolCallId: "tc-1" },
    { type: "TOOL_CALL_RESULT", toolCallId: "tc-1", content: JSON.stringify(result) },
  ];
  const body = events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("") + "data: [DONE]\n\n";
  return new Promise((resolve) => {
    setTimeout(() => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(body));
          controller.close();
        },
      });
      resolve(new Response(stream));
    }, 400);
  });
};

let dashboardCount = 0;

const workspaceLLM = makeMockLLM({
  send: async () => {
    dashboardCount += 1;
    const heading = `Revenue dashboard ${dashboardCount}`;
    return toolCallSSE(
      "dashboard:create",
      { heading },
      { heading, body: `Widgets and charts for ${heading}.` },
    );
  },
});

const dashboardRenderer = {
  type: "th_dashboard",
  toolName: "dashboard:create",
  parser: ({ response }: { args: unknown; response: unknown }) => {
    if (typeof response !== "string") return null;
    try {
      const content = JSON.parse(response) as { heading: string; body: string };
      if (!content.heading) return null;
      return {
        props: content,
        meta: { id: content.heading, version: 1, heading: content.heading },
      };
    } catch {
      return null;
    }
  },
  preview: (props: { heading: string }, controls: { open: () => void; isActive: boolean }) => (
    <button
      type="button"
      onClick={controls.open}
      style={{
        display: "block",
        padding: "10px 14px",
        margin: "8px 0",
        border: "1px solid #ddd",
        borderRadius: 8,
        cursor: "pointer",
        background: controls.isActive ? "#eef2ff" : "#fff",
      }}
    >
      📊 {props.heading} — click to open
    </button>
  ),
  actual: (props: { heading: string; body: string }) => (
    <div style={{ padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>{props.heading}</h3>
      <p>{props.body}</p>
    </div>
  ),
};

export const WithWorkspace = {
  render: () => (
    <AgentInterface
      storage={populatedStorage}
      llm={workspaceLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
      artifactRenderers={[dashboardRenderer]}
      artifactCategories={ARTIFACT_CATEGORIES}
      starters={[
        {
          displayText: "Create a revenue dashboard",
          prompt: "Create a revenue dashboard",
          icon: <Sparkles size={16} />,
        },
      ]}
    />
  ),
};

/** Workspace Mode C — children replace the rail entirely. */
export const WorkspaceCustomChildren = {
  render: () => (
    <AgentInterface
      storage={populatedStorage}
      llm={workspaceLLM}
      logoUrl={logoUrl}
      agentName="OpenUI"
      artifactRenderers={[dashboardRenderer]}
    >
      <AgentInterface.Workspace>
        <div
          style={{
            width: 240,
            padding: 16,
            borderLeft: "1px solid #eee",
            background: "#fafafa",
          }}
        >
          <strong>My custom rail</strong>
          <p style={{ fontSize: 13, color: "#666" }}>
            Replaces the default Workspace (always visible — you own the chrome).
          </p>
        </div>
      </AgentInterface.Workspace>
    </AgentInterface>
  ),
};
