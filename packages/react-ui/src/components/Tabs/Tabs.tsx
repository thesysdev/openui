import * as TabsPrimitive from "@radix-ui/react-tabs";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { IconButton } from "../IconButton";

type TabsVariant = "clear";

export interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  className?: string;
  style?: React.CSSProperties;
  variant?: TabsVariant;
}

const tabsVariants: Record<TabsVariant, string> = {
  clear: "openui-tabs-clear",
};

export const Tabs = forwardRef<React.ComponentRef<typeof TabsPrimitive.Root>, TabsProps>(
  ({ className, style, variant = "clear", ...props }, ref) => (
    <TabsPrimitive.Root
      ref={ref}
      className={clsx("openui-tabs", tabsVariants[variant], className)}
      style={style}
      {...props}
    />
  ),
);

Tabs.displayName = "Tabs";

type TabsListVariant =
  | "title"
  | "iconTitle"
  | "iconTitleSubtext"
  | "imageTitle"
  | "imageTitleSubtext";

const tabsListVariants: Record<TabsListVariant, string> = {
  title: "openui-tabs-list--title",
  iconTitle: "openui-tabs-list--icon-title",
  iconTitleSubtext: "openui-tabs-list--icon-title-subtext",
  imageTitle: "openui-tabs-list--image-title",
  imageTitleSubtext: "openui-tabs-list--image-title-subtext",
};

export interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  className?: string;
  style?: React.CSSProperties;
  variant?: TabsListVariant;
}

export const TabsList = forwardRef<React.ComponentRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({ className, style, variant = "title", ...props }, ref) => {
    const listRef = useRef<HTMLDivElement>(null);
    const indicatorRef = useRef<HTMLDivElement>(null);
    const [showLeftButton, setShowLeftButton] = useState(false);
    const [showRightButton, setShowRightButton] = useState(false);

    const updateIndicator = useCallback((animated: boolean) => {
      const list = listRef.current;
      const indicator = indicatorRef.current;
      if (!list || !indicator) return;

      const activeTab = list.querySelector('[role="tab"][data-state="active"]') as HTMLElement;
      if (!activeTab) return;

      const left = activeTab.offsetLeft - list.scrollLeft;
      const width = activeTab.offsetWidth;

      indicator.style.transition = animated
        ? "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
        : "none";
      indicator.style.width = `${width}px`;
      indicator.style.transform = `translateX(${left}px)`;
      indicator.style.opacity = "1";
    }, []);

    // Check scroll state and keep indicator in sync while scrolling
    useEffect(() => {
      const checkScroll = () => {
        if (listRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = listRef.current;
          setShowLeftButton(scrollLeft > 0);
          setShowRightButton(scrollLeft < scrollWidth - clientWidth - 1);
        }
      };

      const handleScroll = () => {
        checkScroll();
        updateIndicator(false);
      };

      checkScroll();
      updateIndicator(false);

      const currentRef = listRef.current;
      if (currentRef) {
        currentRef.addEventListener("scroll", handleScroll);

        const resizeObserver = new ResizeObserver(() => {
          checkScroll();
          updateIndicator(false);
        });
        resizeObserver.observe(currentRef);

        return () => {
          currentRef.removeEventListener("scroll", handleScroll);
          resizeObserver.disconnect();
        };
      }
      return () => {};
    }, [updateIndicator]);

    // Watch for active tab changes and animate indicator
    useEffect(() => {
      const list = listRef.current;
      if (!list) return;

      const observer = new MutationObserver(() => updateIndicator(true));
      observer.observe(list, {
        attributes: true,
        subtree: true,
        attributeFilter: ["data-state"],
      });

      return () => observer.disconnect();
    }, [updateIndicator]);

    // Center the clicked trigger in the list
    useEffect(() => {
      const list = listRef.current;
      if (!list) return;

      const handleClick = (e: MouseEvent) => {
        const trigger = (e.target as HTMLElement).closest('[role="tab"]') as HTMLElement;
        if (!trigger) return;

        const listWidth = list.clientWidth;
        const triggerLeft = trigger.offsetLeft;
        const triggerWidth = trigger.offsetWidth;
        const scrollTo = triggerLeft - listWidth / 2 + triggerWidth / 2;

        list.scrollTo({ left: scrollTo, behavior: "smooth" });
      };

      list.addEventListener("click", handleClick);
      return () => list.removeEventListener("click", handleClick);
    }, []);

    const scrollLeft = () => {
      if (listRef.current) {
        listRef.current.scrollBy({ left: -120, behavior: "smooth" });
      }
    };

    const scrollRight = () => {
      if (listRef.current) {
        listRef.current.scrollBy({ left: 120, behavior: "smooth" });
      }
    };

    return (
      <div className="openui-tabs-list-container">
        {showLeftButton && (
          <div className="openui-tabs-scroll-button-container-left">
            <IconButton
              className="openui-tabs-scroll-button openui-tabs-scroll-left"
              onClick={scrollLeft}
              aria-label="Scroll tabs left"
              icon={<ChevronLeft />}
              variant="secondary"
              size="small"
            />
          </div>
        )}

        <TabsPrimitive.List
          ref={(node) => {
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
            listRef.current = node;
          }}
          className={clsx("openui-tabs-list", tabsListVariants[variant], className)}
          style={style}
          {...props}
        />

        <div className="openui-tabs-indicator" ref={indicatorRef} />

        {showRightButton && (
          <div className="openui-tabs-scroll-button-container-right">
            <IconButton
              className="openui-tabs-scroll-button openui-tabs-scroll-right"
              onClick={scrollRight}
              aria-label="Scroll tabs right"
              icon={<ChevronRight />}
              variant="secondary"
              size="small"
            />
          </div>
        )}
      </div>
    );
  },
);

TabsList.displayName = "TabsList";

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  className?: string;
  style?: React.CSSProperties;
  value: string;
  icon?: React.ReactNode;
  text: React.ReactNode;
  subtext?: React.ReactNode;
  image?: string;
}

export const TabsTrigger = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, style, icon, text, subtext, image, value, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={clsx("openui-tabs-trigger", className)}
    style={style}
    value={value}
    {...props}
  >
    {image && (
      <span className="openui-tabs-trigger-image">
        <img src={image} alt="" />
      </span>
    )}
    {icon && <span className="openui-tabs-trigger-icon">{icon}</span>}
    <span className="openui-tabs-trigger-content">
      {text && <span className="openui-tabs-trigger-text">{text}</span>}
      {subtext && <span className="openui-tabs-trigger-subtext">{subtext}</span>}
    </span>
  </TabsPrimitive.Trigger>
));

TabsTrigger.displayName = "TabsTrigger";

export interface TabsContentProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const TabsContent = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, style, children, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={clsx("openui-tabs-content", className)}
    style={style}
    {...props}
  >
    <div className="openui-tabs-content-inner">{children}</div>
  </TabsPrimitive.Content>
));

TabsContent.displayName = "TabsContent";
