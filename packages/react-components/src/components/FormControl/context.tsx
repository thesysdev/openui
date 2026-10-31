"use client";

import React, { createContext, useContext } from "react";

export interface FormControlContextValue {
  hasError: boolean;
}

const FormControlContext = createContext<FormControlContextValue | null>(null);

export function useFormControlContext(): FormControlContextValue | null {
  return useContext(FormControlContext);
}

export function FormControlProvider(
  props: React.PropsWithChildren<{ value: FormControlContextValue }>,
) {
  const { value, children } = props;
  return <FormControlContext.Provider value={value}>{children}</FormControlContext.Provider>;
}
