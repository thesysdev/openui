import { Carousel as RCCarousel, CarouselContent, CarouselNext, CarouselPrevious } from "@openuidev/react-components";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { names, styles } from "./carousel.styles";

export interface CarouselProps {
  /** One entry per item. */
  items: ReactNode[];
  /** Each item's width in px, 80 to 640 (default 240). */
  itemWidth?: number;
  /** Space between items in 4px steps. */
  gap?: number;
}

/**
 * react-components supplies the carousel: scrolling, snapping, the arrows and
 * the edge fade. Items are bare frames rather than CarouselItem, which is a
 * fixed-width card, so the child (Flashcard, SearchImage, Card, ...) sets the
 * look and one Carousel covers every kind.
 */
export function Carousel({ items, itemWidth, gap }: CarouselProps) {
  const width = Math.min(640, Math.max(80, itemWidth ?? 240));
  return (
    <RCCarousel className={clsx(styles.root, names.root)}>
      <CarouselContent className={clsx(styles.track, names.track)} style={gap != null ? { gap: Math.max(0, gap) * 4 } : undefined}>
        {items.map((item, i) => (
          <div key={i} className={clsx(styles.item, names.item)} style={{ width }}>
            {item}
          </div>
        ))}
      </CarouselContent>
      <CarouselPrevious shape="circle" icon={<ChevronLeft size={16} />} aria-label="Previous" />
      <CarouselNext shape="circle" icon={<ChevronRight size={16} />} aria-label="Next" />
    </RCCarousel>
  );
}
