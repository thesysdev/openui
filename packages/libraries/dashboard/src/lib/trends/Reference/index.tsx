import { defineComponent } from "@openuidev/react-lang";
import type { ReferenceProps } from "../../../shared/trends";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import type { ReferenceSchemaProps } from "./schema";
import { referencePropsSchema } from "./schema";

export const ReferenceComponent = defineComponent({
  name: "Reference",
  props: referencePropsSchema,
  description:
    'A target or SLO line: Reference("Target", 99.5). axis "x" draws a vertical line (Scatter only), e.g. an average on the x measure.',
  component: () => null,
});

// Every schema field reaches the charts that read it, as ReferenceProps.
export type ReferenceSchemaCovered = Covered<SchemaCoverage<ReferenceSchemaProps, ReferenceProps>>;
