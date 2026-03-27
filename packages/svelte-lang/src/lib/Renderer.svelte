<script lang="ts">
	import type { ActionEvent, ElementNode, ParseResult } from "@openuidev/lang-core";
	import { createParser, BuiltinActionType } from "@openuidev/lang-core";
	import type { Library } from "./library.js";
	import type { ActionConfig } from "./context.svelte.js";
	import { setOpenUIContext } from "./context.svelte.js";
	import RenderNode from "./RenderNode.svelte";

	interface Props {
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

	let {
		response,
		library,
		isStreaming = false,
		onAction,
		onStateUpdate,
		initialState,
		onParseResult,
	}: Props = $props();

	// ─── Parser (created once from the library's JSON schema) ───
	// Intentional: parser is created once, not reactive on library changes (matches react-lang).
	// svelte-ignore state_referenced_locally
	const parser = createParser(library.toJSONSchema());

	// ─── Parse result (derived from response) ───
	let result = $derived<ParseResult | null>(
		response
			? (() => {
					try {
						return parser.parse(response);
					} catch (e) {
						console.error("[openui] Parse error:", e);
						return null;
					}
				})()
			: null,
	);

	// ─── Form state ───
	// svelte-ignore state_referenced_locally
	let formState = $state<Record<string, any>>(initialState ?? {});

	// Sync if initialState changes (e.g. loading a different message)
	// svelte-ignore state_referenced_locally
	let prevInitialState = initialState;
	$effect(() => {
		if (prevInitialState !== initialState) {
			prevInitialState = initialState;
			formState = initialState ?? {};
		}
	});

	// ─── Notify on parse result change ───
	$effect(() => {
		onParseResult?.(result);
	});

	// ─── Form state functions ───

	function getFieldValue(formName: string | undefined, name: string): any {
		return formName ? formState[formName]?.[name]?.value : formState[name]?.value;
	}

	function setFieldValue(
		formName: string | undefined,
		componentType: string | undefined,
		name: string,
		value: any,
		shouldTriggerSaveCallback: boolean = true,
	): void {
		if (formName) {
			formState[formName] = {
				...formState[formName],
				[name]: { value, componentType },
			};
		} else {
			formState[name] = { value, componentType };
		}

		if (shouldTriggerSaveCallback && onStateUpdate) {
			onStateUpdate({ ...formState });
		}
	}

	function triggerAction(userMessage: string, formName?: string, action?: ActionConfig): void {
		const actionType = action?.type || BuiltinActionType.ContinueConversation;
		const actionParams = action?.params;

		// Collect relevant form state
		let relevantState: Record<string, any> | undefined;
		if (formName && formState[formName]) {
			relevantState = { [formName]: formState[formName] };
		} else if (Object.keys(formState).length > 0) {
			relevantState = formState;
		}

		if (!onAction) return;

		onAction({
			type: actionType,
			params: actionParams || {},
			humanFriendlyMessage: userMessage,
			formState: relevantState,
			formName,
		});
	}

	// ─── Provide context ───
	setOpenUIContext({
		get library() {
			return library;
		},
		triggerAction,
		get isStreaming() {
			return isStreaming;
		},
		getFieldValue,
		setFieldValue,
	});
</script>

{#snippet renderNode(value: unknown)}
	{#if value == null}
		<!-- empty: null/undefined -->
	{:else if typeof value === "string"}
		{value}
	{:else if typeof value === "number" || typeof value === "boolean"}
		{String(value)}
	{:else if Array.isArray(value)}
		{#each value as item}
			{@render renderNode(item)}
		{/each}
	{:else if typeof value === "object" && (value as any).type === "element"}
		<RenderNode node={value as ElementNode} {renderNode} />
	{/if}
{/snippet}

{#if result?.root}
	<RenderNode node={result.root} {renderNode} />
{/if}
