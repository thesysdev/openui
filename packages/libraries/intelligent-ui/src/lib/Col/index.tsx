"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Col as ColView } from "../../components/Col";
import { RootTheme } from "../../components/ThemeProvider";
import { ColSchema } from "./schema";

export * from "./schema";

export const Col = defineComponent({
  name: "Col",
  props: ColSchema,
  description: "Vertical layout. Without gap it spaces blocks like an article.",
  component: function ColComponent({ props, renderNode, statementId }) {
    const col = (
      <ColView gap={props.gap} align={props.align}>
        {renderNode(props.children)}
      </ColView>
    );
    // A response's root brings the library's default ThemeProvider when there is none above it.
    // Only the root: a wrapper inside a Card would sit where its spacing rules expect the Col.
    // A react-components ThemeProvider above doesn't count: the library themes itself.
    return statementId === "root" ? <RootTheme>{col}</RootTheme> : col;
  },
});
