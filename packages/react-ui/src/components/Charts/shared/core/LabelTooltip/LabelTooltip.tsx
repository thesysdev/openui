import * as Tooltip from "@radix-ui/react-tooltip";
import React from "react";
import { CHART_CLASS_PREFIX } from "../../../utils/constants";

interface LabelTooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
  disableHoverableContent?: boolean;
}

interface LabelTooltipProps {
  children: React.ReactNode;
  content: string;
  side?: "top" | "bottom" | "left" | "right";
  sideOffset?: number;
  delayDuration?: number;
  className?: string;
  disabled?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DEFAULT_DELAY_DURATION = 300;
const DEFAULT_SKIP_DELAY_DURATION = 300;
const DEFAULT_DISABLE_HOVERABLE_CONTENT = false;

const LabelTooltipProvider: React.FC<LabelTooltipProviderProps> = (props) => {
  const {
    children,
    delayDuration = DEFAULT_DELAY_DURATION,
    skipDelayDuration = DEFAULT_SKIP_DELAY_DURATION,
    disableHoverableContent = DEFAULT_DISABLE_HOVERABLE_CONTENT,
  } = props;

  return (
    <Tooltip.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      disableHoverableContent={disableHoverableContent}
    >
      {children}
    </Tooltip.Provider>
  );
};

const LabelTooltip = React.forwardRef<HTMLDivElement, LabelTooltipProps>((props, ref) => {
  const {
    children,
    content,
    side = "top",
    sideOffset = 1,
    delayDuration = DEFAULT_DELAY_DURATION,
    className = `${CHART_CLASS_PREFIX}-chart-label-tooltip`,
    disabled = false,
    open,
    defaultOpen,
    onOpenChange,
  } = props;

  if (disabled) {
    return children;
  }

  return (
    <Tooltip.Root
      delayDuration={delayDuration}
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={onOpenChange}
    >
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content ref={ref} className={className} side={side} sideOffset={sideOffset}>
          {content}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
});

LabelTooltip.displayName = "LabelTooltip";

export { LabelTooltip, LabelTooltipProvider };
export type { LabelTooltipProps, LabelTooltipProviderProps };
