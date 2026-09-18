export interface ScenarioDefinition {
  id: string;
  label: string;
  description: string;
  response: string;
  initialState?: Record<string, unknown>;
}

export const scenarios: ScenarioDefinition[] = [
  {
    id: "static",
    label: "Static",
    description: "Simple one-component render.",
    response: 'root = Greeting("Hello from Angular")',
  },
  {
    id: "nested",
    label: "Nested",
    description: "Recursive rendering through RenderNode.",
    response:
      'first = Greeting("Nested one")\nsecond = Greeting("Nested two")\nroot = Stack("Nested render", [first, second])',
  },
  {
    id: "form",
    label: "Form state",
    description: "Initial state hydration plus field updates.",
    response:
      'input = DemoInput("profile", "name", "Name", "Taylor", "Type a name")\nvalue = StateValue("profile", "name", "Current value")\nroot = Stack("Form state", [input, value])',
    initialState: {
      profile: {
        name: {
          value: "Ada",
          componentType: "Input",
        },
      },
    },
  },
  {
    id: "query",
    label: "Query",
    description: "Async Query() execution with a custom loader.",
    response: 'message = Query("get_message", {})\nroot = Greeting(message)',
  },
  {
    id: "mutation",
    label: "Mutation",
    description: "Mutation execution through a run action step.",
    response:
      'save = Mutation("save_message", { value: "done" })\nbutton = SaveButton("Save message", "save")\nroot = Stack("Mutation", [button])',
  },
  {
    id: "crash",
    label: "Crash",
    description: "Intentional render failure to verify last-good-render preservation.",
    response: 'root = MaybeCrash("Last good render should remain visible", true)',
  },
  {
    id: "recover",
    label: "Recover",
    description: "Render recovery after a previous failure.",
    response: 'root = MaybeCrash("Recovered cleanly", false)',
  },
];
