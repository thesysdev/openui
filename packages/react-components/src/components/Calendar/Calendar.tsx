"use client";

import clsx from "clsx";
import React, { createContext, forwardRef, useContext, useRef } from "react";
import { Day, DayPicker, type DayProps } from "react-day-picker";
import { useLayoutContext } from "../../context/LayoutContext";
import { useMultipleRefs } from "../../hooks/useMultipleRefs";
import { calendarStyles, names } from "./calendar.styles";
import { CalendarDefaultsContext } from "./CalendarDefaultsContext";
import { MonthsDropdown, YearsDropdown } from "./components/helperComponents";
import { getDayPickerStyles } from "./utils/styles";

const CalendarContext = createContext<{
  mode: CalendarProps["mode"];
  Day: React.ComponentType<DayProps>;
}>({ mode: undefined, Day });

const CalendarDay = ({ modifiers, ...props }: DayProps) => {
  const { mode, Day: DayComponent } = useContext(CalendarContext);
  return (
    <DayComponent
      {...props}
      modifiers={modifiers}
      data-today-unselected={(modifiers["today"] && !modifiers["selected"]) || undefined}
      data-selection={
        (mode === "single" || mode === "multiple") && modifiers["selected"] ? mode : undefined
      }
      data-range-start={modifiers["range_start"] || undefined}
      data-range-middle={modifiers["range_middle"] || undefined}
      data-range-end={modifiers["range_end"] || undefined}
    />
  );
};

export type CalendarProps = React.ComponentProps<typeof DayPicker>;
export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
  ({ className, classNames, ...props }, ref) => {
    const styles = calendarStyles;
    const { layout } = useLayoutContext();
    const mergeDefaults = useContext(CalendarDefaultsContext);
    const containerRef = useRef<HTMLDivElement>(null);
    const assignRef = useMultipleRefs(ref, containerRef);
    const commonProps = {
      captionLayout: "dropdown" as const,
      components: {
        MonthsDropdown: (props: React.ComponentProps<typeof MonthsDropdown>) => (
          <MonthsDropdown {...props} container={containerRef.current} />
        ),
        YearsDropdown: (props: React.ComponentProps<typeof YearsDropdown>) => (
          <YearsDropdown {...props} container={containerRef.current} />
        ),
      },
    };
    const components = mergeDefaults
      ? { ...commonProps.components, ...props.components }
      : (props.components ?? commonProps.components);
    return (
      <div
        ref={assignRef}
        className={clsx(names.root, styles.layout[layout], names.layout[layout], className)}
      >
        <CalendarContext.Provider value={{ mode: props.mode, Day: props.components?.Day ?? Day }}>
          <DayPicker
            {...commonProps}
            {...props}
            components={{ ...components, Day: CalendarDay }}
            classNames={{ ...getDayPickerStyles(styles), ...classNames }}
          />
        </CalendarContext.Provider>
      </div>
    );
  },
);
