"use client";

import React, { createContext, useContext } from "react";
import { DateRange } from "react-day-picker";

interface DatePickerContextType {
  selectedDate: Date | undefined;
  selectedRange: DateRange | undefined;
  isOpen: boolean;
  mode: "single" | "range";
  botType: "mobile" | "fullscreen" | "tray" | "copilot";

  setSelectedDate: (date: Date | undefined) => void;
  setSelectedRange: (range: DateRange | undefined) => void;
  setIsOpen: (isOpen: boolean) => void;
}

const defaultContext: DatePickerContextType = {
  selectedDate: undefined,
  selectedRange: { from: undefined, to: undefined },
  isOpen: false,
  mode: "single",
  botType: "fullscreen",

  setSelectedDate: (_date: Date | undefined) => {},
  setSelectedRange: (_range: DateRange | undefined) => {},
  setIsOpen: (_isOpen: boolean) => {},
};

const DatePickerContext = createContext<DatePickerContextType>(defaultContext);

export const useDatePicker = () => {
  const context = useContext(DatePickerContext);
  if (!context) {
    throw new Error("useDatePicker must be used within a DatePickerProvider");
  }
  return context;
};

interface DatePickerProviderProps {
  children: React.ReactNode;
  // DatePicker State needed from parent
  selectedDateFromParent: Date | undefined;
  selectedRangeFromParent: DateRange | undefined;
  mode: "single" | "range";
  botType: "mobile" | "fullscreen" | "tray" | "copilot";

  setSelectedDateFromParent: (date: Date | undefined) => void;
  setSelectedRangeFromParent: (range: DateRange | undefined) => void;
  isOpenFromParent: boolean;
  setIsOpenFromParent: (isOpen: boolean) => void;
}

export const DatePickerProvider: React.FC<DatePickerProviderProps> = ({
  children,

  selectedDateFromParent,
  selectedRangeFromParent,
  setSelectedDateFromParent,
  setSelectedRangeFromParent,
  isOpenFromParent,
  setIsOpenFromParent,

  mode,
  botType,
}) => {
  return (
    <DatePickerContext.Provider
      value={{
        // DatePicker State needed from parent
        selectedDate: selectedDateFromParent,
        selectedRange: selectedRangeFromParent,
        setSelectedDate: setSelectedDateFromParent,
        setSelectedRange: setSelectedRangeFromParent,

        mode,

        isOpen: isOpenFromParent,
        setIsOpen: setIsOpenFromParent,

        botType,
      }}
    >
      {children}
    </DatePickerContext.Provider>
  );
};

export default DatePickerContext;
