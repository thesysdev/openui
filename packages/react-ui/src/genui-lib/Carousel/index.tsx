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
import { ContentChildUnion } from "../unions";

type CarouselRenderProps = ComponentRenderProps<{
  children: unknown[][];
  variant?: "card" | "sunk";
}>;

/** Shared renderer — also used by the chat library's Carousel variant (wider content union). */
export const CarouselRenderer = ({ props, renderNode }: CarouselRenderProps) => {
  const items = props.children ?? [];
  return (
    <OpenUICarousel showButtons={true} variant={props.variant}>
      <OpenUICarouselContent>
        {items.map((item, i) => (
          <OpenUICarouselItem key={i}>{renderNode(item)}</OpenUICarouselItem>
        ))}
      </OpenUICarouselContent>
      <OpenUICarouselPrevious icon={<ChevronLeft />} />
      <OpenUICarouselNext icon={<ChevronRight />} />
    </OpenUICarousel>
  );
};

export const Carousel = defineComponent({
  name: "Carousel",
  props: z.object({
    children: z.array(z.array(ContentChildUnion)),
    variant: z.enum(["card", "sunk"]).optional(),
  }),
  description: "Horizontal scrollable carousel",
  component: CarouselRenderer,
});
