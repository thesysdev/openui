import { getContext, setContext } from "svelte";
import { validate, type ParsedRule } from "../utils/validation.js";

export interface FormValidationContextValue {
  errors: Record<string, string | undefined>;
  validateField: (name: string, value: unknown, rules: ParsedRule[]) => boolean;
  registerField: (name: string, rules: ParsedRule[], getValue: () => unknown) => void;
  unregisterField: (name: string) => void;
  validateForm: () => boolean;
  clearFieldError: (name: string) => void;
}

const FORM_VALIDATION_KEY = Symbol("openui-form-validation");

/**
 * Set the form validation context. Called by form components.
 */
export function setFormValidationContext(value: FormValidationContextValue): void {
  setContext(FORM_VALIDATION_KEY, value);
}

/**
 * Get the form validation context. Returns null if not inside a validated form.
 */
export function getFormValidation(): FormValidationContextValue | null {
  return getContext<FormValidationContextValue | null>(FORM_VALIDATION_KEY) ?? null;
}

interface FieldRegistration {
  rules: ParsedRule[];
  getValue: () => unknown;
}

/**
 * Creates a form validation state using Svelte 5 runes.
 * The Svelte equivalent of React's `useCreateFormValidation`.
 */
export function createFormValidation(): FormValidationContextValue {
  let errors = $state<Record<string, string | undefined>>({});
  const fields: Record<string, FieldRegistration> = {};

  function validateField(name: string, value: unknown, rules: ParsedRule[]): boolean {
    const error = validate(value, rules);
    if (errors[name] !== error) {
      errors = { ...errors, [name]: error };
    }
    return !error;
  }

  function registerField(name: string, rules: ParsedRule[], getValue: () => unknown): void {
    fields[name] = { rules, getValue };
  }

  function unregisterField(name: string): void {
    delete fields[name];
  }

  function validateForm(): boolean {
    let allValid = true;
    const newErrors: Record<string, string | undefined> = {};

    for (const [name, reg] of Object.entries(fields)) {
      const value = reg.getValue();
      const error = validate(value, reg.rules);
      newErrors[name] = error;
      if (error) allValid = false;
    }

    errors = newErrors;
    return allValid;
  }

  function clearFieldError(name: string): void {
    if (errors[name] !== undefined) {
      errors = { ...errors, [name]: undefined };
    }
  }

  return {
    get errors() {
      return errors;
    },
    validateField,
    registerField,
    unregisterField,
    validateForm,
    clearFieldError,
  };
}
