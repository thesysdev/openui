"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Link as LinkView } from "../../components/Link";
import { str } from "../../shared/style";
import { LinkSchema } from "./schema";

export * from "./schema";

export const Link = defineComponent({
  name: "Link",
  props: LinkSchema,
  description: "Opens an http(s) URL in a new tab.",
  component: ({ props }) => <LinkView url={str(props.url)}>{str(props.text)}</LinkView>,
});
