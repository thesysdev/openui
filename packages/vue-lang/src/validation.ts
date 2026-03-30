import {
  builtInValidators,
  parseRules,
  parseStructuredRules,
  validate,
  type ParsedRule,
  type ValidatorFn,
} from "@openuidev/lang-core";
import type { InjectionKey } from "vue";
import { inject, provide, reactive } from "vue";

// ─── Re-exports from lang-core ───

export { builtInValidators, parseRules, parseStructuredRules, validate };
export type { ParsedRule, ValidatorFn };

// ─── Form validation context ───

export interface FormValidationContextValue {
  errors: Record<string, string | undefined>;
  validateField: (name: string, value: unknown, rules: ParsedRule[]) => boolean;
  registerField: (name: string, rules: ParsedRule[], getValue: () => unknown) => void;
  unregisterField: (name: string) => void;
  validateForm: () => boolean;
  clearFieldError: (name: string) => void;
}

const FORM_VALIDATION_CONTEXT_KEY: InjectionKey<FormValidationContextValue> =
  Symbol("openui-form-validation");

/**
 * Create a form validation instance backed by Vue reactive state.
 *
 * Call this in the Form component's `setup` and then
 * provide the result via `provideFormValidation()`.
 */
export function createFormValidation(): FormValidationContextValue {
  const errors = reactive<Record<string, string | undefined>>({});
  const fields: Record<string, { rules: ParsedRule[]; getValue: () => unknown }> = {};

  function validateField(name: string, value: unknown, rules: ParsedRule[]): boolean {
    const error = validate(value, rules);
    if (errors[name] !== error) {
      errors[name] = error;
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

    // Clear old keys and set new ones
    for (const key of Object.keys(errors)) {
      delete errors[key];
    }
    Object.assign(errors, newErrors);

    return allValid;
  }

  function clearFieldError(name: string): void {
    if (errors[name] !== undefined) {
      errors[name] = undefined;
    }
  }

  return {
    errors,
    validateField,
    registerField,
    unregisterField,
    validateForm,
    clearFieldError,
  };
}

/**
 * Get the form validation context set by the nearest parent Form component.
 * Returns null if not inside a Form with validation.
 */
export function useFormValidation(): FormValidationContextValue | null {
  return inject(FORM_VALIDATION_CONTEXT_KEY, null);
}

/**
 * Provide a FormValidationContextValue to child components.
 */
export function provideFormValidation(value: FormValidationContextValue): void {
  provide(FORM_VALIDATION_CONTEXT_KEY, value);
}
