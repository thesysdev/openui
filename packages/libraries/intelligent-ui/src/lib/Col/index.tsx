"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Col as ColView } from "../../components/Col";
import {
  IntelligentUiThemeProvider,
  useIsInsideIntelligentUiTheme,
} from "../../components/IntelligentUiThemeProvider";
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
    // The program's root brings the kit's theme, as the dashboard kit's Dashboard does. Only the root:
    // a wrapper inside a Card would sit where its spacing rules expect the Col.
    const inside = useIsInsideIntelligentUiTheme();
    return statementId !== "root" || inside ? (
      col
    ) : (
      <IntelligentUiThemeProvider>{col}</IntelligentUiThemeProvider>
    );
  },
});
