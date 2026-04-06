import {
  builtInValidators,
  parseRules,
  parseStructuredRules,
  validate,
  type ParsedRule,
  type ValidatorFn,
} from "@openuidev/lang-core";
import { createContext, useContext } from "solid-js";

export { builtInValidators, parseRules, parseStructuredRules, validate };
export type { ParsedRule, ValidatorFn };

export interface FormValidationContextValue {
  errors: Record<string, string | undefined>;
  validateField: (name: string, value: unknown, rules: ParsedRule[]) => boolean;
  registerField: (name: string, rules: ParsedRule[], getValue: () => unknown) => void;
  unregisterField: (name: string) => void;
  validateForm: () => boolean;
  clearFieldError: (name: string) => void;
}

export const FormValidationContext = createContext<FormValidationContextValue | null>(null);

export function useFormValidation(): FormValidationContextValue | null {
  return useContext(FormValidationContext);
}

interface FieldRegistration {
  rules: ParsedRule[];
  getValue: () => unknown;
}

export function createFormValidation(): FormValidationContextValue {
  let errors: Record<string, string | undefined> = {};
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
