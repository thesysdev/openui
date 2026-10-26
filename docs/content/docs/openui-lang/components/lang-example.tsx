"use client";

import {
  CodeBlock,
  SimpleCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/overview-components";
import { genuiOutput } from "@/components/overview-components/genui";
import dynamic from "next/dynamic";

// The docs route bundles the client components of every MDX page, so a static
// import would put @openuidev/react-ui (~2 MB) on every docs page. Loaded on
// demand, it only ships with the page that renders this example.
const LangExamplePreview = dynamic(() =>
  import("./lang-example-preview").then((m) => m.LangExamplePreview),
);

export const LangExample = () => {
  return (
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
          <TabsTrigger value="system-prompt" className="px-1 sm:px-2">
            System Prompt
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
import { z } from 'zod/v4';

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
        <TabsContent value="system-prompt" className="mt-3 flex-1">
          <div className="mb-3 text-sm font-medium">Generate System Prompt with CLI</div>
          <CodeBlock
            title=""
            code={`npx @openuidev/cli@latest generate path/to/library.ts --out system-prompt.txt`}
          />
          <div className="my-3 text-sm font-medium">Send system prompt to the LLM</div>
          <CodeBlock
            title=""
            code={`import fs from "fs";
const systemPrompt = fs.readFileSync("system-prompt.txt", "utf8");
const completion = await client.chat.completions.create({
  model: "gpt-5.2",
  stream: true,
  messages: [{ role: "system", content: systemPrompt }, ...messages]
})`}
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
          <LangExamplePreview />
        </div>
      </SimpleCard>
    </div>
  );
};
