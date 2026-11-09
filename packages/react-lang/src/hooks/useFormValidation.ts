import { validate, type ParsedRule, type ValidatorFn } from "@openuidev/lang-core";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export interface FormValidationContextValue {
  errors: Record<string, string | undefined>;
  getFieldError: (name: string) => string | undefined;
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

/**
 * Custom validators supplied via `<Renderer validators={...}>`. Forms rendered
 * inside the Renderer pick them up automatically.
 */
export const FormValidatorsContext = createContext<Record<string, ValidatorFn> | undefined>(
  undefined,
);

/** Form state stores `{ value, componentType }`; unwrap to the raw value. */
function unwrapFieldValue(value: unknown): unknown {
  if (value != null && typeof value === "object" && "value" in value && "componentType" in value) {
    return (value as { value: unknown }).value;
  }
  return value;
}

interface FieldRegistration {
  rules: ParsedRule[];
  getValue: () => unknown;
}

export function useCreateFormValidation(): FormValidationContextValue {
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const errorsRef = useRef(errors);
  errorsRef.current = errors;
  const fieldsRef = useRef<Record<string, FieldRegistration>>({});
  // Read through a ref so the callbacks below keep a stable identity even when
  // the host passes a new validators object on every render.
  const validators = useContext(FormValidatorsContext);
  const validatorsRef = useRef(validators);
  validatorsRef.current = validators;

  const getFormValues = useCallback((): Record<string, unknown> => {
    const values: Record<string, unknown> = {};
    for (const [name, reg] of Object.entries(fieldsRef.current)) {
      values[name] = unwrapFieldValue(reg.getValue());
    }
    return values;
  }, []);

  const getFieldError = useCallback((name: string) => errorsRef.current[name], []);

  const validateField = useCallback(
    (name: string, value: unknown, rules: ParsedRule[]): boolean => {
      const values = { ...getFormValues(), [name]: unwrapFieldValue(value) };
      const error = validate(value, rules, validatorsRef.current, { fieldName: name, values });
      setErrors((prev) => {
        if (prev[name] === error) return prev;
        return { ...prev, [name]: error };
      });
      return !error;
    },
    [getFormValues],
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

    const values = getFormValues();

    for (const [name, reg] of Object.entries(fieldsRef.current)) {
      const error = validate(values[name], reg.rules, validatorsRef.current, {
        fieldName: name,
        values,
      });
      newErrors[name] = error;
      if (error) allValid = false;
    }

    setErrors(newErrors);
    return allValid;
  }, [getFormValues]);

  const clearFieldError = useCallback((name: string) => {
    setErrors((prev) => {
      if (prev[name] === undefined) return prev;
      return { ...prev, [name]: undefined };
    });
  }, []);

  return useMemo<FormValidationContextValue>(
    () => ({
      errors,
      getFieldError,
      validateField,
      registerField,
      unregisterField,
      validateForm,
      clearFieldError,
    }),
    [
      errors,
      getFieldError,
      validateField,
      registerField,
      unregisterField,
      validateForm,
      clearFieldError,
    ],
  );
}
