"use client";

import { Button } from "@/components/button";
import {
  CodeBlock,
  Separator,
  SimpleCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  FeatureCard,
  FeatureCards,
} from "@/components/overview-components";
import { ArrowUpRight, Code2, MessageSquare, Package } from "lucide-react";
import { useState } from "react";
import { ChatModal } from "./chat-modal";
import { genuiOutput } from "./genui";

export function OverviewPage() {
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  return (
    <div className="mx-auto max-w-4xl px-3 py-8 font-sans text-slate-900 sm:px-4 sm:py-12 lg:px-8 dark:text-slate-100">
      {/* Introduction */}
      <div id="overview" className="mb-12 sm:mb-20">
        <h1 className="mb-3 text-3xl font-bold sm:mb-4 sm:text-4xl">Overview</h1>
        <p className="mb-6 text-base text-slate-600 sm:mb-8 sm:text-lg dark:text-slate-400">
          OpenUI is a comprehensive toolkit for building LLM-powered user interfaces. It consists of
          three core modules that work together to provide an efficient, type-safe, and
          production-ready solution for generative UI.
        </p>

        {/* Quick Navigation */}
        <FeatureCards>
          <FeatureCard
            icon={<Code2 />}
            title="OpenUI Lang"
            description="Token-efficient DSL for structured LLM outputs with automatic prompt generation"
            href="#genui-lang"
          />
          <FeatureCard
            icon={<MessageSquare />}
            title="OpenUI Chat"
            description="Production-ready, themeable chat components with headless state management"
            href="#chat-ui"
          />
          <FeatureCard
            icon={<Package />}
            title="Default Component Library"
            description="50+ pre-built components optimized for LLM generation, ready to use"
            href="#library"
          />
        </FeatureCards>
      </div>

      {/* OpenUI Lang Section */}
      <div id="genui-lang" className="mb-12 sm:mb-20">
        <div className="mb-4 flex items-start gap-3 sm:mb-6 sm:gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fd-muted sm:size-12">
            <Code2 className="size-5 text-fd-foreground sm:size-6" />
          </div>
          <div>
            <h2 className="mb-1 text-2xl font-bold sm:mb-2 sm:text-3xl">OpenUI Lang</h2>
            <p className="text-sm text-slate-500 sm:text-base dark:text-slate-400">
              A custom language designed for token efficiency and accuracy in structured LLM outputs
            </p>
          </div>
        </div>

        <p className="mb-4 text-sm text-slate-600 sm:mb-6 sm:text-base dark:text-slate-400">
          An alternative to{" "}
          <a
            href="https://json-render.dev/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline "
          >
            Vercel JSON renderer
          </a>{" "}
          and{" "}
          <a
            href="https://a2ui.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            A2UI
          </a>{" "}
          that reduces token usage by up to 67.1%. Define your component library with Zod schemas, get
          automatic system prompts, and parse LLM responses into renderable components.
        </p>

        <SimpleCard className="mb-4 border-blue-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm">
            <strong>Quick start:</strong> Use our{" "}
            <a href="#library" className="underline">
              default component library
            </a>{" "}
            to get started immediately with 50+ pre-built components.
          </p>
        </SimpleCard>

        <h3 className="mb-3 text-base font-semibold sm:mb-4 sm:text-lg">Quick Example</h3>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Left: Code Tabs */}
          <Tabs defaultValue="llm-output" className="flex w-full flex-col">
            <TabsList className="grid w-full grid-cols-2 text-xs sm:text-sm">
              <TabsTrigger value="define-library" className="px-1 sm:px-2">
                Define Lib
              </TabsTrigger>
              <TabsTrigger value="render-code" className="px-1 sm:px-2">
                Render Code
              </TabsTrigger>
              <TabsTrigger value="llm-output" className="px-1 sm:px-2">
                LLM Output
              </TabsTrigger>
            </TabsList>

            <TabsContent value="define-library" className="mt-3 flex-1">
              <CodeBlock
                className="h-full"
                title="Component Library Definition"
                code={`import { defineComponent, createLibrary } from '@openuidev/react-lang';
import { z } from 'zod';

const MyCard = defineComponent({
  name: 'MyCard',
  description: 'Display a card with multiple children',
  props: z.object({
    children: z.array(z.any()),
  }),
  component: ({ props, renderNode }) => <div>{renderNode(props.children)}</div>,
  ...
});

export const myLibrary = createLibrary({
  components: [MyCard, ...otherComponents],
});`}
              />
            </TabsContent>

            <TabsContent value="render-code" className="mt-3 flex-1">
              <CodeBlock
                title="Rendering Code"
                code={`import { Renderer } from '@openuidev/react-lang';
import { myLibrary } from './library';

// Inside your Chat Message component
export function AssistantMessage({ content, isStreaming }) {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <Renderer
        library={myLibrary}
        response={content}
        isStreaming={isStreaming}
      />
    </div>
  );
}`}
              />
            </TabsContent>

            <TabsContent value="llm-output" className="mt-3 flex-1">
              <CodeBlock title="OpenUI Lang (Token Efficient)" code={genuiOutput} />
            </TabsContent>
          </Tabs>
          <SimpleCard className="flex h-full flex-col border-2">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
              <span className="text-sm font-medium">Output Preview</span>
            </div>
            <div className="p-6">
              <img src="/images/openui-lang/example.png" alt="Quick Example" />
            </div>
          </SimpleCard>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:mt-6 sm:flex-row">
          <Button href="/docs/openui-lang" text="Get Started with OpenUI Lang" variant="primary" />
          <Button href="/docs/chat" text="Usage with OpenUI Chat" variant="secondary" />
        </div>
      </div>

      <Separator className="my-8 sm:my-16" />

      {/* Chat UI Section */}
      <div id="chat-ui" className="mb-12 sm:mb-20">
        <div className="mb-4 flex items-start gap-3 sm:mb-6 sm:gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fd-muted sm:size-12">
            <MessageSquare className="size-5 text-fd-foreground sm:size-6" />
          </div>
          <div>
            <h2 className="mb-1 text-2xl font-bold sm:mb-2 sm:text-3xl">OpenUI Chat</h2>
            <p className="text-sm text-slate-500 sm:text-base dark:text-slate-400">
              Production-ready, themeable chat components with headless state management
            </p>
          </div>
        </div>

        <p className="mb-4 text-sm text-slate-600 sm:mb-6 sm:text-base dark:text-slate-400">
          Pre-built chat layouts (Copilot, Fullscreen, Bottom Tray) or build custom UIs with
          headless hooks. Fully themeable and accessible out of the box.
        </p>

        <FeatureCards direction="horizontal" cols={3} className="mb-6">
          <FeatureCard
            direction="horizontal"
            title="Copilot"
            description="Floating widget for AI assistants"
          />
          <FeatureCard
            direction="horizontal"
            title="Fullscreen"
            description="Full-page chat interface"
          />
          <FeatureCard
            direction="horizontal"
            title="Bottom Tray"
            description="Slide-up mobile tray"
          />
        </FeatureCards>

        {/* Interactive Demo */}
        <div
          className="group mb-6 cursor-pointer overflow-hidden rounded-xl border-2 border-slate-200 transition-all hover:border-blue-400 hover:shadow-lg dark:border-slate-700 dark:hover:border-blue-500"
          onClick={() => setIsChatModalOpen(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setIsChatModalOpen(true)}
        >
          <div className="relative">
            <img
              src="/images/openui-lang/compare.png"
              alt="OpenUI Chat Demo - Click to try it live"
              className="w-full"
            />
            <div className="absolute inset-0 bg-black/0 transition-all group-hover:bg-black/5" />
          </div>
          <div className="flex items-start justify-between border-t border-slate-200 px-5 py-4 dark:border-slate-700">
            <div>
              <h3 className="text-lg font-semibold">Try it out live</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Live interactive demo of OpenUI Chat in action
              </p>
            </div>
            <ArrowUpRight className="mt-1 size-5 shrink-0 text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 dark:text-slate-500" />
          </div>
        </div>

        {isChatModalOpen && <ChatModal onClose={() => setIsChatModalOpen(false)} />}

        <div className="mb-6">
          <CodeBlock
            title="Quick example"
            code={`import "@openuidev/react-ui/components.css";
import "@openuidev/react-ui/styles/index.css";
import { FullScreen, openuiLibrary } from "@openuidev/react-ui";

<FullScreen
  apiUrl="/api/chat"
  componentLibrary={openuiLibrary}
/>
`}
          />
        </div>

        <div className="flex gap-3">
          <Button
            href="/docs/chat/quick-start"
            text="Get Started with OpenUI Chat"
            variant="primary"
          />
          <Button href="/docs/chat" text="View Components" variant="secondary" />
        </div>
      </div>

      <Separator className="my-8 sm:my-16" />

      {/* OpenUI Library Section */}
      <div id="library" className="mb-12 sm:mb-20">
        <div className="mb-4 flex items-start gap-3 sm:mb-6 sm:gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fd-muted sm:size-12">
            <Package className="size-5 text-fd-foreground sm:size-6" />
          </div>
          <div>
            <h2 className="mb-1 text-2xl font-bold sm:mb-2 sm:text-3xl">
              Default Component Library
            </h2>
            <p className="text-sm text-slate-500 sm:text-base dark:text-slate-400">
              Pre-built components defined using OpenUI language
            </p>
          </div>
        </div>

        <p className="mb-4 text-sm text-slate-600 sm:mb-6 sm:text-base dark:text-slate-400">
          50+ production-ready components optimized for LLM generation. Use them directly or extend
          with your own custom components. Includes layouts, forms, data display, charts, and more.
        </p>

        <FeatureCards direction="horizontal" cols={4} className="mb-4 sm:mb-6">
          <FeatureCard direction="horizontal" title="Layout" description="Grid, Stack, Flex" />
          <FeatureCard direction="horizontal" title="Forms" description="Input, Select, Radio" />
          <FeatureCard
            direction="horizontal"
            title="Data Display"
            description="Table, Card, Badge"
          />
          <FeatureCard direction="horizontal" title="Charts" description="Line, Bar, Pie" />
        </FeatureCards>

        <div className="mb-4">
          <Tabs defaultValue="quick-example" className="mb-6">
            <TabsList className="grid w-full grid-cols-2 text-xs sm:text-sm">
              <TabsTrigger value="quick-example" className="px-1 sm:px-2">
                Quick Example
              </TabsTrigger>
              <TabsTrigger value="usage-with-chat" className="px-1 sm:px-2">
                With Chat
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quick-example" className="mt-4">
              <CodeBlock
                title="Quick example"
                code={`import { createLibrary, defineComponent } from '@openuidev/react-lang';
import { openuiLibrary, openuiPromptOptions } from '@openuidev/react-ui';
import { z } from 'zod';

const prompt = openuiLibrary.prompt(openuiPromptOptions);

const CustomWidget = defineComponent({
  name: 'CustomWidget',
  description: 'A simple custom widget',
  props: z.object({
    title: z.string(),
  }),
  component: () => null,
});

const customLibrary = createLibrary({
  root: openuiLibrary.root ?? 'Stack',
  componentGroups: openuiLibrary.componentGroups,
  components: [...Object.values(openuiLibrary.components), CustomWidget],
});`}
              />
            </TabsContent>

            <TabsContent value="usage-with-chat" className="mt-4">
              <CodeBlock
                title="Using with Chat UI"
                code={`import { Copilot, openuiLibrary } from '@openuidev/react-ui';

function App() {
  return (
    <Copilot
      apiUrl="/api/chat"
      componentLibrary={openuiLibrary}
    />
  );
}`}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
