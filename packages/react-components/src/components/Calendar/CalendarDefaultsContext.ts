"use client";

import { createContext } from "react";

// DatePicker supplies an owned Root while retaining Calendar's caption components. Public
// Calendar callers keep the existing replacement semantics of their `components` map.
export const CalendarDefaultsContext = createContext(false);
