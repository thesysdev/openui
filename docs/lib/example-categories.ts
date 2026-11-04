/**
 * Sections of the Integrations page. Most match a top-level folder in `examples/`; backend
 * frameworks collect external integrations and the FastAPI example. Cookbook apps are left out
 * because they have their own tab.
 */

export type ExampleCategoryId =
  | "agent-frameworks"
  | "app-frameworks"
  | "backend-frameworks"
  | "design-systems"
  | "harnesses"
  | "miscellaneous";

export type ExampleCategory = {
  id: ExampleCategoryId;
  title: string;
  description: string;
};

export const EXAMPLE_CATEGORIES: ExampleCategory[] = [
  {
    id: "agent-frameworks",
    title: "Agent frameworks",
    description:
      "Agent runtimes and orchestration frameworks that produce or stream OpenUI output.",
  },
  {
    id: "app-frameworks",
    title: "Renderers",
    description:
      "Parsers and renderers that bring OpenUI Lang to other UI frameworks, platforms, and languages.",
  },
  {
    id: "backend-frameworks",
    title: "Backend frameworks",
    description:
      "Server-side libraries and examples that bring OpenUI Lang to other backend languages and frameworks.",
  },
  {
    id: "design-systems",
    title: "Component libraries",
    description: "Existing UI component libraries adapted into an OpenUI component library.",
  },
  {
    id: "harnesses",
    title: "Harnesses",
    description: "Coding-agent harnesses presented through an OpenUI interface.",
  },
  {
    id: "miscellaneous",
    title: "Miscellaneous",
    description: "Plugins, developer tools, specialized libraries, and backend services.",
  },
];
