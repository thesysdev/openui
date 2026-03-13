import { getContext, setContext } from "svelte";
import {
	builtInValidators,
	parseRules,
	validate,
	type ParsedRule,
	type ValidatorFn,
} from "@openuidev/react-lang";

// ─── Context Key ──────────────────────────────────────────────────────────────

export const FORM_VALIDATION_CONTEXT_KEY = Symbol("openui-form-validation");

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FormValidationContextValue {
	/**
	 * Validate a field value against validation rules.
	 * Returns an error message if validation fails, or null if valid.
	 */
	validateField: (fieldName: string, value: any, rules?: string) => string | null;

	/**
	 * Get the current validation state for a field.
	 */
	getFieldValidation: (fieldName: string) => {
		isValid: boolean;
		error: string | null;
	};

	/**
	 * Set validation state for a field.
	 */
	setFieldValidation: (
		fieldName: string,
		isValid: boolean,
		error: string | null,
	) => void;
}

// ─── Form Validation ──────────────────────────────────────────────────────────

/**
 * Create a form validation context value.
 * This should be called by Form components to provide validation state.
 */
export function createFormValidation(): FormValidationContextValue {
	// Validation state: fieldName -> { isValid, error }
	let validationState = $state<
		Record<string, { isValid: boolean; error: string | null }>
	>({});

	return {
		validateField(fieldName: string, value: any, rules?: string): string | null {
			if (!rules) return null;

			const parsedRules = parseRules(rules);
			const error = validate(value, parsedRules, builtInValidators);

			// Update validation state
			validationState[fieldName] = {
				isValid: error === null,
				error,
			};

			return error;
		},

		getFieldValidation(fieldName: string) {
			return (
				validationState[fieldName] ?? {
					isValid: true,
					error: null,
				}
			);
		},

		setFieldValidation(
			fieldName: string,
			isValid: boolean,
			error: string | null,
		) {
			validationState[fieldName] = { isValid, error };
		},
	};
}

/**
 * Get the form validation context.
 * Must be called from within a component that has a Form ancestor.
 */
export function getFormValidation(): FormValidationContextValue | undefined {
	return getContext<FormValidationContextValue | undefined>(
		FORM_VALIDATION_CONTEXT_KEY,
	);
}

/**
 * Set the form validation context.
 * Should be called by Form components.
 */
export function setFormValidationContext(value: FormValidationContextValue): void {
	setContext(FORM_VALIDATION_CONTEXT_KEY, value);
}

// Re-export validation utilities for convenience
export { builtInValidators, parseRules, validate, type ParsedRule, type ValidatorFn };
