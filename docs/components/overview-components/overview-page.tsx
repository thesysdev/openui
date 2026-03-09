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
} from "@/components/overview-components";
import { Code2, MessageSquare, Package } from "lucide-react";
import { genuiOutput } from "./genui";

export function OverviewPage() {
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
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <a href="#genui-lang" className="group no-underline">
            <SimpleCard className="h-full p-4 transition-all hover:border-blue-500 hover:shadow-md sm:p-6">
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-blue-50 group-hover:bg-blue-100 sm:mb-4 sm:size-12 dark:bg-blue-900/30 dark:group-hover:bg-blue-900/50">
                <Code2 className="size-5 text-blue-600 sm:size-6 dark:text-blue-400" />
              </div>
              <h3 className="mb-1 text-sm font-semibold sm:mb-2 sm:text-base">OpenUI Lang</h3>
              <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                Token-efficient DSL for structured LLM outputs with automatic prompt generation
              </p>
            </SimpleCard>
          </a>

          <a href="#chat-ui" className="group no-underline">
            <SimpleCard className="h-full p-4 transition-all hover:border-purple-500 hover:shadow-md sm:p-6">
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-purple-50 group-hover:bg-purple-100 sm:mb-4 sm:size-12 dark:bg-purple-900/30 dark:group-hover:bg-purple-900/50">
                <MessageSquare className="size-5 text-purple-600 sm:size-6 dark:text-purple-400" />
              </div>
              <h3 className="mb-1 text-sm font-semibold sm:mb-2 sm:text-base">OpenUI Chat</h3>
              <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                Production-ready, themeable chat components with headless state management
              </p>
            </SimpleCard>
          </a>

          <a href="#library" className="group col-span-2 no-underline sm:col-span-1">
            <SimpleCard className="h-full p-4 transition-all hover:border-emerald-500 hover:shadow-md sm:p-6">
              <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-emerald-50 group-hover:bg-emerald-100 sm:mb-4 sm:size-12 dark:bg-emerald-900/30 dark:group-hover:bg-emerald-900/50">
                <Package className="size-5 text-emerald-600 sm:size-6 dark:text-emerald-400" />
              </div>
              <h3 className="mb-1 text-sm font-semibold sm:mb-2 sm:text-base">
                Default Component Library
              </h3>
              <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                50+ pre-built components optimized for LLM generation, ready to use
              </p>
            </SimpleCard>
          </a>
        </div>
      </div>

      {/* OpenUI Lang Section */}
      <div id="genui-lang" className="mb-12 sm:mb-20">
        <div className="mb-4 flex items-start gap-3 sm:mb-6 sm:gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 sm:size-12 dark:bg-blue-900/30">
            <Code2 className="size-5 text-blue-600 sm:size-6 dark:text-blue-400" />
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
            className="text-blue-600 underline hover:no-underline dark:text-blue-400"
          >
            Vercel JSON renderer
          </a>{" "}
          and{" "}
          <a
            href="https://a2ui.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:no-underline dark:text-blue-400"
          >
            A2UI
          </a>{" "}
          that reduces token usage by up to 52%. Define your component library with Zod schemas, get
          automatic system prompts, and parse LLM responses into renderable components.
        </p>

        <SimpleCard className="mb-4 border-blue-200 bg-blue-50 p-3 sm:p-4 dark:border-blue-900 dark:bg-blue-900/20">
          <p className="text-xs sm:text-sm">
            <strong>Quick start:</strong> Use our{" "}
            <a href="#library" className="text-blue-600 underline dark:text-blue-400">
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
                code={`import { defineComponent, createLibrary } from '@openuidev/lang-react';
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
                code={`import { Renderer } from '@openuidev/lang-react';
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
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 sm:size-12 dark:bg-purple-900/30">
            <MessageSquare className="size-5 text-purple-600 sm:size-6 dark:text-purple-400" />
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

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <SimpleCard className="p-4">
            <h4 className="mb-1 font-medium">Copilot</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Floating widget for AI assistants
            </p>
          </SimpleCard>
          <SimpleCard className="p-4">
            <h4 className="mb-1 font-medium">Fullscreen</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">Full-page chat interface</p>
          </SimpleCard>
          <SimpleCard className="p-4">
            <h4 className="mb-1 font-medium">Bottom Tray</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">Slide-up mobile tray</p>
          </SimpleCard>
        </div>

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

      {/* Default Library Section */}
      <div id="library" className="mb-12 sm:mb-20">
        <div className="mb-4 flex items-start gap-3 sm:mb-6 sm:gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 sm:size-12 dark:bg-emerald-900/30">
            <Package className="size-5 text-emerald-600 sm:size-6 dark:text-emerald-400" />
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

        <div className="mb-4 grid gap-3 sm:mb-6 sm:grid-cols-2 md:grid-cols-4">
          <SimpleCard className="p-3">
            <p className="text-sm font-medium">Layout</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Grid, Stack, Flex</p>
          </SimpleCard>
          <SimpleCard className="p-3">
            <p className="text-sm font-medium">Forms</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Input, Select, Radio</p>
          </SimpleCard>
          <SimpleCard className="p-3">
            <p className="text-sm font-medium">Data Display</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Table, Card, Badge</p>
          </SimpleCard>
          <SimpleCard className="p-3">
            <p className="text-sm font-medium">Charts</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Line, Bar, Pie</p>
          </SimpleCard>
        </div>

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
                code={`import { createLibrary, defineComponent } from '@openuidev/lang-react';
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
