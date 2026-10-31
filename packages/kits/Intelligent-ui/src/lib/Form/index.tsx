"use client";

import { defineComponent, FormNameContext, FormValidationContext, useCreateFormValidation } from "@openuidev/react-lang";
import { useId } from "react";
import { Form as FormView } from "../../components/Form";
import { FormSchema } from "./schema";

export * from "./schema";

/**
 * Lays its children out freely, like a Col; the fields inside carry their own
 * labels and rules. A send inside (an @ToAssistant button) checks those rules
 * first and carries the form's values.
 */
export const Form = defineComponent({
  name: "Form",
  props: FormSchema,
  description: "Groups fields; their values go with any @ToAssistant inside, once every field's rules pass.",
  component: function FormBinding({ props, renderNode, statementId }) {
    const id = useId();
    const validation = useCreateFormValidation();
    return (
      <FormValidationContext.Provider value={validation}>
        <FormNameContext.Provider value={statementId ?? id}>
          <FormView>{renderNode(props.children)}</FormView>
        </FormNameContext.Provider>
      </FormValidationContext.Provider>
    );
  },
});
