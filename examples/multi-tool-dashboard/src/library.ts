"use client";

import { createLibrary } from "@openuidev/react-lang";
import { openuiLibrary, openuiComponentGroups } from "@openuidev/react-ui/genui-lib";
import { CalendarView } from "./components/CalendarView";

export const library = createLibrary({
  root: "Stack",
  componentGroups: [
    ...openuiComponentGroups,
    { name: "Calendar", components: ["CalendarView"], notes: [
      '- CalendarView renders a month-grid calendar with event dots. Pass an array of event objects: CalendarView(events)',
      '- Each event needs summary (string) and start (object with dateTime or date string)',
      '- Click a day cell to see event details below the calendar',
    ] },
  ],
  components: [
    ...Object.values(openuiLibrary.components),
    CalendarView,
  ],
});
