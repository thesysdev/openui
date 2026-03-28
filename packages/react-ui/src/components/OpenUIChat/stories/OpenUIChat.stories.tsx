import type { Message } from "@openuidev/react-headless";
import { ChevronDown, Download, Share, Sparkles, ThumbsUp, Zap } from "lucide-react";
import { useState } from "react";
import logoUrl from "../../BottomTray/stories/thesysdev_logo.jpeg";
import { Button } from "../../Button";
import { IconButton } from "../../IconButton";
import { BottomTray } from "../ComposedBottomTray.js";
import { Copilot } from "../ComposedCopilot.js";
import { FullScreen } from "../ComposedStandalone.js";
import { ConversationStartersConfig, WelcomeMessageConfig } from "../types.js";

export default {
  title: "Components/OpenUIChat",
  tags: ["dev"],
};

function mockSSEResponse(text: string, delayMs = 500): Promise<Response> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const events = `data: ${JSON.stringify({ type: "TEXT_MESSAGE_CONTENT", delta: text })}\n\ndata: [DONE]\n\n`;
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(events));
          controller.close();
        },
      });
      resolve(new Response(stream));
    }, delayMs);
  });
}

const SAMPLE_WELCOME_MESSAGE: WelcomeMessageConfig = {
  title: "Hi, I'm OpenUI Assistant",
  description: "I can help you with questions about your account, products, and more.",
  image: { url: logoUrl },
};

const SAMPLE_STARTERS: ConversationStartersConfig = {
  variant: "short",
  options: [
    {
      displayText: "Help me get started",
      prompt: "Help me get started with OpenUI",
      icon: <Sparkles size={16} />,
    },
    {
      displayText: "What can you do?",
      prompt: "What can you do?",
    },
    {
      displayText: "Tell me about features",
      prompt: "Tell me about your features",
      icon: <Zap size={16} />,
    },
  ],
};

const LONG_STARTERS: ConversationStartersConfig = {
  variant: "long",
  options: [
    {
      displayText: "Help me get started with this application and guide me through the features",
      prompt: "Help me get started",
      icon: <Sparkles size={16} />,
    },
    {
      displayText: "What can you do? I'd like to know all your capabilities",
      prompt: "What can you do?",
    },
    {
      displayText: "Tell me about your advanced features and how I can use them effectively",
      prompt: "Tell me about your features",
      icon: <Zap size={16} />,
    },
  ],
};

const mockGenerateShareLink = async (_messages: Message[]) => {
  await new Promise((r) => setTimeout(r, 1000));
  return `https://example.com/shared/${crypto.randomUUID().slice(0, 8)}`;
};

const mockProcessMessage = async ({ messages }: { messages: Message[] }) => {
  const lastMsg = messages[messages.length - 1];
  const content =
    lastMsg?.role === "user" && typeof lastMsg.content === "string" ? lastMsg.content : "";
  return mockSSEResponse(`You said: "${content}". This is a response from the AI assistant.`);
};

const sharedProps = {
  processMessage: mockProcessMessage,
  fetchThreadList: async () => ({
    threads: [
      { id: "1", title: "Previous Chat 1", createdAt: Date.now() },
      { id: "2", title: "Previous Chat 2", createdAt: Date.now() },
      { id: "3", title: "Previous Chat 3", createdAt: Date.now() },
    ],
  }),
  createThread: async () => ({
    id: crypto.randomUUID(),
    title: "New Chat",
    createdAt: Date.now(),
  }),
  deleteThread: async () => {},
  updateThread: async (t: any) => t,
  loadThread: async (threadId: string) => {
    if (!threadId) return [];
    return [
      { id: crypto.randomUUID(), role: "user", content: "Hello" },
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Hello! How can I help you today?",
      },
    ] as Message[];
  },
  logoUrl,
  agentName: "OpenUI Assistant",
};

export const Default = {
  render: () => (
    <div style={{ minHeight: "100vh", background: "var(--openui-bg-fill, #f5f5f5)" }}>
      <FullScreen {...sharedProps} />
    </div>
  ),
};

export const StandaloneWithWelcome = {
  render: () => (
    <div style={{ minHeight: "100vh", background: "var(--openui-bg-fill, #f5f5f5)" }}>
      <FullScreen
        {...sharedProps}
        welcomeMessage={SAMPLE_WELCOME_MESSAGE}
        conversationStarters={SAMPLE_STARTERS}
      />
    </div>
  ),
};

export const StandaloneLongStarters = {
  render: () => (
    <div style={{ minHeight: "100vh", background: "var(--openui-bg-fill, #f5f5f5)" }}>
      <FullScreen
        {...sharedProps}
        welcomeMessage={SAMPLE_WELCOME_MESSAGE}
        conversationStarters={LONG_STARTERS}
      />
    </div>
  ),
};

export const StandaloneWithShareLink = {
  render: () => (
    <div style={{ minHeight: "100vh", background: "var(--openui-bg-fill, #f5f5f5)" }}>
      <FullScreen
        {...sharedProps}
        welcomeMessage={SAMPLE_WELCOME_MESSAGE}
        conversationStarters={SAMPLE_STARTERS}
        generateShareLink={mockGenerateShareLink}
      />
    </div>
  ),
};

