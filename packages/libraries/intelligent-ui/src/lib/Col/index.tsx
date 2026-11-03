"use client";

import { ThemeProvider, useTheme } from "@openuidev/react-components";
import { defineComponent } from "@openuidev/react-lang";
import { Col as ColView } from "../../components/Col";
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
    // With no react-components ThemeProvider above, the program's root brings the default theme,
    // scoped to the response. Only the root: a wrapper inside a Card would sit where its spacing
    // rules expect the Col. Every provider sets a portal class, so an empty one means there is none.
    const { portalThemeClassName } = useTheme();
    if (statementId !== "root" || portalThemeClassName) return col;
    return (
      <div className="openui-intelligent-theme" style={{ display: "contents" }}>
        <ThemeProvider cssSelector=".openui-intelligent-theme">{col}</ThemeProvider>
      </div>
    );
  },
});
