// Server-safe entry: kit definitions (prompt, rules, gallery dashboards), tool
// contracts, sample-data handlers, and prompt assembly. Nothing here imports
// React, so a route handler can use it directly.

import type { KitDefinition } from "./core/kit";
import type { ToolHandler } from "./core/prompt";
import { analyticsHandlers } from "./kits/analytics/data";
import { analyticsKit } from "./kits/analytics/kit";
import { ecommerceHandlers } from "./kits/ecommerce/data";
import { ecommerceKit } from "./kits/ecommerce/kit";

export {
  BASE_COMPONENT_GROUPS,
  BASE_RULES,
  COMPOSITION_RULES,
  DATA_RULES,
} from "./core/base-prompt";
export { defineTool, toToolSpec } from "./core/kit";
export type { GalleryDashboard, KitDefinition, KitTool } from "./core/kit";
export { buildSystemPrompt, PROMPT_BUDGET, rankGallery, runTool } from "./core/prompt";
export type { PromptOptions, ToolHandler } from "./core/prompt";
export * from "./core/schemas";
export { analyticsTools } from "./kits/analytics/tools";
export { ecommerceTools } from "./kits/ecommerce/tools";
export { analyticsHandlers, analyticsKit, ecommerceHandlers, ecommerceKit };

/** Every kit, in display order. */
export const KITS: KitDefinition[] = [ecommerceKit, analyticsKit];

/** Sample-data tool handlers for each kit: Sundial Goods and Relay. */
export const SAMPLE_HANDLERS: Record<string, Record<string, ToolHandler>> = {
  ecommerce: ecommerceHandlers,
  analytics: analyticsHandlers,
};

export function getKit(id: string): KitDefinition | undefined {
  return KITS.find((kit) => kit.id === id);
}
