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
import { library, ThemeProvider } from "@openuidev/intelligent-ui-library";
import { Renderer } from "@openuidev/react-lang";
import { useTheme } from "next-themes";

export const LangExample = () => {
  const { resolvedTheme } = useTheme();
  const mode = resolvedTheme === "dark" ? "dark" : "light";
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
            code={`// lib/intelligent-ui-library.ts
export { library, promptOptions } from "@openuidev/intelligent-ui-library";`}
          />
        </TabsContent>

        <TabsContent value="render-code" className="mt-3 flex-1">
          <CodeBlock
            title="Rendering Code"
            code={`import { Renderer } from "@openuidev/react-lang";
import { library, ThemeProvider } from "@openuidev/intelligent-ui-library";

export function AssistantMessage({ content, isStreaming, mode }) {
  return (
    <ThemeProvider mode={mode}>
      <Renderer library={library} response={content} isStreaming={isStreaming} />
    </ThemeProvider>
  );
}`}
          />
        </TabsContent>
        <TabsContent value="system-prompt" className="mt-3 flex-1">
          <div className="mb-3 text-sm font-medium">Generate System Prompt with CLI</div>
          <CodeBlock
            title=""
            code={`npx @openuidev/cli@latest generate lib/intelligent-ui-library.ts --spec --out generated/spec.json`}
          />
          <div className="my-3 text-sm font-medium">Send system prompt to the LLM</div>
          <CodeBlock
            title=""
            code={`import { generateSystemPrompt } from "@openuidev/lang-core";
import { promptOptions } from "@openuidev/intelligent-ui-library";
import library from "./generated/spec.json";

const systemPrompt = generateSystemPrompt({ library, promptOptions });
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
          <ThemeProvider mode={mode}>
            <Renderer library={library} response={genuiOutput} isStreaming={false} />
          </ThemeProvider>
        </div>
      </SimpleCard>
    </div>
  );
};
