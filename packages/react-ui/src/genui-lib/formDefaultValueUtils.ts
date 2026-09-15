"use client";

import { useIsStreaming, useSetFieldValue } from "@openuidev/react-lang";
import React from "react";

type DefaultFieldConfig = {
  componentType: string;
  name: string;
  existingValue: unknown;
  defaultValue: unknown;
};

export function useHydrateDefaultFieldValue({
  formName,
  componentType,
  name,
  existingValue,
  defaultValue,
}: {
  formName?: string;
  componentType: string;
  name: string;
  existingValue: unknown;
  defaultValue: unknown;
}) {
  const fields = React.useMemo(
    () => [{ componentType, name, existingValue, defaultValue }],
    [componentType, name, existingValue, defaultValue],
  );

  useHydrateDefaultFieldValues({ formName, fields });
}

export function useHydrateDefaultFieldValues({
  formName,
  fields,
}: {
  formName?: string;
  fields: DefaultFieldConfig[];
}) {
  const setFieldValue = useSetFieldValue();
  const isStreaming = useIsStreaming();

  React.useEffect(() => {
    if (isStreaming) {
      return;
    }

    fields.forEach(({ componentType, name, existingValue, defaultValue }) => {
      if (existingValue === undefined && defaultValue !== undefined) {
        setFieldValue(formName, componentType, name, defaultValue, false);
      }
    });
  }, [fields, formName, isStreaming, setFieldValue]);
}
