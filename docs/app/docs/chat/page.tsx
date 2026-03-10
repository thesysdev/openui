import { Button } from "@/components/button";
import { HeroBadge } from "@/components/hero-badge";
import { CodeBlock, FeatureCard, FeatureCards } from "@/components/overview-components";
import {
  Code2,
  Database,
  Layout,
  Maximize2,
  MessageCircle,
  MessageSquare,
  Palette,
  PanelRightOpen,
  Zap,
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

export default function ChatOverviewPage() {
  return (
    <div className="max-w-5xl mx-auto py-10 px-6 space-y-20">
      {/* --- Hero Section --- */}
      <section className="space-y-6 text-center md:text-left">
        <HeroBadge icon="MessageSquare" text="Generative UI Chat" />
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          OpenUI{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Chat SDK
          </span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          A complete framework for building AI interfaces. Use our{" "}
          <strong>pre-built layouts</strong> for speed, or our <strong>headless hooks</strong> for
          total control.
        </p>

        <div className="flex flex-wrap gap-4 pt-2 justify-center md:justify-start">
          <Button href="/docs/chat/installation" text="Installation" variant="primary" />
          <Button href="/docs/chat/copilot" text="Explore Layouts" variant="secondary" />
        </div>
      </section>

      {/* --- Layouts Showcase --- */}
      <section>
        <div className="flex items-center gap-2 mb-8">
          <Layout className="text-fd-foreground" />
          <h2 className="text-2xl font-bold">Batteries-Included Layouts</h2>
        </div>

        <FeatureCards>
          <FeatureCard
            icon={<PanelRightOpen />}
            title="Copilot"
            description="A sidebar assistant that lives alongside your main application content."
            href="/docs/chat/copilot"
          />
          <FeatureCard
            icon={<Maximize2 />}
            title="Full Screen"
            description="A standalone, immersive chat page similar to ChatGPT or Claude."
            href="/docs/chat/fullscreen"
          />
          <FeatureCard
            icon={<MessageCircle />}
            title="Bottom Tray"
            description="A floating support-style widget that expands from the bottom corner."
            href="/docs/chat/bottom-tray"
          />
        </FeatureCards>
      </section>

      {/* --- Headless / Features Split --- */}
      <section className="grid lg:grid-cols-2 gap-12 items-start">
        {/* Left: Core Features */}
        <div className="space-y-8">
          <div className="flex items-center gap-2">
            <Zap className="text-fd-foreground" />
            <h2 className="text-2xl font-bold">Core Capabilities</h2>
          </div>

          <FeatureCards direction="horizontal">
            <FeatureCard
              direction="horizontal"
              icon={<MessageSquare />}
              title="Streaming Native"
              description="Handles text deltas, optimistic updates, and loading states automatically."
            />
            <FeatureCard
              direction="horizontal"
              icon={<Database />}
              title="Thread Persistence"
              description="Built-in support for saving and loading conversation history via simple API contracts."
            />
            <FeatureCard
              direction="horizontal"
              icon={<Palette />}
              title="Theming"
              description="Customize every color, radius, and font using CSS variables or Tailwind."
            />
          </FeatureCards>
        </div>

        {/* Right: Headless Code Snippet */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Code2 className="text-fd-foreground" />
            <h2 className="text-2xl font-bold">Go Headless</h2>
          </div>

          <p className="text-slate-600 dark:text-slate-400">
            Need full control? Use the `useChat` hook to build your own UI while we handle the
            state.
          </p>

          <CodeBlock code={headlessCode} title="CustomChat.tsx" />

          <div className="text-right">
            <Link
              href="/docs/chat/headless-intro"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Read the Headless Guide →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
