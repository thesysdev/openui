import { getContext, setContext } from "svelte";
import type { Library } from "./library.js";

// ─── Action Config ────────────────────────────────────────────────────────────

/**
 * Configuration for an action triggered by a component (e.g. button click).
 */
export interface ActionConfig {
	type?: string;
	params?: Record<string, any>;
}

// ─── Context Keys ─────────────────────────────────────────────────────────────

export const OPENUI_CONTEXT_KEY = Symbol("openui");
export const FORM_NAME_CONTEXT_KEY = Symbol("openui-form-name");

// ─── Context Value ────────────────────────────────────────────────────────────

export interface OpenUIContextValue {
	library: Library;
	triggerAction: (
		userMessage: string,
		formName?: string,
		action?: ActionConfig,
	) => void;
	/** Reactive — use as a getter in the context object so reads track changes. */
	isStreaming: boolean;
	getFieldValue: (formName: string | undefined, name: string) => any;
	setFieldValue: (
		formName: string | undefined,
		componentType: string | undefined,
		name: string,
		value: any,
		shouldTriggerSaveCallback?: boolean,
	) => void;
}

// ─── Context Getters ──────────────────────────────────────────────────────────

/**
 * Get the full OpenUI context value.
 * Must be called from within a Renderer component.
 */
export function getOpenUIContext(): OpenUIContextValue {
	const ctx = getContext<OpenUIContextValue>(OPENUI_CONTEXT_KEY);
	if (!ctx) {
		throw new Error(
			"getOpenUIContext must be used within a Renderer component",
		);
	}
	return ctx;
}

/**
 * Get the triggerAction function for firing action events.
 * Must be called from within a Renderer component.
 */
export function getTriggerAction(): (
	userMessage: string,
	formName?: string,
	action?: ActionConfig,
) => void {
	return getOpenUIContext().triggerAction;
}

/**
 * Get the streaming status.
 * Must be called from within a Renderer component.
 * Note: returns the current value; for reactive tracking in $effect/$derived,
 * read ctx.isStreaming directly from the context object.
 */
export function getIsStreaming(): boolean {
	return getOpenUIContext().isStreaming;
}

/**
 * Get the getFieldValue function for reading form field values.
 * Must be called from within a Renderer component.
 */
export function getGetFieldValue(): (
	formName: string | undefined,
	name: string,
) => any {
	return getOpenUIContext().getFieldValue;
}

/**
 * Get the setFieldValue function for updating form field values.
 * Must be called from within a Renderer component.
 */
export function getSetFieldValue(): (
	formName: string | undefined,
	componentType: string | undefined,
	name: string,
	value: any,
	shouldTriggerSaveCallback?: boolean,
) => void {
	return getOpenUIContext().setFieldValue;
}

/**
 * Get the current form name from context.
 * Returns undefined if not within a form.
 */
export function getFormName(): string | undefined {
	return getContext<string | undefined>(FORM_NAME_CONTEXT_KEY);
}

/**
 * Set the OpenUI context value.
 * Should only be called by the Renderer component.
 */
export function setOpenUIContext(value: OpenUIContextValue): void {
	setContext(OPENUI_CONTEXT_KEY, value);
}

/**
 * Set the form name context.
 * Should be called by Form components.
 */
export function setFormNameContext(formName: string): void {
	setContext(FORM_NAME_CONTEXT_KEY, formName);
}

// ─── Default Value Helper ─────────────────────────────────────────────────────

interface SetDefaultValueOptions {
	formName?: string;
	componentType: string;
	name: string;
	existingValue: any;
	defaultValue: any;
	shouldTriggerSaveCallback?: boolean;
}

/**
 * Helper for setting default values after streaming completes.
 * Only sets the value if the field doesn't already have a value.
 *
 * Accepts either a plain options object or a getter function that returns options.
 * Use a getter when options contain reactive values (e.g. from $props or $derived).
 */
export function useSetDefaultValue(optionsOrGetter: SetDefaultValueOptions | (() => SetDefaultValueOptions)): void {
	const ctx = getOpenUIContext();
	const setFieldValue = ctx.setFieldValue;

	$effect(() => {
		const options = typeof optionsOrGetter === 'function' ? optionsOrGetter() : optionsOrGetter;
		if (
			!ctx.isStreaming &&
			options.existingValue === undefined &&
			options.defaultValue !== undefined
		) {
			setFieldValue(
				options.formName,
				options.componentType,
				options.name,
				options.defaultValue,
				options.shouldTriggerSaveCallback ?? false,
			);
		}
	});
}
