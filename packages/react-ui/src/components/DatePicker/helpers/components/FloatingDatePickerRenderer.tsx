import { autoUpdate, flip, offset, useFloating } from "@floating-ui/react-dom";
import clsx from "clsx";
import { CalendarDays, ChevronDown } from "lucide-react";
import { forwardRef, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useMultipleRefs } from "../../../../hooks/useMultipleRefs";
import { useTheme } from "../../../ThemeProvider";
import { useDatePicker } from "../context/DatePickerContext";
import { formatDateRange, formatSingleDate } from "../utils/helperFn";
import { DatepickerRenderer } from "./DatePickerRenderer";

const FloatingDateInput = () => {
  const { mode, selectedDate, selectedRange, isOpen, setIsOpen } = useDatePicker();
  const hasSelectedDate =
    mode === "single"
      ? !!selectedDate
      : !!(selectedRange && selectedRange.from && selectedRange.to);

  return (
    <div
      className={clsx("openui-date-picker-renderer-floating-input-container", {
        "openui-date-picker-renderer-floating-input-container-open": isOpen,
        "openui-date-picker-renderer-floating-input-container-not-open": !isOpen,
        "openui-date-picker-renderer-floating-input-container-has-no-selected-date":
          !hasSelectedDate,
      })}
      onClick={(e) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
      }}
    >
      <CalendarDays
        size={16}
        className="openui-date-picker-renderer-floating-input-container-leading"
      />
      <span className="openui-date-picker-renderer-floating-input-container-text">
        {mode === "single" ? formatSingleDate(selectedDate) : formatDateRange(selectedRange)}
      </span>
      <ChevronDown
        size={16}
        className={clsx({ "openui-date-picker-renderer-floating-input-container-icon": isOpen })}
      />
    </div>
  );
};

const FloatingDatePicker = forwardRef<HTMLDivElement>((_, ref) => {
  const { isOpen } = useDatePicker();
  const menuPositionDivRef = useRef<HTMLDivElement>(null);
  const { portalThemeClassName } = useTheme();

  const {
    refs: { setFloating, setReference },
    floatingStyles,
  } = useFloating({
    strategy: "absolute",
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [offset(5), flip()],
  });

  const menuPositionDivRefs = useMultipleRefs(setReference, menuPositionDivRef);
  const floatingRef = useMultipleRefs(setFloating, ref);

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        ref={menuPositionDivRefs}
        className={clsx("openui-date-picker-renderer-floating-reference")}
      />
      {createPortal(
        <div
          ref={floatingRef}
          style={{ ...floatingStyles, width: "fit-content" }}
          className={clsx("openui-date-picker-renderer-floating-content", portalThemeClassName)}
        >
          <div className="openui-date-picker-renderer-floating-menu">
            <DatepickerRenderer />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
});

export const FloatingDatePickerRenderer = ({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => {
  const { isOpen, setIsOpen } = useDatePicker();
  const menuRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleInteraction = (e: MouseEvent | TouchEvent) => {
      const targetNode = e.target as Node;
      if (menuRef.current?.contains(targetNode) || containerRef.current?.contains(targetNode)) {
        return;
      }
      setIsOpen(false);
    };

    document.body.addEventListener("mousedown", handleInteraction);
    document.body.addEventListener("touchstart", handleInteraction);

    return () => {
      document.body.removeEventListener("mousedown", handleInteraction);
      document.body.removeEventListener("touchstart", handleInteraction);
    };
  }, [isOpen, setIsOpen]);

  return (
    <div
      ref={containerRef}
      className={clsx("openui-date-picker-renderer-floating-container", className)}
      style={style}
    >
      <FloatingDateInput />
      <FloatingDatePicker ref={menuRef} />
    </div>
  );
};