export const StandaloneWithThreadHeader = {
  render: () => (
    <div style={{ minHeight: "100vh", background: "var(--openui-bg-fill, #f5f5f5)" }}>
      <FullScreen
        {...sharedProps}
        welcomeMessage={SAMPLE_WELCOME_MESSAGE}
        conversationStarters={SAMPLE_STARTERS}
        threadHeader={
          <>
            <Button iconLeft={<ChevronDown size={14} />} variant="secondary" size="small">
              GPT-4o
            </Button>
            <div style={{ display: "flex", gap: "4px" }}>
              <IconButton
                icon={<ThumbsUp size={16} />}
                aria-label="Feedback"
                size="small"
                variant="secondary"
              />
              <IconButton
                icon={<Download size={16} />}
                aria-label="Export"
                size="small"
                variant="secondary"
              />
              <Button iconLeft={<Share size={14} />} variant="secondary" size="small">
                Share
              </Button>
            </div>
          </>
        }
      />
    </div>
  ),
};

export const CopilotDefault = {
  render: () => (
    <div style={{ minHeight: "100vh", background: "var(--openui-bg-fill, #f5f5f5)" }}>
      <Copilot {...sharedProps} />
    </div>
  ),
};

export const CopilotWithWelcome = {
  render: () => (
    <div style={{ minHeight: "100vh", background: "var(--openui-bg-fill, #f5f5f5)" }}>
      <Copilot
        {...sharedProps}
        welcomeMessage={SAMPLE_WELCOME_MESSAGE}
        conversationStarters={SAMPLE_STARTERS}
      />
    </div>
  ),
};

export const CopilotWithShareLink = {
  render: () => (
    <div style={{ minHeight: "100vh", background: "var(--openui-bg-fill, #f5f5f5)" }}>
      <Copilot
        {...sharedProps}
        welcomeMessage={SAMPLE_WELCOME_MESSAGE}
        conversationStarters={SAMPLE_STARTERS}
        generateShareLink={mockGenerateShareLink}
      />
    </div>
  ),
};

export const CopilotWithHeaderActions = {
  render: () => (
    <div style={{ minHeight: "100vh", background: "var(--openui-bg-fill, #f5f5f5)" }}>
      <Copilot
        {...sharedProps}
        welcomeMessage={SAMPLE_WELCOME_MESSAGE}
        headerActions={
          <>
            <IconButton
              icon={<Download size={16} />}
              aria-label="Export"
              size="small"
              variant="secondary"
            />
            <IconButton
              icon={<Share size={16} />}
              aria-label="Share"
              size="small"
              variant="secondary"
            />
          </>
        }
      />
    </div>
  ),
};

const BottomTrayStory = ({ defaultOpen = false, ...rest }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div style={{ minHeight: "100vh", background: "var(--openui-bg-fill, #f5f5f5)" }}>
      <div style={{ padding: "2rem" }}>
        <h1 style={{ marginBottom: "1rem" }}>Bottom Tray Example</h1>
        <p style={{ marginBottom: "1rem" }}>
          The chat appears as a bottom tray. Click the pill button to open/close.
        </p>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            padding: "0.5rem 1rem",
            background: "var(--openui-interactive-default)",
            border: "1px solid var(--openui-stroke-interactive-el)",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {isOpen ? "Close" : "Open"} Chat
        </button>
      </div>
      <BottomTray {...sharedProps} {...rest} isOpen={isOpen} onOpenChange={setIsOpen} />
    </div>
  );
};

export const BottomTrayDefault = {
  render: () => <BottomTrayStory />,
};

export const BottomTrayOpen = {
  render: () => <BottomTrayStory defaultOpen />,
};

export const BottomTrayWithWelcome = {
  render: () => (
    <BottomTrayStory
      defaultOpen
      welcomeMessage={SAMPLE_WELCOME_MESSAGE}
      conversationStarters={SAMPLE_STARTERS}
    />
  ),
};

export const BottomTrayLongStarters = {
  render: () => (
    <BottomTrayStory
      defaultOpen
      welcomeMessage={SAMPLE_WELCOME_MESSAGE}
      conversationStarters={LONG_STARTERS}
    />
  ),
};

export const BottomTrayWithShareLink = {
  render: () => (
    <BottomTrayStory
      defaultOpen
      welcomeMessage={SAMPLE_WELCOME_MESSAGE}
      conversationStarters={SAMPLE_STARTERS}
      generateShareLink={mockGenerateShareLink}
    />
  ),
};

export const BottomTrayWithHeaderActions = {
  render: () => (
    <BottomTrayStory
      defaultOpen
      welcomeMessage={SAMPLE_WELCOME_MESSAGE}
      conversationStarters={SAMPLE_STARTERS}
      headerActions={
        <IconButton icon={<Share size={16} />} aria-label="Share" size="small" variant="tertiary" />
      }
    />
  ),
};
