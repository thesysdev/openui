"use client";

import { ComponentRenderProps, defineComponent } from "@openuidev/react-lang";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { z } from "zod/v4";
import {
  Carousel as OpenUICarousel,
  CarouselContent as OpenUICarouselContent,
  CarouselItem as OpenUICarouselItem,
  CarouselNext as OpenUICarouselNext,
  CarouselPrevious as OpenUICarouselPrevious,
} from "../../components/Carousel";
import { CardSchema } from "../Card/schema";
import { CompositeCardItem } from "../CompositeCardBlock/schema";
import { Image } from "../Image";
import { ImageCardItem } from "../ImageCard/schema";
import { InsightCardItem } from "../InsightCard/schema";
import { NestedCardContext } from "../nestedCardContext";
import { ValueCardItem } from "../ValueCard/schema";

// Card items render through their own block in its carousel layout, so they
// keep exactly the chrome, sizing and shared hover they have there.
const ITEM_BLOCKS: Record<string, { typeName: string; props: Record<string, unknown> }> = {
  CompositeCardItem: {
    typeName: "CompositeCardBlock",
    props: { layout: "carousel", responsive: true },
  },
  ImageCardItem: { typeName: "ImageCard", props: { layout: "carousel", responsive: true } },
  InsightCardItem: { typeName: "InsightCard", props: { layout: "carousel", responsive: true } },
  ValueCardItem: {
    typeName: "ValueCard",
    props: { layout: "vertical", responsive: true, carousel: true },
  },
};

/** The slide types a Carousel takes, given the Card schema of its library. */
export const carouselSlideUnion = (card: z.core.$ZodType) =>
  z.union([
    card,
    Image.ref,
    CompositeCardItem.ref,
    ImageCardItem.ref,
    InsightCardItem.ref,
    ValueCardItem.ref,
  ]);

type CarouselRenderProps = ComponentRenderProps<{ children: unknown[] }>;

// Kept under its old name for existing imports.
export { NestedCardContext as CarouselSlideContext } from "../nestedCardContext";

/** Shared renderer — also used by the chat library's Carousel, whose slides are its own Card. */
export const CarouselRenderer = ({ props, renderNode }: CarouselRenderProps) => {
  const items = props.children ?? [];
  const first = items[0] as { typeName?: string } | undefined;
  const block = first?.typeName ? ITEM_BLOCKS[first.typeName] : undefined;
  if (block) {
    return renderNode({
      type: "element",
      typeName: block.typeName,
      props: { ...block.props, items },
    });
  }
  return (
    <OpenUICarousel showButtons={true} variant="bare">
      <OpenUICarouselContent>
        {items.map((item, i) => (
          <OpenUICarouselItem key={i}>
            <NestedCardContext.Provider value={true}>{renderNode(item)}</NestedCardContext.Provider>
          </OpenUICarouselItem>
        ))}
      </OpenUICarouselContent>
      <OpenUICarouselPrevious icon={<ChevronLeft />} />
      <OpenUICarouselNext icon={<ChevronRight />} />
    </OpenUICarousel>
  );
};

export const CAROUSEL_DESCRIPTION = `Horizontal scrollable row of 2+ slides the reader browses sideways. Every slide is the same type, one of: Card (its variant sets the look; keep every Card the same variant and shape, e.g. Carousel([Card([...]), Card([...])])); Image (a photo strip; give every Image the same aspectRatio so they line up); or one kind of card item, CompositeCardItem, ImageCardItem, InsightCardItem or ValueCardItem, which render exactly as in their block's carousel layout, e.g. Carousel([ImageCardItem(...), ImageCardItem(...)]). Which to use: a set of one card type with one shared click action uses that block\'s own carousel layout, e.g. ImageCard([lm1, lm2, lm3], "carousel", true, action) or ValueCard([v1, v2, v3], "vertical", true, null, null, true), which keeps the shared action. Use Carousel for slides of custom Cards or Images, or for card items that need no shared action.`;

export const Carousel = defineComponent({
  name: "Carousel",
  props: z.object({
    // Built lazily because Card can also hold a Carousel.
    get children(): z.ZodArray<z.ZodType> {
      return z.array(carouselSlideUnion(CardSchema));
    },
  }),
  description: CAROUSEL_DESCRIPTION,
  component: CarouselRenderer,
});
