"use client";

import { defineComponent } from "@openuidev/react-lang";
import { Photo } from "../photo";
import { SearchImageSchema } from "./schema";

export * from "./schema";

export const SearchImage = defineComponent({
  name: "SearchImage",
  props: SearchImageSchema,
  description:
    'A real photo the app finds for query; it needs no URL and no tool. Name the exact thing in 2 to 4 words: "Belém Tower Lisbon", "iPhone 17", "pastel de nata". Use one for every place, dish, product or thing with a look.',
  component: ({ props }) => <Photo {...props} />,
});
