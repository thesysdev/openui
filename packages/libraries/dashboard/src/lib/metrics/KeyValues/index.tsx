"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { KeyValues, type KeyValuesProps } from "../../../components/metrics/KeyValues";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { keyValuesPropsSchema, type KeyValuesSchemaProps } from "./schema";

export const KeyValuesComponent = defineComponent({
  name: "KeyValues",
  props: keyValuesPropsSchema,
  description:
    'Label/value fact rows, e.g. [{label: "Trials", value: 572, format: "number", previous: 547}, {label: "Owner", value: "Growth team"}].',
  component: KeyValuesView,
});

function KeyValuesView({ props }: ComponentRenderProps<KeyValuesSchemaProps>) {
  return <KeyValues {...props} />;
}

// Every schema field reaches KeyValues.
export type KeyValuesSchemaCovered = Covered<SchemaCoverage<KeyValuesSchemaProps, KeyValuesProps>>;
