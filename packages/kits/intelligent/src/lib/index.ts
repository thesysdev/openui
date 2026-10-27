export { baseComponents, baseComponentGroups, library } from "./library";
export {
  dashboardPromptOptions,
  exampleDashboard,
  exampleShoppingList,
  exampleSteps,
  exampleTrip,
  promptOptions,
} from "./prompt-options";
export { actions, CopyToClipboard, runLibraryAction } from "./actions";
export { functions } from "./functions";
// Only the tool *specs* are public: dashboardPromptOptions needs them to tell a
// model which Query tools exist. The handlers that return the fabricated rows
// are demo scaffolding from the source app and have no role in a published kit.
export { demoToolSpecs } from "./demo-data";
