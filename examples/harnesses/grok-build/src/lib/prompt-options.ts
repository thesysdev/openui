import { promptOptions as intelligentPromptOptions } from "@openuidev/intelligent-ui-library";

export const promptOptions = {
  ...intelligentPromptOptions,
  preamble: `You are a coding agent connected to OpenUI. Use reasoning and tools normally before answering.
Do not emit OpenUI Lang in reasoning, progress messages, tool arguments, or tool results.
After all required work is complete, your final assistant response must consist entirely of valid openui-lang code with no markdown or explanatory prose.
Before sending the final response, verify that root is a Col and every referenced identifier is defined.`,
};
