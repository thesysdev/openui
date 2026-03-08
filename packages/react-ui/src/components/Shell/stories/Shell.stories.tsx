import { ChatProvider, Message, type Thread } from "@openuidev/react-headless";
import { MessageSquare, Sparkles, Zap } from "lucide-react";
import { Container } from "../Container";
import { ConversationStarter } from "../ConversationStarter";
import { MobileHeader } from "../MobileHeader";
import { NewChatButton } from "../NewChatButton";
import { SidebarContainer, SidebarContent, SidebarHeader, SidebarSeparator } from "../Sidebar";
import { Composer, MessageLoading, Messages, ScrollArea, ThreadContainer } from "../Thread";
import { ThreadList } from "../ThreadList";
import { WelcomeScreen } from "../WelcomeScreen";
import logoUrl from "./thesysdev_logo.jpeg";

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

function getLastUserContent(messages: Message[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return "";
  return typeof lastUser.content === "string" ? lastUser.content : "";
}

export default {
  title: "Components/Shell",
  tags: ["dev"],
  argTypes: {
    variant: {
      control: "select",
      options: ["short", "long"],
      description: "Conversation starter variant",
    },
  },
};

const SAMPLE_STARTERS = [
  {
    displayText: "Help me get started",
    prompt: "Help me get started",
    icon: <Sparkles size={16} />,
  },
  {
    displayText: "What can you do?",
    prompt: "What can you do?",
    // icon undefined = shows default lightbulb
  },
  {
    displayText: "Tell me about your features",
    prompt: "Tell me about your features",
    icon: <MessageSquare size={16} />,
  },
  {
    displayText: "Show me some examples (no icon)",
    prompt: "Show me some examples",
    icon: <></>, // Empty fragment = no icon
  },
];

const LONG_STARTERS = [
  {
    displayText: "Help me get started with this application and guide me through the features",
    prompt: "Help me get started with this application",
    icon: <Sparkles size={16} />,
  },
  {
    displayText: "What can you do? I'd like to know all your capabilities and how you can help me",
    prompt: "What can you do?",
    icon: <Zap size={16} />,
  },
  {
    displayText: "Tell me about your advanced features and how I can use them effectively",
    prompt: "Tell me about your features",
    // Default lightbulb icon
  },
];

export const Default = {
  args: {
    variant: "short",
  },
  render: ({ variant }: { variant: "short" | "long" }) => (
    <ChatProvider
      processMessage={async () => {
        await new Promise((r) => setTimeout(r, 100));
        return mockSSEResponse("This is a response from the AI assistant.", 1000);
      }}
      fetchThreadList={async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          threads: [
            { id: "1", title: "test", createdAt: Date.now() },
            { id: "2", title: "test 2", createdAt: Date.now() },
            { id: "3", title: "test 3", createdAt: Date.now() },
          ],
        };
      }}
      createThread={async () => ({
        id: crypto.randomUUID(),
        title: "test",
        createdAt: Date.now(),
      })}
      deleteThread={async () => {}}
      updateThread={async (t: Thread) => t}
      loadThread={async (threadId) => {
        if (!threadId) return [];
        return [
          { id: crypto.randomUUID(), role: "user", content: "Hello" },
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Hello! How can I help you today?",
          },
        ];
      }}
    >
      <Container logoUrl={logoUrl} agentName="OpenUI">
        <SidebarContainer>
          <SidebarHeader />
          <SidebarContent>
            <NewChatButton />
            <SidebarSeparator />
            <ThreadList />
          </SidebarContent>
        </SidebarContainer>
        <ThreadContainer>
          <MobileHeader />
          <ScrollArea>
            <Messages loader={<MessageLoading />} />
          </ScrollArea>
          <ConversationStarter starters={SAMPLE_STARTERS} variant={variant} />
          <Composer />
        </ThreadContainer>
      </Container>
    </ChatProvider>
  ),
};

export const WithConversationStarter = {
  args: {
    variant: "short",
  },
  render: ({ variant }: { variant: "short" | "long" }) => (
    <ChatProvider
      processMessage={async ({ messages }: { messages: Message[] }) => {
        const content = getLastUserContent(messages);
        return mockSSEResponse(`You asked: "${content}"`, 1000);
      }}
      fetchThreadList={async () => ({ threads: [] })}
      createThread={async () => ({
        id: crypto.randomUUID(),
        title: "New Chat",
        createdAt: Date.now(),
      })}
      deleteThread={async () => {}}
      updateThread={async (t: Thread) => t}
      loadThread={async () => []}
    >
      <Container logoUrl={logoUrl} agentName="OpenUI">
        <SidebarContainer>
          <SidebarHeader />
          <SidebarContent>
            <NewChatButton />
            <SidebarSeparator />
            <ThreadList />
          </SidebarContent>
        </SidebarContainer>
        <ThreadContainer>
          <MobileHeader />
          <ScrollArea>
            <Messages loader={<MessageLoading />} />
          </ScrollArea>
          <ConversationStarter starters={SAMPLE_STARTERS} variant={variant} />
          <Composer />
        </ThreadContainer>
      </Container>
    </ChatProvider>
  ),
};

