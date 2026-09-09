import { inject, InjectionToken, signal, type Provider, type WritableSignal } from "@angular/core";
import {
  builtInValidators,
  parseRules,
  parseStructuredRules,
  validate,
  type ParsedRule,
  type ValidatorFn,
} from "@openuidev/lang-core";

export { builtInValidators, parseRules, parseStructuredRules, validate };
export type { ParsedRule, ValidatorFn };

export interface FormValidationContextValue {
  errors: WritableSignal<Record<string, string | undefined>>;
  getFieldError: (name: string) => string | undefined;
  validateField: (name: string, value: unknown, rules: ParsedRule[]) => boolean;
  registerField: (name: string, rules: ParsedRule[], getValue: () => unknown) => void;
  unregisterField: (name: string) => void;
  validateForm: () => boolean;
  clearFieldError: (name: string) => void;
}

interface FieldRegistration {
  rules: ParsedRule[];
  getValue: () => unknown;
}

export const OPENUI_FORM_VALIDATION = new InjectionToken<FormValidationContextValue | null>(
  "OPENUI_FORM_VALIDATION",
);

export function createFormValidation(): FormValidationContextValue {
  const errors = signal<Record<string, string | undefined>>({});
  const fields: Record<string, FieldRegistration> = {};

  function getFieldError(name: string): string | undefined {
    return errors()[name];
  }

  function validateField(name: string, value: unknown, rules: ParsedRule[]): boolean {
    const error = validate(value, rules);
    errors.update((prev) => {
      if (prev[name] === error) return prev;
      return { ...prev, [name]: error };
    });
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
    const nextErrors: Record<string, string | undefined> = {};

    for (const [name, reg] of Object.entries(fields)) {
      let value = reg.getValue();
      if (
        value != null &&
        typeof value === "object" &&
        "value" in value &&
        "componentType" in value
      ) {
        value = (value as { value: unknown })["value"];
      }
      const error = validate(value, reg.rules);
      nextErrors[name] = error;
      if (error) allValid = false;
    }

    errors.set(nextErrors);
    return allValid;
  }

  function clearFieldError(name: string): void {
    errors.update((prev) => {
      if (prev[name] === undefined) return prev;
      return { ...prev, [name]: undefined };
    });
  }

  return {
    errors,
    getFieldError,
    validateField,
    registerField,
    unregisterField,
    validateForm,
    clearFieldError,
  };
}

export function provideFormValidation(value: FormValidationContextValue): Provider[] {
  return [{ provide: OPENUI_FORM_VALIDATION, useValue: value }];
}

export function injectFormValidation(): FormValidationContextValue | null {
  return inject(OPENUI_FORM_VALIDATION, { optional: true }) ?? null;
}
