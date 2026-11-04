/**
 * AI-integration surface for the dashboard library.
 *
 * The library is keyed on `Dashboard` as root and carries the layout grammar
 * (Section, CardRow, the three card sizes) plus the filter system that make a
 * model emit dashboards rather than a vertical stack of cards.
 */
export { additionalRules, componentGroups, examples, library, promptOptions } from "./lib/library";

export { dashboardComponents } from "./lib/defineComponents";

export { ThemeProvider, type ThemeProviderProps } from "./components/ThemeProvider";
