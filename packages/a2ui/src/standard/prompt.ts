import type { PromptOptions } from "@openuidev/lang-core";
import { BASIC_CATALOG_FUNCTIONS } from "./catalog";

export interface A2UIPromptOptionsInput {
  /** Catalog function names the model may call. Defaults to the Basic Catalog's. */
  functions?: Iterable<string>;
}

/**
 * Prompt options that keep a model to the part of OpenUI Lang an A2UI catalog
 * can express, for `library.prompt(a2uiPromptOptions())`. They turn off
 * OpenUI's built-ins, state and tool calls, and add the rules for data,
 * catalog functions and events. Spread your own `preamble`, `additionalRules`
 * and `examples` over the result.
 */
export function a2uiPromptOptions(input: A2UIPromptOptionsInput = {}): PromptOptions {
  const functions = [...(input.functions ?? Object.keys(BASIC_CATALOG_FUNCTIONS))];
  return {
    bindings: false,
    toolCalls: false,
    builtinFunctions: false,
    additionalRules: [
      "Data: declare data as `$name = value` (a string, number, boolean, list or object). Read it with `$name`, `$name.field` or `$list[0]`. Inputs write back to the `$variable` they are bound to.",
      `Functions: build text and checks with the A2UI catalog functions, written with @: ${functions.map((f) => `@${f}`).join(", ")}. For example \`@formatString("Total: \${/order/total}")\` (inside the string, data paths use \`\${/path/to/value}\`). No operators (such as + or ==), no ternaries and no other @functions are available.`,
      "Events: a Button's action is `@eventName({key: $value, ...})`. Use a short camelCase event name that says what happened, and put the values the agent needs in the object.",
      "Pass `null` to skip an optional argument that comes before one you need.",
      "Use only the values listed for an argument that has a fixed set of values, such as icon names.",
    ],
  };
}
