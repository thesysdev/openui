"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Fragment } from "react";
import { inline } from "../../components/Markdown/markdownBlocks";
import { Text as TextView, TextInline } from "../../components/Text";
import { str } from "../../shared/style";
import { isElement } from "../helpers";
import { TextSchema } from "./schema";

export * from "./schema";

export const Text = defineComponent({
  name: "Text",
  props: TextSchema,
  description: "Paragraph; supports **bold**, *italic*, `code` and [links](https://…). text may be a list mixing strings and inline components: [Icon(\"clock\", \"sm\"), \" 25 min · \", Badge(\"Easy\")].",
  component: ({ props, renderNode }) => (
    <TextView
      size={props.size}
      color={props.color}
      weight={props.weight}
      italic={props.italic}
      lineThrough={props.lineThrough}
      tabularNums={props.tabularNums}
      maxLines={props.maxLines}
    >
      {Array.isArray(props.text)
        ? (props.text as unknown[]).flat().map((part, i) =>
            isElement(part) ? <TextInline key={i}>{renderNode(part)}</TextInline> : <Fragment key={i}>{inline(str(part), `t${i}`)}</Fragment>,
          )
        : inline(str(props.text))}
    </TextView>
  ),
});
