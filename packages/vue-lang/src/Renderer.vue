<script setup lang="ts">
import type { ActionEvent, ElementNode, ParseResult } from "@openuidev/lang-core";
import { BuiltinActionType, createParser } from "@openuidev/lang-core";
import { computed, h, ref, toRef, watch } from "vue";
import type { ActionConfig } from "./context.js";
import { provideOpenUIContext } from "./context.js";
import type { Library, RenderNodeResult } from "./library.js";
import RenderNode from "./RenderNode.vue";

interface RendererProps {
	/** Raw response text (openui-lang code). */
	response: string | null;
	/** Component library from createLibrary(). */
	library: Library;
	/** Whether the LLM is still streaming (form interactions disabled during streaming). */
	isStreaming?: boolean;
	/** Callback when a component triggers an action. */
	onAction?: (event: ActionEvent) => void;
	/**
	 * Called whenever a form field value changes. Receives the raw form state map.
	 * The consumer decides how to persist this (e.g. embed in message, store separately).
	 */
	onStateUpdate?: (state: Record<string, any>) => void;
	/**
	 * Initial form state to hydrate on load (e.g. from a previously persisted message).
	 * Shape: { formName: { fieldName: { value, componentType } } }
	 */
	initialState?: Record<string, any>;
	/** Called whenever the parse result changes. */
	onParseResult?: (result: ParseResult | null) => void;
}

const props = withDefaults(defineProps<RendererProps>(), {
	isStreaming: false,
});

// ─── Parser (created once from the library's JSON schema) ───
// Intentional: parser is created once, not reactive on library changes (matches react-lang).
const parser = createParser(props.library.toJSONSchema());

// ─── Parse result (derived from response) ───
const result = computed<ParseResult | null>(() => {
	if (!props.response) return null;
	try {
		return parser.parse(props.response);
	} catch (e) {
		console.error("[openui] Parse error:", e);
		return null;
	}
});

// ─── Form state ───
const formState = ref<Record<string, any>>(props.initialState ?? {});

// Sync if initialState changes (e.g. loading a different message)
watch(
	() => props.initialState,
	(newVal, oldVal) => {
		if (newVal !== oldVal) {
			formState.value = newVal ?? {};
		}
	},
);

// ─── Notify on parse result change ───
watch(result, (r) => {
	props.onParseResult?.(r);
}, { immediate: true });

// ─── Form state functions ───

function getFieldValue(formName: string | undefined, name: string): any {
	return formName ? formState.value[formName]?.[name]?.value : formState.value[name]?.value;
}

function setFieldValue(
	formName: string | undefined,
	componentType: string | undefined,
	name: string,
	value: any,
	shouldTriggerSaveCallback: boolean = true,
): void {
	if (formName) {
		formState.value[formName] = {
			...formState.value[formName],
			[name]: { value, componentType },
		};
	} else {
		formState.value[name] = { value, componentType };
	}

	if (shouldTriggerSaveCallback && props.onStateUpdate) {
		props.onStateUpdate({ ...formState.value });
	}
}

function triggerAction(userMessage: string, formName?: string, action?: ActionConfig): void {
	const actionType = action?.type || BuiltinActionType.ContinueConversation;
	const actionParams = action?.params;

	// Collect relevant form state
	let relevantState: Record<string, any> | undefined;
	if (formName && formState.value[formName]) {
		relevantState = { [formName]: formState.value[formName] };
	} else if (Object.keys(formState.value).length > 0) {
		relevantState = formState.value;
	}

	if (!props.onAction) return;

	props.onAction({
		type: actionType,
		params: actionParams || {},
		humanFriendlyMessage: userMessage,
		formState: relevantState,
		formName,
	});
}

// ─── Render node function ───

function renderNode(value: unknown): RenderNodeResult {
	if (value == null) return null;
	if (typeof value === "string") return value;
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	if (Array.isArray(value)) {
		return value.flatMap((item) => {
			const result = renderNode(item);
			return Array.isArray(result) ? result : [result];
		});
	}
	if (typeof value === "object" && (value as any).type === "element") {
		return h(RenderNode, { node: value as ElementNode });
	}
	return null;
}

// ─── Provide context ───
provideOpenUIContext({
	library: props.library,
	renderNode,
	triggerAction,
	isStreaming: toRef(props, "isStreaming"),
	getFieldValue,
	setFieldValue,
});
</script>

<template>
	<RenderNode v-if="result?.root" :node="result.root" />
</template>
