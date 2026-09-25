import * as Tooltip from "@radix-ui/react-tooltip";
import clsx from "clsx";
import { Key, memo } from "react";
import { usePinnableTooltip } from "../_shared/hooks";
import { IconWrapper } from "../_shared/icons";
import { SourceWithFavicon } from "../Sources/SourceContext";
import { useTheme } from "../ThemeProvider";
import { CitationItem } from "./CitationItem";

export interface CitationProps {
  onClick?: () => void;
  sources: SourceWithFavicon[];
}

const MultiCitation = memo((props: CitationProps) => {
  const { sources } = props;
  const { portalThemeClassName } = useTheme();

  const {
    isOpen,
    handleMouseEnter,
    handleMouseLeave,
    handleTriggerClick,
    handleContentClick,
    closeTooltip,
    getPointerDownOutsideHandler,
  } = usePinnableTooltip();

  return (
    <span className="openui-citation-container">
      <Tooltip.Provider>
        <Tooltip.Root open={isOpen}>
          <Tooltip.Trigger asChild>
            <button
              type="button"
              className="openui-citation"
              aria-label="Citations"
              onClick={handleTriggerClick}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <IconWrapper name="globe" size={12} />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              side="bottom"
              align="start"
              sideOffset={4}
              alignOffset={-8}
              className={clsx("openui-citation-tooltip", portalThemeClassName)}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={handleContentClick}
              onPointerDownOutside={getPointerDownOutsideHandler(".openui-citation")}
            >
              <div className="openui-citation-tooltip__content">
                {sources.map((itemProps, index: number) => {
                  const { key: _key, ...rest } = itemProps as SourceWithFavicon & {
                    key?: Key;
                  };
                  return <CitationItem key={index} {...rest} onClick={closeTooltip} />;
                })}
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    </span>
  );
});

MultiCitation.displayName = "MultiCitation";

/**
 * Inline citation trigger: a small globe button that opens a pinnable tooltip
 * listing the cited sources.
 */
export const Citation = memo((props: CitationProps) => {
  const { sources } = props;

  if (!sources || sources.length === 0) {
    return null;
  }

  return <MultiCitation {...props} />;
});

Citation.displayName = "Citation";
