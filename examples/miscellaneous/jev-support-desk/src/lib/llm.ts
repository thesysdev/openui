import spec from "@/generated/spec.json";
import { generateSystemPrompt } from "@openuidev/lang-core";
import { openuiPromptOptions } from "@openuidev/react-ui/genui-lib/prompt-options";
import OpenAI from "openai";
import { TOOLS } from "./tools";

const openai = new OpenAI();
const MODEL = process.env.OPENAI_MODEL ?? "google/gemini-3.8-flash";
// OpenRouter only: pin one upstream. Other endpoints ignore the field.
const provider = process.env.OPENROUTER_PROVIDER
  ? { provider: { order: [process.env.OPENROUTER_PROVIDER], allow_fallbacks: false } }
  : {};
const options = { model: MODEL, reasoning_effort: "minimal" as const, ...provider };

const RULES = [
  "You write one self-service screen for Parcel & Co., an online store. Output only openui-lang code, without code fences.",
  "The screen is saved and reused for other customers and items. Never write a name, item, order id, price, date or address as a string. Read them from Query results and join text with +.",
  'Start from ctx = Query("get_request_context", {}, {customer: {firstName: ""}, item: null}).',
  'Declare $variables with empty defaults (""). Never prefill a field from the request.',
  "Take Select options from tool results. Run actions with Mutation and show result.data or result.error in a Callout.",
  "Keep it short: a header, the key details, then the form or action.",
];

const systemPrompt = generateSystemPrompt({
  library: spec,
  promptOptions: {
    ...openuiPromptOptions,
    additionalRules: RULES,
    tools: TOOLS,
  },
});

export async function writeScreen(
  request: string,
  onText: (text: string) => void,
  signal: AbortSignal,
) {
  const stream = await openai.chat.completions.create(
    {
      ...options,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: request },
      ],
    },
    { signal },
  );
  let program = "";
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? "";
    program += text;
    if (text) onText(text);
  }
  return program.replace(/^```\w*\n?|```\s*$/g, "").trim();
}

/** Title plus a description with example requests, for Jev to match later requests against. */
export async function describe(request: string, program: string) {
  const res = await openai.chat.completions.create({
    ...options,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          'This support screen will be reused for other customers. Reply with JSON: {"title": "3-5 words", "description": "one sentence on the task it does, then five varied example requests about different products"}. Be precise: a return screen does not do exchanges or tracking.',
      },
      { role: "user", content: `Request: ${request}\n\n${program}` },
    ],
  });
  const { title, description } = JSON.parse(res.choices[0]?.message?.content ?? "{}");
  return { title: title ?? request, description: description ?? request };
}