export const LongVariant = {
  args: {
    variant: "long",
  },
  render: ({ variant }: { variant: "short" | "long" }) => (
    <ChatProvider
      processMessage={async ({ messages }: { messages: Message[] }) => {
        const content = getLastUserContent(messages);
        return mockSSEResponse(`You asked: "${content}"`, 1000);
      }}
      fetchThreadList={async () => ({ threads: [] })}
      createThread={async () => ({
        id: crypto.randomUUID(),
        title: "New Chat",
        createdAt: Date.now(),
      })}
      deleteThread={async () => {}}
      updateThread={async (t: Thread) => t}
      loadThread={async () => []}
    >
      <Container logoUrl={logoUrl} agentName="OpenUI">
        <SidebarContainer>
          <SidebarHeader />
          <SidebarContent>
            <NewChatButton />
            <SidebarSeparator />
            <ThreadList />
          </SidebarContent>
        </SidebarContainer>
        <ThreadContainer>
          <MobileHeader />
          <ScrollArea>
            <Messages loader={<MessageLoading />} />
          </ScrollArea>
          <ConversationStarter starters={LONG_STARTERS} variant={variant} />
          <Composer />
        </ThreadContainer>
      </Container>
    </ChatProvider>
  ),
};

// WelcomeScreen with props-based content
export const WithWelcomeScreen = {
  args: {
    variant: "short",
  },
  render: ({ variant }: { variant: "short" | "long" }) => (
    <ChatProvider
      processMessage={async ({ messages }: { messages: Message[] }) => {
        const content = getLastUserContent(messages);
        return mockSSEResponse(`You asked: "${content}"`, 1000);
      }}
      fetchThreadList={async () => ({ threads: [] })}
      createThread={async () => ({
        id: crypto.randomUUID(),
        title: "New Chat",
        createdAt: Date.now(),
      })}
      deleteThread={async () => {}}
      updateThread={async (t: Thread) => t}
      loadThread={async () => []}
    >
      <Container logoUrl={logoUrl} agentName="OpenUI Assistant">
        <SidebarContainer>
          <SidebarHeader />
          <SidebarContent>
            <NewChatButton />
            <SidebarSeparator />
            <ThreadList />
          </SidebarContent>
        </SidebarContainer>
        <ThreadContainer>
          <MobileHeader />
          <WelcomeScreen
            title="Hi, I'm OpenUI Assistant"
            description="I can help you with questions about your account, products, and more."
            image={{ url: logoUrl }}
            starters={SAMPLE_STARTERS}
            starterVariant={variant}
          />
          <ScrollArea>
            <Messages loader={<MessageLoading />} />
          </ScrollArea>
          <ConversationStarter starters={SAMPLE_STARTERS} variant={variant} />
          <Composer />
        </ThreadContainer>
      </Container>
    </ChatProvider>
  ),
};

// WelcomeScreen with custom children
export const WithCustomWelcomeScreen = {
  args: {
    variant: "short",
  },
  render: ({ variant }: { variant: "short" | "long" }) => (
    <ChatProvider
      processMessage={async ({ messages }: { messages: Message[] }) => {
        const content = getLastUserContent(messages);
        return mockSSEResponse(`You asked: "${content}"`, 1000);
      }}
      fetchThreadList={async () => ({ threads: [] })}
      createThread={async () => ({
        id: crypto.randomUUID(),
        title: "New Chat",
        createdAt: Date.now(),
      })}
      deleteThread={async () => {}}
      updateThread={async (t: Thread) => t}
      loadThread={async () => []}
    >
      <Container logoUrl={logoUrl} agentName="OpenUI Assistant">
        <SidebarContainer>
          <SidebarHeader />
          <SidebarContent>
            <NewChatButton />
            <SidebarSeparator />
            <ThreadList />
          </SidebarContent>
        </SidebarContainer>
        <ThreadContainer>
          <MobileHeader />
          <WelcomeScreen>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Sparkles size={40} color="white" />
              </div>
              <h2 style={{ margin: "0 0 8px", fontSize: 24, fontWeight: 600 }}>
                Welcome to AI Assistant
              </h2>
              <p style={{ margin: 0, color: "rgba(0,0,0,0.5)", fontSize: 16 }}>
                Your personal AI helper for all your questions
              </p>
            </div>
          </WelcomeScreen>
          <ScrollArea>
            <Messages loader={<MessageLoading />} />
          </ScrollArea>
          <ConversationStarter starters={SAMPLE_STARTERS} variant={variant} />
          <Composer />
        </ThreadContainer>
      </Container>
    </ChatProvider>
  ),
};
