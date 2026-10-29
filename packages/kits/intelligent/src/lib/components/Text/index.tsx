"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Fragment } from "react";
import { inline } from "../markdownBlocks";
import { cx, fg, isElement, str } from "../style";
import { TextSchema } from "./schema";

export * from "./schema";

export const Text = defineComponent({
  name: "Text",
  props: TextSchema,
  description: "Paragraph; supports **bold**, *italic*, `code` and [links](https://…). text may be a list mixing strings and inline components: [Icon(\"clock\", \"sm\"), \" 25 min · \", Badge(\"Easy\")].",
  component: ({ props, renderNode }) => {
    const lines = props.maxLines && props.maxLines > 0 ? Math.round(props.maxLines) : undefined;
    return (
      <p
        className={cx("iui-text", props.size && `iui-text-${props.size}`, props.weight && `iui-weight-${props.weight}`, lines ? "iui-clamp" : undefined)}
        style={{
          color: fg(props.color),
          fontStyle: props.italic ? "italic" : undefined,
          textDecoration: props.lineThrough ? "line-through" : undefined,
          fontVariantNumeric: props.tabularNums ? "tabular-nums" : undefined,
          WebkitLineClamp: lines,
        }}
      >
        {Array.isArray(props.text)
          ? (props.text as unknown[]).flat().map((part, i) =>
              isElement(part) ? <span key={i} className="iui-inline">{renderNode(part)}</span> : <Fragment key={i}>{inline(str(part), `t${i}`)}</Fragment>,
            )
          : inline(str(props.text))}
      </p>
    );
  },
});
