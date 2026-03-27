import { validate, type ParsedRule } from "@openuidev/lang-core";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export interface FormValidationContextValue {
  errors: Record<string, string | undefined>;
  validateField: (name: string, value: unknown, rules: ParsedRule[]) => boolean;
  registerField: (name: string, rules: ParsedRule[], getValue: () => unknown) => void;
  unregisterField: (name: string) => void;
  validateForm: () => boolean;
  clearFieldError: (name: string) => void;
}

export const FormValidationContext = createContext<FormValidationContextValue | null>(null);

export function useFormValidation() {
  return useContext(FormValidationContext);
}

interface FieldRegistration {
  rules: ParsedRule[];
  getValue: () => unknown;
}

export function useCreateFormValidation(): FormValidationContextValue {
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const fieldsRef = useRef<Record<string, FieldRegistration>>({});

  const validateField = useCallback(
    (name: string, value: unknown, rules: ParsedRule[]): boolean => {
      const error = validate(value, rules);
      setErrors((prev) => {
        if (prev[name] === error) return prev;
        return { ...prev, [name]: error };
      });
      return !error;
    },
    [],
  );

  const registerField = useCallback(
    (name: string, rules: ParsedRule[], getValue: () => unknown) => {
      fieldsRef.current[name] = { rules, getValue };
    },
    [],
  );

  const unregisterField = useCallback((name: string) => {
    delete fieldsRef.current[name];
  }, []);

  const validateForm = useCallback((): boolean => {
    let allValid = true;
    const newErrors: Record<string, string | undefined> = {};

    for (const [name, reg] of Object.entries(fieldsRef.current)) {
      let value = reg.getValue();
      // Normalize: form state stores { value, componentType }; extract actual value if needed
      if (
        value != null &&
        typeof value === "object" &&
        "value" in value &&
        "componentType" in value
      ) {
        value = (value as { value: unknown }).value;
      }
      const error = validate(value, reg.rules);
      newErrors[name] = error;
      if (error) allValid = false;
    }

    setErrors(newErrors);
    return allValid;
  }, []);

  const clearFieldError = useCallback((name: string) => {
    setErrors((prev) => {
      if (prev[name] === undefined) return prev;
      return { ...prev, [name]: undefined };
    });
  }, []);

  return useMemo(
    () => ({
      errors,
      validateField,
      registerField,
      unregisterField,
      validateForm,
      clearFieldError,
    }),
    [errors, validateField, registerField, unregisterField, validateForm, clearFieldError],
  );
}
