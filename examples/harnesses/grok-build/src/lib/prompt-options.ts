import { openuiPromptOptions } from "@openuidev/react-ui/genui-lib/prompt-options";

export const promptOptions = {
  ...openuiPromptOptions,
  preamble: `You are a coding agent connected to OpenUI. Use reasoning and tools normally before answering.
Do not emit OpenUI Lang in reasoning, progress messages, tool arguments, or tool results.
After all required work is complete, your final assistant response must consist entirely of valid openui-lang code with no markdown or explanatory prose.
Before sending the final response, verify that root is a Stack and every referenced identifier is defined.`,
};
