import { BASE_URL } from "@/lib/source";
import { generatePrompt, type PromptSpec } from "@openuidev/lang-core";
import { readFileSync } from "fs";
import { type NextRequest } from "next/server";
import { join } from "path";
import {
  GITHUB_ADDITIONAL_RULES,
  GITHUB_PREAMBLE,
  GITHUB_TOOL_EXAMPLES,
} from "../../../playground/github/prompt-config";
import { GITHUB_TOOL_SPECS } from "../../../playground/github/types";

// ── Static system prompt (generic mode) ────────────────────────────────────

const staticPrompt = readFileSync(
  join(process.cwd(), "generated/playground-system-prompt.txt"),
  "utf-8",
);

// ── Component spec from generated JSON (server-safe, no React) ─────────────

const componentSpec = JSON.parse(
  readFileSync(join(process.cwd(), "generated/playground-component-spec.json"), "utf-8"),
) as PromptSpec;

// ── GitHub system prompt (dynamic) ─────────────────────────────────────────

function buildGitHubPrompt(): string {
  return generatePrompt({
    ...componentSpec,
    tools: GITHUB_TOOL_SPECS,
    toolExamples: GITHUB_TOOL_EXAMPLES,
    additionalRules: GITHUB_ADDITIONAL_RULES,
    preamble: GITHUB_PREAMBLE,
    editMode: true,
    inlineMode: true,
    toolCalls: true,
    bindings: true,
  });
}

let cachedGitHubPrompt: string | null = null;
function getGitHubPrompt(): string {
  if (!cachedGitHubPrompt) cachedGitHubPrompt = buildGitHubPrompt();
  return cachedGitHubPrompt;
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { model, prompt, dataSource, messages } = await req.json();

  const systemPrompt = dataSource === "github" ? getGitHubPrompt() : staticPrompt;

  // Build message array — support multi-turn via messages[]
  const chatMessages: Array<{ role: string; content: string }> = [
    { role: "system", content: systemPrompt },
  ];
  if (messages && Array.isArray(messages)) {
    for (const m of messages) {
      chatMessages.push({ role: m.role, content: m.content });
    }
  }
  chatMessages.push({ role: "user", content: prompt });

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: { message: "OPENROUTER_API_KEY not configured" } },
      { status: 500 },
    );
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": `${BASE_URL}/playground`,
      "X-Title": "OpenUI Playground",
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: chatMessages,
    }),
    signal: req.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return Response.json(
      {
        error: (err as { error?: { message?: string } }).error ?? {
          message: `OpenRouter error ${res.status}`,
        },
      },
      { status: res.status },
    );
  }

  return new Response(res.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
