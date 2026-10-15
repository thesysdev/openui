import { format } from "date-fns";
import { DateRange } from "react-day-picker";

export const getMonthName = (monthNumber: number): string => {
  switch (monthNumber) {
    case 0:
      return "January";
    case 1:
      return "February";
    case 2:
      return "March";
    case 3:
      return "April";
    case 4:
      return "May";
    case 5:
      return "June";
    case 6:
      return "July";
    case 7:
      return "August";
    case 8:
      return "September";
    case 9:
      return "October";
    case 10:
      return "November";
    case 11:
      return "December";
    default:
      return "Invalid Month";
  }
};

export const getMonthNumber = (monthName: string): number => {
  switch (monthName) {
    case "January":
      return 0;
    case "February":
      return 1;
    case "March":
      return 2;
    case "April":
      return 3;
    case "May":
      return 4;
    case "June":
      return 5;
    case "July":
      return 6;
    case "August":
      return 7;
    case "September":
      return 8;
    case "October":
      return 9;
    case "November":
      return 10;
    case "December":
      return 11;
    default:
      return -1;
  }
};

/**
 * Values reach the picker from agent output and from stored state, where a
 * Date has usually become an ISO string (or a timestamp). Coerce anything
 * date-like to a valid Date and drop the rest, so rendering never throws.
 */
export const toDate = (value: unknown): Date | undefined => {
  if (value == null || value === "") return undefined;
  const date =
    value instanceof Date
      ? value
      : typeof value === "string" || typeof value === "number"
        ? new Date(value)
        : undefined;
  return date && !Number.isNaN(date.getTime()) ? date : undefined;
};

/** Accepts {from, to} or [from, to] with any date-like ends; a missing start drops the range. */
export const toDateRange = (value: unknown): DateRange | undefined => {
  if (value == null) return undefined;
  let from: unknown;
  let to: unknown;
  if (Array.isArray(value)) {
    [from, to] = value;
  } else if (typeof value === "object" && !(value instanceof Date)) {
    ({ from, to } = value as { from?: unknown; to?: unknown });
  } else {
    from = value;
  }
  const start = toDate(from);
  if (!start) return undefined;
  return { from: start, to: toDate(to) };
};

export const formatDateRange = (value: DateRange | undefined): string => {
  const range = toDateRange(value);
  if (!range) return "Select a range";

  const { from, to } = range;

  if (!from) return "Select a range";

  if (!to) {
    return format(from, "MMM d, yyyy");
  }

  if (from.toDateString() === to.toDateString()) {
    return format(from, "MMM d, yyyy");
  }

  return `${format(from, "MMM d, yyyy")} - ${format(to, "MMM d, yyyy")}`;
};

export const formatSingleDate = (value: Date | undefined): string => {
  const date = toDate(value);
  if (!date) return "Select a date";
  return format(date, "MMM d, yyyy");
};
