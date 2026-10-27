"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { Fragment } from "react";
import { ImageTitle as OpenUIImageTitle } from "../../components/ImageTitle";
import { asArray } from "../helpers";
import { renderOneOrMany } from "../oneOrMany";
import { ImageTitleSchema, type ImageTitleProps } from "./schema";

export * from "./schema";

function ImageTitleRenderer({ props, renderNode }: ComponentRenderProps<ImageTitleProps>) {
  const content = asArray(props.content);
  return (
    <OpenUIImageTitle image={props.image ? renderNode(props.image) : undefined}>
      {content.length
        ? content.map((line, i) => <Fragment key={i}>{renderOneOrMany(line, renderNode)}</Fragment>)
        : undefined}
    </OpenUIImageTitle>
  );
}

export const ImageTitle = defineComponent({
  name: "ImageTitle",
  props: ImageTitleSchema,
  description:
    'An Image with a short content stack under it, for one item in a set of products, articles, places or listings: ImageTitle(Image("Trail Runner shoe", "https://…/trail.jpg", "1:1"), [Text("Trail Runner", "body", true), Metric("$89", "-26%", null, "sm", "$120")]). content is usually two parts: a title, as Text(title, "body", true), then one secondary line. The image is already the visual, so never put an EntityTitle with an icon Avatar under it; use an EntityTitle only for a real person, brand or seller with their own photo or logo, such as a host or a store. For a place or thing, use the Text title, a secondary line such as LeadingText(Icon("map-pin", "travel"), Text("Kyoto, Japan"), "secondary"), and Tags. For an article that line is the author, inline with a very small avatar: LeadingText(Avatar("Ada Lovelace", null, null, null, "inline", Icon("user", "people")), Text("Ada Lovelace · 6 min read"), "secondary"). For a product it is a price Metric (with previous for a sale); for a place, a Tag, TagBlock or a short secondary Text. Keep it to 2–3 parts; longer copy belongs in Markdown. Use ImageTitle for 2 or more comparable items side by side in a grid or as Carousel slides, one Card per item (Carousel([Card([item1]), Card([item2]), Card([item3])])), giving every item the same parts in the same order and the same Image aspectRatio ("1:1" products, "4:3" places, "16:9" articles). For a single picture that illustrates an answer, use Image with Markdown around it instead. The Image src must be a real URL from a tool result or the user; with no real image, use EntityTitle instead. When one line of content needs two or more pieces side by side, such as a price and a stock status, pass them as an array and they sit on one line: [Metric("$89", null, null, "sm"), Tag("In stock", null, "success")]; a single piece goes in directly.',
  component: ImageTitleRenderer,
});
