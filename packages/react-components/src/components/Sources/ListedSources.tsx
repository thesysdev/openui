"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Key, memo, useCallback, useRef, useState } from "react";
import { Carousel, CarouselContent, CarouselRef } from "../Carousel";
import { IconButton } from "../IconButton";
import { listedSourcesStyles, names } from "./listedSources.styles";
import { SourceWithFavicon } from "./SourceContext";
import { ListedSourceItem } from "./SourcesItem";

export interface ListedSourcesProps {
  sources: SourceWithFavicon[];
}

export const ListedSources = memo((props: ListedSourcesProps) => {
  const styles = listedSourcesStyles;
  const sources = props.sources ?? [];

  const ref = useRef<CarouselRef | null>(null);
  const [scroll, setScroll] = useState({ left: false, right: false });

  const handleScrollLeftEnabled = useCallback((enabled: boolean) => {
    setScroll((prev) => ({ ...prev, left: enabled }));
  }, []);

  const handleScrollRightEnabled = useCallback((enabled: boolean) => {
    setScroll((prev) => ({ ...prev, right: enabled }));
  }, []);

  if (!sources.length) return null;

  // Show buttons only if there's overflow (can scroll left or right)
  const hasOverflow = scroll.left || scroll.right;

  return (
    <div className={clsx(styles.root, names.root)}>
      <div className={clsx(styles.header, names.header)}>
        <span className={clsx(styles.title, names.title)}>Sources</span>
        {hasOverflow && (
          <div className={clsx(styles.buttons, names.buttons)}>
            <IconButton
              variant="secondary"
              size="small"
              onClick={() => ref.current?.scroll("left")}
              disabled={!scroll.left}
              icon={<ChevronLeft />}
            />
            <IconButton
              variant="secondary"
              size="small"
              onClick={() => ref.current?.scroll("right")}
              disabled={!scroll.right}
              icon={<ChevronRight />}
            />
          </div>
        )}
      </div>
      <Carousel
        variant="sunk"
        ref={ref}
        showButtons={false}
        onScrollLeftEnabled={handleScrollLeftEnabled}
        onScrollRightEnabled={handleScrollRightEnabled}
      >
        <CarouselContent>
          {sources.map((item: SourceWithFavicon, index: number) => {
            const { key: _key, ...rest } = item as SourceWithFavicon & {
              key?: Key;
            };
            return (
              <div
                key={item.url ?? index}
                className={clsx(styles.container, names.container, item.url && styles.linked)}
              >
                <ListedSourceItem {...rest} sourceId={index} />
              </div>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
});

ListedSources.displayName = "ListedSources";
