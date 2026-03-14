// ─── Component Definition ─────────────────────────────────────────────────────

export { defineComponent, createLibrary } from "./library.js";
export type {
	ComponentRenderProps,
	ComponentRenderer,
	DefinedComponent,
	Library,
	LibraryDefinition,
	ComponentGroup,
	PromptOptions,
	SubComponentOf,
} from "./library.js";

// ─── Renderer Component ───────────────────────────────────────────────────────

export { default as Renderer } from "./Renderer.svelte";

// ─── Context API ──────────────────────────────────────────────────────────────

export {
	getOpenUIContext,
	getTriggerAction,
	getIsStreaming,
	getGetFieldValue,
	getSetFieldValue,
	getFormName,
	useSetDefaultValue,
	setFormNameContext,
} from "./context.svelte.js";
export type { OpenUIContextValue, ActionConfig } from "./context.svelte.js";

// ─── Form Validation ──────────────────────────────────────────────────────────

export {
	createFormValidation,
	getFormValidation,
	setFormValidationContext,
	builtInValidators,
	parseRules,
	validate,
} from "./validation.js";
export type {
	FormValidationContextValue,
	ParsedRule,
	ValidatorFn,
} from "./validation.js";

// ─── Re-export Shared Types from react-lang ──────────────────────────────────

export type {
	ElementNode,
	ParseResult,
	ActionEvent,
	ValidationError,
} from "@openuidev/react-lang";
export { BuiltinActionType } from "@openuidev/react-lang";

// ─── Re-export Parser for Server-Side Use ────────────────────────────────────

export {
	createParser,
	createStreamingParser,
	type LibraryJSONSchema,
} from "@openuidev/react-lang";
