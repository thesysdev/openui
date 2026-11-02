/**
 * AI-integration surface for the dashboard kit.
 *
 * The library is keyed on `Dashboard` as root and carries the layout grammar
 * (Section, CardRow, the three card sizes) plus the filter system that make a
 * model emit dashboards rather than a vertical stack of cards. The five
 * `openuiDashboard*` names mirror what `@openuidev/chat-kit/lib` exports as
 * `openuiChat*`.
 */
export {
  openuiDashboardAdditionalRules,
  openuiDashboardComponentGroups,
  openuiDashboardExamples,
  openuiDashboardLibrary,
  openuiDashboardPromptOptions,
} from "./openuiDashboardLibrary";

/**
 * The component definitions on their own, for callers that embed the dashboard
 * inside a larger library: spread this into their own `createLibrary({...})`.
 * Importing it runs no `createLibrary`.
 */
export { dashboardComponents } from "./defineComponents";
