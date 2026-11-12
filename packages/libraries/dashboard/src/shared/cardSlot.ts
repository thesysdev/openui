"use client";

import { createContext } from "react";

/** True inside a card's header controls: those switch the view, they don't filter it. */
export const CardControlsContext = createContext(false);
/** The card header's slot for a chart's own view switch, so it sits top right, level with the title. */
export const CardSlotContext = createContext<HTMLElement | null>(null);
