import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Key, memo, useCallback, useRef, useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselRef } from "../Carousel";
import { IconButton } from "../IconButton";
import { SourceWithFavicon } from "./SourceContext";
import { ListedSourceItem } from "./SourcesItem";

export interface ListedSourcesProps {
  sources: SourceWithFavicon[];
}

export const ListedSources = memo((props: ListedSourcesProps) => {
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
    <div className="openui-listed-sources">
      <div className="openui-listed-sources-header">
        <span className="openui-listed-sources-header__title">Sources</span>
        {hasOverflow && (
          <div className="openui-listed-sources-header__buttons">
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
              <CarouselItem
                key={item.url ?? index}
                className={clsx("openui-listed-sources-item-container", {
                  "openui-listed-sources-item-container--has-url": item.url,
                })}
              >
                <ListedSourceItem {...rest} sourceId={index} />
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
});

ListedSources.displayName = "ListedSources";
