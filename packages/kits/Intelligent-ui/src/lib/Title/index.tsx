"use client";

import { defineComponent } from "@openuidev/react-lang";
import { inline } from "../../components/Markdown/markdownBlocks";
import { Title as TitleView } from "../../components/Title";
import { str } from "../../shared/style";
import { TitleSchema } from "./schema";

export * from "./schema";

export const Title = defineComponent({
  name: "Title",
  props: TitleSchema,
  description: "Heading; md for a card title, lg for a section, 2xl for a big number.",
  component: ({ props }) => (
    <TitleView size={props.size} color={props.color}>
      {inline(str(props.text))}
    </TitleView>
  ),
});
