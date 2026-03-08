import { ChatProvider, Message } from "@openuidev/react-headless";
import { Sparkles } from "lucide-react";
import {
  Composer,
  Container,
  ConversationStarter,
  Header,
  MessageLoading,
  Messages,
  ScrollArea,
  ThreadContainer,
  WelcomeScreen,
} from "../../CopilotShell";
// @ts-ignore
import styles from "./style.module.scss";
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

export default {
  title: "Components/CopilotShell",
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
    displayText: "Tell me about my portfolio",
    prompt: "Tell me about the latest stock market trends and how they affect my portfolio",
    icon: <Sparkles size={16} />,
  },
  {
    displayText: "Who is the president of Venezuela and where is he currently located?",
    prompt: "Who is the president of Venezuela and where is he currently located?",
    // icon undefined = shows default lightbulb
  },
  {
    displayText: "Tell me about major stock (no icon)",
    prompt: "Tell me about major stock",
    icon: <></>, // Empty fragment = no icon
  },
];

export const Default = {
  args: {
    variant: "short",
  },
  render: ({ variant }: { variant: "short" | "long" }) => (
    <div className={styles.container}>
      <div className={styles.left} />
      <ChatProvider
        processMessage={async () =>
          mockSSEResponse("This is a response from the AI assistant.", 1000)
        }
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
        updateThread={async (t) => t}
        loadThread={async (threadId) => {
          if (!threadId) return [];
          return [
            {
              id: crypto.randomUUID(),
              role: "user",
              content: "Hello",
            } as Message,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: "Hello! How can I help you today?",
            } as Message,
          ];
        }}
      >
        <Container logoUrl={logoUrl} agentName="OpenUI">
          <ThreadContainer>
            <Header />
            <ScrollArea>
              <Messages loader={<MessageLoading />} />
            </ScrollArea>
            <ConversationStarter starters={SAMPLE_STARTERS} variant={variant} />
            <Composer />
          </ThreadContainer>
        </Container>
      </ChatProvider>
    </div>
  ),
};

export const LongVariant = {
  args: {
    variant: "long",
  },
  render: ({ variant }: { variant: "short" | "long" }) => (
    <div className={styles.container}>
      <div className={styles.left} />
      <ChatProvider
        processMessage={async ({ messages }) => {
          const lastMsg = messages[messages.length - 1];
          const content = lastMsg && typeof lastMsg.content === "string" ? lastMsg.content : "";
          return mockSSEResponse(`You asked: "${content}"`, 1000);
        }}
        fetchThreadList={async () => ({ threads: [] })}
        createThread={async () => ({
          id: crypto.randomUUID(),
          title: "New Chat",
          createdAt: Date.now(),
        })}
        deleteThread={async () => {}}
        updateThread={async (t) => t}
        loadThread={async () => []}
      >
        <Container logoUrl={logoUrl} agentName="OpenUI">
          <ThreadContainer>
            <Header />
            <ScrollArea>
              <Messages loader={<MessageLoading />} />
            </ScrollArea>
            <ConversationStarter starters={SAMPLE_STARTERS} variant={variant} />
            <Composer />
          </ThreadContainer>
        </Container>
      </ChatProvider>
    </div>
  ),
};

// Example with WelcomeScreen
export const WithWelcomeScreen = {
  args: {
    variant: "short",
  },
  render: ({ variant }: { variant: "short" | "long" }) => (
    <div className={styles.container}>
      <div className={styles.left} />
      <ChatProvider
        processMessage={async ({ messages }) => {
          const lastMsg = messages[messages.length - 1];
          const content = lastMsg && typeof lastMsg.content === "string" ? lastMsg.content : "";
          return mockSSEResponse(`You asked: "${content}"`, 1000);
        }}
        fetchThreadList={async () => ({ threads: [] })}
        createThread={async () => ({
          id: crypto.randomUUID(),
          title: "New Chat",
          createdAt: Date.now(),
        })}
        deleteThread={async () => {}}
        updateThread={async (t) => t}
        loadThread={async () => []}
      >
        <Container logoUrl={logoUrl} agentName="OpenUI Assistant">
          <ThreadContainer>
            <Header />
            <WelcomeScreen
              title="Hi, I'm OpenUI Assistant"
              description="I can help you with questions about your account, products, and more."
              image={{ url: logoUrl }}
            />
            <ScrollArea>
              <Messages loader={<MessageLoading />} />
            </ScrollArea>
            <ConversationStarter starters={SAMPLE_STARTERS} variant={variant} />
            <Composer />
          </ThreadContainer>
        </Container>
      </ChatProvider>
    </div>
  ),
};

// Example with custom children in WelcomeScreen
export const WithCustomWelcomeScreen = {
  args: {
    variant: "short",
  },
  render: ({ variant }: { variant: "short" | "long" }) => (
    <div className={styles.container}>
      <div className={styles.left} />
      <ChatProvider
        processMessage={async ({ messages }) => {
          const lastMsg = messages[messages.length - 1];
          const content = lastMsg && typeof lastMsg.content === "string" ? lastMsg.content : "";
          return mockSSEResponse(`You asked: "${content}"`, 1000);
        }}
        fetchThreadList={async () => ({ threads: [] })}
        createThread={async () => ({
          id: crypto.randomUUID(),
          title: "New Chat",
          createdAt: Date.now(),
        })}
        deleteThread={async () => {}}
        updateThread={async (t) => t}
        loadThread={async () => []}
      >
        <Container logoUrl={logoUrl} agentName="OpenUI Assistant">
          <ThreadContainer>
            <Header />
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
                <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 600 }}>
                  Welcome to AI Assistant
                </h2>
                <p style={{ margin: 0, color: "rgba(0,0,0,0.5)", fontSize: 14 }}>
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
    </div>
  ),
};
