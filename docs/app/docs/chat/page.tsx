import { Button } from "@/components/button";
import {
  CodeBlock,
  FeatureCard,
  FeatureCards,
  Separator,
  SimpleCard,
} from "@/components/overview-components";
import {
  Code2,
  Database,
  Layout,
  Maximize2,
  MessageCircle,
  MessageSquare,
  PanelRightOpen,
  Zap,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "OpenUI Chat SDK",
  description:
    "Production-ready chat UI for AI agents. Drop-in layouts, streaming, and state management.",
};

const headlessCode = `import { useChat } from '@openuidev/react';

function CustomChat() {
  const { messages, append, isLoading } = useChat();

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>
          {m.content}
        </div>
      ))}

      <input
        onChange={e => append(e.target.value)}
      />
    </div>
  );
}`;

const layoutOptions = [
  {
    icon: <PanelRightOpen />,
    title: "Copilot",
    description: "A sidebar assistant that lives alongside your main application content.",
    href: "/docs/chat/copilot",
  },
  {
    icon: <Maximize2 />,
    title: "Full Screen",
    description: "A standalone, immersive chat page similar to ChatGPT or Claude.",
    href: "/docs/chat/fullscreen",
  },
  {
    icon: <MessageCircle />,
    title: "Bottom Tray",
    description: "A floating support-style widget that expands from the bottom corner.",
    href: "/docs/chat/bottom-tray",
  },
] as const;

const capabilities = [
  {
    icon: <MessageSquare />,
    title: "Streaming Native",
    description: "Handles text deltas, optimistic updates, loading states, and partial responses.",
  },
  {
    icon: <Database />,
    title: "Thread Persistence",
    description: "Save and restore conversation history with straightforward API contracts.",
  },
  {
    icon: <Zap />,
    title: "Composable State",
    description: "Use the same primitives across prebuilt layouts and fully custom chat surfaces.",
  },
] as const;

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-3 sm:mb-8 sm:gap-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fd-muted sm:size-12">
        <Icon className="size-5 text-fd-foreground sm:size-6" />
      </div>
      <div>
        <h2 className="mb-1 text-2xl font-bold sm:mb-2 sm:text-3xl">{title}</h2>
        <p className="text-sm text-fd-muted-foreground sm:text-base">{description}</p>
      </div>
    </div>
  );
}

export default function ChatOverviewPage() {
  return (
    <div className="mx-auto max-w-4xl px-3 py-8 font-sans text-slate-900 sm:px-4 sm:py-12 lg:px-8 dark:text-slate-100">
      <section className="mb-12 space-y-6 sm:mb-16">
        <h1 className="docs-page-title max-w-3xl">OpenUI Chat SDK</h1>
        <p className="max-w-2xl text-base leading-7 text-fd-muted-foreground sm:text-lg">
          Production-ready chat UI for AI agents. Start with prebuilt layouts for fast integration,
          then drop down to headless hooks when you need full control over behavior and rendering.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button href="/docs/chat/installation" text="Installation" variant="primary" />
          <Button href="/docs/chat/copilot" text="Explore Layouts" variant="secondary" />
        </div>
      </section>

      <Separator className="my-8 sm:my-12" />

      <section>
        <SectionHeader
          icon={Layout}
          title="Batteries-Included Layouts"
          description="Choose the surface that matches your product and customize from there."
        />

        <FeatureCards>
          {layoutOptions.map((item) => (
            <FeatureCard
              key={item.href}
              icon={item.icon}
              title={item.title}
              description={item.description}
              href={item.href}
            />
          ))}
        </FeatureCards>
      </section>

      <Separator className="my-8 sm:my-12" />

      <section className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
        <div className="space-y-8">
          <SectionHeader
            icon={Zap}
            title="Core Capabilities"
            description="The SDK handles the stateful parts so you can focus on UX, product logic, and polish."
          />

          <FeatureCards direction="horizontal">
            {capabilities.map((item) => (
              <FeatureCard
                key={item.title}
                direction="horizontal"
                icon={item.icon}
                title={item.title}
                description={item.description}
              />
            ))}
          </FeatureCards>
        </div>

        <div className="space-y-6">
          <SectionHeader
            icon={Code2}
            title="Go Headless"
            description="Use the same chat primitives without the prebuilt layouts when you need a fully custom surface."
          />

          <SimpleCard className="space-y-4 p-4 sm:p-5">
            <p className="text-sm leading-6 text-fd-muted-foreground">
              The `useChat` hook gives you message state, append helpers, and loading semantics
              without locking you into a specific UI.
            </p>
            <CodeBlock code={headlessCode} title="CustomChat.tsx" />
            <Link
              href="/docs/chat/headless-intro"
              className="inline-flex items-center text-sm font-medium text-fd-foreground transition-colors hover:text-fd-muted-foreground"
            >
              Read the Headless Guide
            </Link>
          </SimpleCard>
        </div>
      </section>
    </div>
  );
}
