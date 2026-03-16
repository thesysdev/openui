// ─── Component definition ───

export { createLibrary, defineComponent } from "./library.js";
export type {
	ComponentGroup,
	ComponentRenderProps,
	ComponentRenderer,
	DefinedComponent,
	Library,
	LibraryDefinition,
	PromptOptions,
	SubComponentOf,
} from "./library.js";

// ─── Renderer ───

import type { Library } from "./library.js";
import type { ActionEvent, ParseResult } from "@openuidev/lang-core";

export { default as Renderer } from "./Renderer.svelte";

/** Props accepted by the Renderer component. */
export interface RendererProps {
	response: string | null;
	library: Library;
	isStreaming?: boolean;
	onAction?: (event: ActionEvent) => void;
	onStateUpdate?: (state: Record<string, any>) => void;
	initialState?: Record<string, any>;
	onParseResult?: (result: ParseResult | null) => void;
}

// ─── Context (for use inside component renderers) ───

export {
	getFormName,
	getGetFieldValue,
	getIsStreaming,
	getOpenUIContext,
	getSetFieldValue,
	getTriggerAction,
	setFormNameContext,
	setOpenUIContext,
	useSetDefaultValue,
} from "./context.svelte.js";
export type { ActionConfig, OpenUIContextValue } from "./context.svelte.js";

// ─── Form validation ───

export {
	createFormValidation,
	getFormValidation,
	setFormValidationContext,
} from "./validation.svelte.js";
export type { FormValidationContextValue } from "./validation.svelte.js";

export {
	builtInValidators,
	parseRules,
	parseStructuredRules,
	validate,
} from "./validation.svelte.js";
export type { ParsedRule, ValidatorFn } from "./validation.svelte.js";

// ─── Re-exports from lang-core (parser, types) ───

export { BuiltinActionType } from "@openuidev/lang-core";
export type { ActionEvent, ElementNode, ParseResult } from "@openuidev/lang-core";

export { createParser, createStreamingParser, type LibraryJSONSchema } from "@openuidev/lang-core";
