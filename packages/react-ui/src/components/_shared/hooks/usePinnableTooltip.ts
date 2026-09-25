import { useCallback, useEffect, useRef, useState } from "react";

import { useId } from "./useId";

const PINNABLE_TOOLTIP_OPEN_EVENT = `openui-pinnable-tooltip-open`;
const DEFAULT_GROUP_ID = `openui-pinnable-tooltip-global`;

export interface UsePinnableTooltipOptions {
  /**
   * Group ID for coordinating multiple tooltips (only one open at a time per group).
   * If not provided, uses a global group so only one tooltip is open at a time across the app.
   */
  groupId?: string;
  /** Delay in ms before closing on mouse leave (default: 200) */
  closeDelay?: number;
  /** Callback when open state changes */
  onOpenChange?: (isOpen: boolean) => void;
}

export interface UsePinnableTooltipReturn {
  /** Whether the tooltip is currently open */
  isOpen: boolean;
  /** Whether the tooltip is pinned (clicked open) */
  isPinned: boolean;
  /** Handler for mouse entering trigger or content */
  handleMouseEnter: () => void;
  /** Handler for mouse leaving trigger or content */
  handleMouseLeave: () => void;
  /** Handler for clicking the trigger (toggles pin state) */
  handleTriggerClick: () => void;
  /** Handler for clicking content (closes tooltip) */
  handleContentClick: () => void;
  /** Close the tooltip programmatically */
  closeTooltip: () => void;
  /** Handler for pointer down outside (use with onPointerDownOutside) */
  getPointerDownOutsideHandler: (
    triggerSelector: string,
  ) => (event: { target: EventTarget | null }) => void;
}

/**
 * Hook for managing pinnable tooltip state with hover, click-to-pin,
 * and group coordination functionality.
 *
 * @example
 * ```tsx
 * const {
 *   isOpen,
 *   handleMouseEnter,
 *   handleMouseLeave,
 *   handleTriggerClick,
 *   handleContentClick,
 *   getPointerDownOutsideHandler,
 * } = usePinnableTooltip({ groupId: 'my-tooltip-group' })
 *
 * <Tooltip.Root open={isOpen}>
 *   <Tooltip.Trigger
 *     onClick={handleTriggerClick}
 *     onMouseEnter={handleMouseEnter}
 *     onMouseLeave={handleMouseLeave}
 *   >
 *     Trigger
 *   </Tooltip.Trigger>
 *   <Tooltip.Content
 *     onMouseEnter={handleMouseEnter}
 *     onMouseLeave={handleMouseLeave}
 *     onClick={handleContentClick}
 *     onPointerDownOutside={getPointerDownOutsideHandler('.my-trigger')}
 *   >
 *     Content
 *   </Tooltip.Content>
 * </Tooltip.Root>
 * ```
 */
export function usePinnableTooltip(
  options: UsePinnableTooltipOptions = {},
): UsePinnableTooltipReturn {
  const { groupId = DEFAULT_GROUP_ID, closeDelay = 200, onOpenChange } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [suppressHoverUntilLeave, setSuppressHoverUntilLeave] = useState(false);
  const leaveTimeoutRef = useRef<number | null>(null);
  const tooltipId = useId();

  const clearLeaveTimeout = useCallback(() => {
    if (leaveTimeoutRef.current !== null) {
      window.clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    clearLeaveTimeout();

    if (isPinned) {
      return;
    }

    if (suppressHoverUntilLeave) {
      setSuppressHoverUntilLeave(false);
    }

    setIsOpen(true);
  }, [clearLeaveTimeout, isPinned, suppressHoverUntilLeave]);

  const handleMouseLeave = useCallback(() => {
    if (suppressHoverUntilLeave) {
      setSuppressHoverUntilLeave(false);
    }

    if (isPinned) {
      return;
    }

    leaveTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
      leaveTimeoutRef.current = null;
    }, closeDelay);
  }, [isPinned, suppressHoverUntilLeave, closeDelay]);

  const handleTriggerClick = useCallback(() => {
    clearLeaveTimeout();
    setIsPinned((prevPinned) => {
      const nextPinned = !prevPinned;
      setIsOpen(nextPinned);

      if (!nextPinned) {
        setSuppressHoverUntilLeave(true);
      }

      return nextPinned;
    });
  }, [clearLeaveTimeout]);

  const closeTooltip = useCallback(() => {
    clearLeaveTimeout();
    setIsPinned(false);
    setSuppressHoverUntilLeave(true);
    setIsOpen(false);
  }, [clearLeaveTimeout]);

  const handleContentClick = useCallback(() => {
    closeTooltip();
  }, [closeTooltip]);

  const getPointerDownOutsideHandler = useCallback(
    (triggerSelector: string) => {
      return (event: { target: EventTarget | null }) => {
        if ((event.target as HTMLElement)?.closest(triggerSelector)) {
          return;
        }
        closeTooltip();
      };
    },
    [closeTooltip],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      clearLeaveTimeout();
    };
  }, [clearLeaveTimeout]);

  // Notify parent of open state changes
  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  // Broadcast open event for coordination with other tooltips in the same group
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent<{ id: string; groupId: string }>(PINNABLE_TOOLTIP_OPEN_EVENT, {
        detail: { id: tooltipId, groupId },
      }),
    );
  }, [tooltipId, isOpen, groupId]);

  // Listen for other tooltips opening in the same group
  useEffect(() => {
    const handleExternalOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ id: string; groupId: string }>).detail;

      // Only close if same group and different tooltip
      if (detail?.groupId !== groupId || detail?.id === tooltipId) {
        return;
      }

      closeTooltip();
    };

    window.addEventListener(PINNABLE_TOOLTIP_OPEN_EVENT, handleExternalOpen as EventListener);

    return () => {
      window.removeEventListener(PINNABLE_TOOLTIP_OPEN_EVENT, handleExternalOpen as EventListener);
    };
  }, [tooltipId, groupId, closeTooltip]);

  return {
    isOpen,
    isPinned,
    handleMouseEnter,
    handleMouseLeave,
    handleTriggerClick,
    handleContentClick,
    closeTooltip,
    getPointerDownOutsideHandler,
  };
}
