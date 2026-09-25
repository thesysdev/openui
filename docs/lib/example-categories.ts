/** Sections of the Examples tab, matching the top-level folders in `examples/`. */

export type ExampleCategoryId =
  | "agent-frameworks"
  | "app-frameworks"
  | "cookbooks"
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
    title: "App frameworks",
    description: "Application frameworks and platforms that host an OpenUI client or server.",
  },
  {
    id: "cookbooks",
    title: "Cookbooks",
    description: "Complete workflows paired with a step-by-step tutorial.",
  },
  {
    id: "design-systems",
    title: "Design systems",
    description: "Component systems adapted into an OpenUI component library.",
  },
  {
    id: "harnesses",
    title: "Harnesses",
    description: "Coding-agent harnesses presented through an OpenUI interface.",
  },
  {
    id: "miscellaneous",
    title: "Miscellaneous",
    description: "Specialized libraries, capabilities, and backend services.",
  },
];
