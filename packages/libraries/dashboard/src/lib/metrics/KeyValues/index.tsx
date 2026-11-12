"use client";

import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import { KeyValues, type KeyValuesProps } from "../../../components/metrics/KeyValues";
import { nodeList } from "../../../shared/values";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import type { KeyValueSchemaProps } from "../KeyValue/schema";
import { keyValuesPropsSchema, type KeyValuesSchemaProps } from "./schema";

export const KeyValuesComponent = defineComponent({
  name: "KeyValues",
  props: keyValuesPropsSchema,
  description:
    'Label/value fact rows: KeyValues([KeyValue("Trials", 572, "number", 547), KeyValue("Owner", "Growth team")]).',
  component: KeyValuesView,
});

function KeyValuesView({ props }: ComponentRenderProps<KeyValuesSchemaProps>) {
  return <KeyValues rows={nodeList<KeyValueSchemaProps>(props.rows)} />;
}

// Every schema field reaches KeyValues.
export type KeyValuesSchemaCovered = Covered<SchemaCoverage<KeyValuesSchemaProps, KeyValuesProps>>;
