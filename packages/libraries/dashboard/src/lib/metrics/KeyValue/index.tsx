import { defineComponent } from "@openuidev/react-lang";
import type { KeyValueRow } from "../../../components/metrics/KeyValues";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { keyValuePropsSchema, type KeyValueSchemaProps } from "./schema";

export const KeyValueComponent = defineComponent({
  name: "KeyValue",
  props: keyValuePropsSchema,
  description:
    "One row of KeyValues: a number (with format and change vs previous) or a short text.",
  component: () => null,
});

// Every KeyValue field reaches KeyValues as one of its rows.
export type KeyValueSchemaCovered = Covered<SchemaCoverage<KeyValueSchemaProps, KeyValueRow>>;
