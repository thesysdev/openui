/**
 * AI-integration surface for the dashboard library.
 *
 * The library is keyed on `Dashboard` as root and carries the layout grammar
 * (Section, CardRow, the three card sizes) plus the filter system that make a
 * model emit dashboards rather than a vertical stack of cards.
 */
export {
  openuiDashboardAdditionalRules as additionalRules,
  openuiDashboardComponentGroups as componentGroups,
  openuiDashboardExamples as examples,
  openuiDashboardLibrary as library,
  openuiDashboardPromptOptions as promptOptions,
} from "./lib/openuiDashboardLibrary";

export { dashboardComponents } from "./lib/defineComponents";

export {
  DashboardThemeProvider,
  type DashboardThemeProviderProps,
} from "./components/DashboardThemeProvider";
