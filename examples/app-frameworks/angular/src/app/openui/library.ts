import { z } from "zod/v4";
import { createLibrary, defineComponent } from "@openuidev/angular-lang";
import { DemoInputComponent } from "./components/demo-input.component";
import { GreetingComponent } from "./components/greeting.component";
import { MaybeCrashComponent } from "./components/maybe-crash.component";
import { SaveButtonComponent } from "./components/save-button.component";
import { StackComponent } from "./components/stack.component";
import { StateValueComponent } from "./components/state-value.component";

const Greeting = defineComponent({
  name: "Greeting",
  description: "Displays a text greeting.",
  props: z.object({
    text: z.string(),
  }),
  component: GreetingComponent,
});

const SaveButton = defineComponent({
  name: "SaveButton",
  description: "Runs a registered mutation when clicked.",
  props: z.object({
    label: z.string(),
    mutationId: z.string(),
  }),
  component: SaveButtonComponent,
});

const MaybeCrash = defineComponent({
  name: "MaybeCrash",
  description: "Throws during render when crash is enabled.",
  props: z.object({
    text: z.string(),
    crash: z.boolean().optional(),
  }),
  component: MaybeCrashComponent,
});

const DemoInput = defineComponent({
  name: "DemoInput",
  description: "Writes a text value into OpenUI form state.",
  props: z.object({
    formName: z.string(),
    name: z.string(),
    label: z.string(),
    defaultValue: z.string().optional(),
    placeholder: z.string().optional(),
  }),
  component: DemoInputComponent,
});

const StateValue = defineComponent({
  name: "StateValue",
  description: "Displays a value from OpenUI form state.",
  props: z.object({
    formName: z.string(),
    name: z.string(),
    label: z.string(),
  }),
  component: StateValueComponent,
});

const Stack = defineComponent({
  name: "Stack",
  description: "Renders a vertical stack of child components.",
  props: z.object({
    title: z.string().optional(),
    children: z.array(
      z.union([Greeting.ref, SaveButton.ref, MaybeCrash.ref, DemoInput.ref, StateValue.ref]),
    ),
  }),
  component: StackComponent,
});

export const library = createLibrary({
  id: "angular-example-library",
  components: [Greeting, SaveButton, MaybeCrash, DemoInput, StateValue, Stack],
  root: "Stack",
});
