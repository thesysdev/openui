<script lang="ts">
	import type { Library } from "./library.js";
	import type {
		ParseResult,
		ActionEvent,
		ElementNode,
	} from "@openuidev/react-lang";
	import { createParser } from "@openuidev/react-lang";
	import type { ActionConfig } from "./context.svelte.js";
	import RenderNode from "./RenderNode.svelte";
	import { setOpenUIContext } from "./context.svelte.js";

	// ─── Props ────────────────────────────────────────────────────────────────

	interface Props {
		/** Raw OpenUI Lang text */
		response: string | null;
		/** Component library from createLibrary() */
		library: Library;
		/** Whether the LLM is currently streaming */
		isStreaming?: boolean;
		/** Callback when a component triggers an action */
		onAction?: (event: ActionEvent) => void;
		/** Called when form state changes */
		onStateUpdate?: (state: Record<string, any>) => void;
		/** Initial form state to hydrate */
		initialState?: Record<string, any>;
		/** Called when parse result changes */
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

	// ─── State ────────────────────────────────────────────────────────────────

	// Form state management — initialState is intentionally captured once
	// svelte-ignore state_referenced_locally
	let formState = $state<Record<string, any>>(initialState ?? {});

	// Parser setup — created once from the library's JSON schema.
	// parser.parse() is pure/idempotent — safe to call in $derived.
	// svelte-ignore state_referenced_locally
	const parser = createParser(library.toJSONSchema());

	// Parse result — re-derived whenever response changes
	let result = $derived<ParseResult | null>(
		response ? parser.parse(response) : null,
	);

	// ─── Effects ──────────────────────────────────────────────────────────────

	// Debug: log when streaming is done but no parsed root
	$effect(() => {
		if (!isStreaming && response && result && !result.root) {
			console.warn('[Renderer] Parse failed — no root node.');
			console.warn('[Renderer] Errors:', result.errors);
			console.warn('[Renderer] Full response:', response);
		}
	});

	// Trigger onParseResult callback when result changes
	$effect(() => {
		if (onParseResult) {
			onParseResult(result);
		}
	});

	// ─── Form State Functions ─────────────────────────────────────────────────

	function getFieldValue(formName: string | undefined, name: string): any {
		if (formName) {
			return formState[formName]?.[name]?.value;
		}
		return formState[name]?.value;
	}

	function setFieldValue(
		formName: string | undefined,
		componentType: string | undefined,
		name: string,
		value: any,
		shouldTriggerSaveCallback?: boolean,
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
			onStateUpdate(formState);
		}
	}

	// ─── Action Handler ───────────────────────────────────────────────────────

	function triggerAction(
		userMessage: string,
		formName?: string,
		action?: ActionConfig,
	): void {
		if (!onAction) {
			console.warn("[Renderer] triggerAction called but no onAction callback provided");
			return;
		}

		const actionEvent: ActionEvent = {
			type: action?.type ?? "continue_conversation",
			params: action?.params ?? {},
			humanFriendlyMessage: userMessage,
		};

		// Include form state if triggered from a form
		if (formName) {
			actionEvent.formState = formState[formName] ?? {};
			actionEvent.formName = formName;
		}

		onAction(actionEvent);
	}

	// ─── Context Setup ────────────────────────────────────────────────────────
	// Use getter for isStreaming so child components read the current reactive value.
	// renderNode is NOT in context — it's a template snippet passed as a prop.
	setOpenUIContext({
		get library() { return library; },
		triggerAction,
		get isStreaming() { return isStreaming; },
		getFieldValue,
		setFieldValue,
	});
</script>

<!--
  Recursive snippet for rendering nested values.
  Handles: null, strings, numbers, booleans, arrays, and ElementNode objects.
  Passed as a prop to RenderNode → individual components use {@render renderNode(...)}.
-->
{#snippet renderNode(value: unknown)}
	{#if value == null}
		<!-- nothing -->
	{:else if typeof value === 'string'}
		{value}
	{:else if typeof value === 'number' || typeof value === 'boolean'}
		{String(value)}
	{:else if Array.isArray(value)}
		{#each value as item}
			{@render renderNode(item)}
		{/each}
	{:else if typeof value === 'object' && (value as any).type === 'element'}
		<RenderNode node={value as ElementNode} {renderNode} />
	{/if}
{/snippet}

{#if result?.root}
	<RenderNode node={result.root} {renderNode} />
{/if}
