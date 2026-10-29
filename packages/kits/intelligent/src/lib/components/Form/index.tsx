"use client";

import {
  defineComponent,
  FormNameContext,
  FormValidationContext,
  useCreateFormValidation,
} from "@openuidev/react-lang";
import { useId } from "react";
import { FormSchema } from "./schema";

export * from "./schema";

/**
 * Lays its children out freely, like a Col; the fields inside carry their own
 * labels and rules. A send inside (an @ToAssistant button) checks those rules
 * first and carries the form's values.
 *
 * It renders a div with role="form", not a <form>: react-components' Select
 * adds a hidden native <select> inside a real <form>, and that resets the
 * field's value to empty on load. The chat and dashboard kits do the same.
 */
export const Form = defineComponent({
  name: "Form",
  props: FormSchema,
  description: "Groups fields; their values go with any @ToAssistant inside, once every field's rules pass.",
  component: function FormView({ props, renderNode, statementId }) {
    const id = useId();
    const validation = useCreateFormValidation();
    return (
      <FormValidationContext.Provider value={validation}>
        <FormNameContext.Provider value={statementId ?? id}>
          <div role="form" className="iui-form">
            {renderNode(props.children)}
          </div>
        </FormNameContext.Provider>
      </FormValidationContext.Provider>
    );
  },
});
