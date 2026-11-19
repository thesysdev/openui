"use client";

import clsx from "clsx";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { IconButton } from "../IconButton";
import { carouselStyles, names } from "./carousel.styles";

interface CarouselContextType {
  scrollDivRef: React.RefObject<HTMLDivElement | null>;
  scroll: (direction: "left" | "right") => void;
  itemsToScroll: number;
  noSnap?: boolean;
  showButtons?: boolean;
  variant?: "card" | "sunk";
  isPrevVisible: boolean;
  isNextVisible: boolean;
}

const CarouselContext = createContext<CarouselContextType | null>(null);

const useCarousel = () => {
  const context = useContext(CarouselContext);
  if (!context) throw new Error("useCarousel must be used within a Carousel");
  return context;
};

export interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  itemsToScroll?: number;
  noSnap?: boolean;
  showButtons?: boolean;
  variant?: "card" | "sunk";
  onScrollLeftEnabled?: (enabled: boolean) => void;
  onScrollRightEnabled?: (enabled: boolean) => void;
}

export interface CarouselRef {
  scroll: (direction: "left" | "right") => void;
  scrollDivRef: React.RefObject<HTMLDivElement | null>;
}

export const Carousel = forwardRef<CarouselRef, CarouselProps>(
  (
    {
      itemsToScroll = 1,
      noSnap,
      showButtons = true,
      variant = "card",
      className,
      children,
      onScrollLeftEnabled,
      onScrollRightEnabled,
      ...props
    },
    ref,
  ) => {
    const styles = carouselStyles;
    const scrollDivRef = useRef<HTMLDivElement>(null);
    const [isPrevVisible, setIsPrevVisible] = useState(false);
    const [isNextVisible, setIsNextVisible] = useState(false);

    const scroll = useCallback(
      (direction: "left" | "right") => {
        if (!scrollDivRef.current) {
          return;
        }

        const container = scrollDivRef.current;
        const items = noSnap
          ? Array.from(container.children[0]?.children ?? [])
          : Array.from(container.children);

        if (items.length === 0) {
          return;
        }

        const containerRect = container.getBoundingClientRect();
        const visibleIndex = items.findIndex((child) => {
          const rect = child.getBoundingClientRect();
          return rect.left >= containerRect.left;
        });

        let currentIndex = visibleIndex;
        if (visibleIndex === -1) {
          // Scrolled to the far right, so the last item is the current one
          currentIndex = items.length - 1;
        }

        const targetIndex =
          direction === "left"
            ? Math.max(0, currentIndex - itemsToScroll)
            : Math.min(items.length - 1, currentIndex + itemsToScroll);

        const targetElement = items[targetIndex] as HTMLElement;

        if (targetElement) {
          container.scrollTo({
            left: targetElement.offsetLeft,
            behavior: "smooth",
          });
        }
      },
      [noSnap, itemsToScroll],
    );

    useEffect(() => {
      if (!scrollDivRef.current) return;

      const container = scrollDivRef.current;
      const handleScroll = () => {
        const canScrollLeft = container.scrollLeft > 0;
        const canScrollRight =
          Math.ceil(container.scrollLeft) + container.offsetWidth < container.scrollWidth;
        setIsPrevVisible(canScrollLeft);
        setIsNextVisible(canScrollRight);
      };

      handleScroll();

      const resizeObserver = new ResizeObserver(handleScroll);
      resizeObserver.observe(container);
      const mutationObserver = new MutationObserver(handleScroll);
      mutationObserver.observe(container, { childList: true, subtree: true });

      container.addEventListener("scroll", handleScroll);

      return () => {
        container.removeEventListener("scroll", handleScroll);
        resizeObserver.disconnect();
        mutationObserver.disconnect();
      };
    }, []);

    useEffect(() => {
      onScrollLeftEnabled?.(isPrevVisible);
    }, [isPrevVisible, onScrollLeftEnabled]);

    useEffect(() => {
      onScrollRightEnabled?.(isNextVisible);
    }, [isNextVisible, onScrollRightEnabled]);

    useImperativeHandle(ref, () => {
      return {
        scroll,
        scrollDivRef,
      };
    }, [scroll]);

    const contextValue = useMemo(
      () => ({
        scrollDivRef,
        scroll,
        itemsToScroll,
        noSnap,
        showButtons,
        variant,
        isPrevVisible,
        isNextVisible,
      }),
      [
        scrollDivRef,
        scroll,
        itemsToScroll,
        noSnap,
        showButtons,
        variant,
        isPrevVisible,
        isNextVisible,
      ],
    );

    return (
      <CarouselContext.Provider value={contextValue}>
        <div
          className={clsx(
            styles.root,
            names.root,
            styles.variant[variant],
            names.variant[variant],
            noSnap && names.noSnap.true,
            showButtons && names.showButtons.true,
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </CarouselContext.Provider>
    );
  },
);

export const CarouselContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, _ref) => {
    const styles = carouselStyles;
    const { scrollDivRef, noSnap, isPrevVisible, isNextVisible } = useCarousel();

    const content = noSnap ? (
      <div className={clsx(styles.contentWrapper, names.contentWrapper)}>{children}</div>
    ) : (
      children
    );

    return (
      <div
        ref={scrollDivRef}
        className={clsx(styles.content, names.content, className)}
        data-mask={
          isPrevVisible ? (isNextVisible ? "both" : "left") : isNextVisible ? "right" : "none"
        }
        {...props}
      >
        {content}
      </div>
    );
  },
);

export const CarouselItem = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const styles = carouselStyles;
    return (
      <div ref={ref} className={clsx(styles.item, names.item, className)} {...props}>
        {children}
      </div>
    );
  },
);

export const CarouselPrevious = forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof IconButton>
>(({ className, style, ...props }, ref) => {
  const styles = carouselStyles;
  const { scroll, showButtons, isPrevVisible } = useCarousel();

  if (!isPrevVisible || !showButtons) return null;

  return (
    <div className={clsx(styles.button, names.button, styles.left, names.left)}>
      <IconButton
        ref={ref}
        className={clsx(names.previous, className)}
        shape="square"
        variant="secondary"
        size="small"
        onClick={() => scroll("left")}
        style={style}
        {...props}
      />
    </div>
  );
});

export const CarouselNext = forwardRef<HTMLButtonElement, React.ComponentProps<typeof IconButton>>(
  ({ className, style, ...props }, ref) => {
    const styles = carouselStyles;
    const { scroll, showButtons, isNextVisible } = useCarousel();

    if (!isNextVisible || !showButtons) return null;

    return (
      <div className={clsx(styles.button, names.button, styles.right, names.right)}>
        <IconButton
          ref={ref}
          className={clsx(names.next, className)}
          shape="square"
          variant="secondary"
          size="small"
          onClick={() => scroll("right")}
          style={style}
          {...props}
        />
      </div>
    );
  },
);
