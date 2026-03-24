import { createLibrary, defineComponent } from "@openuidev/svelte-lang";
import { z } from "zod";
import Button from "./components/Button.svelte";
import Card from "./components/Card.svelte";
import Stack from "./components/Stack.svelte";
import TextContent from "./components/TextContent.svelte";

const TextContentDef = defineComponent({
  name: "TextContent",
  props: z.object({ text: z.string() }),
  description: "Displays a block of text. Supports markdown formatting within the string.",
  component: TextContent,
});

const ButtonDef = defineComponent({
  name: "Button",
  props: z.object({
    label: z.string(),
    action: z.string().optional(),
  }),
  description: "A clickable button that triggers an action",
  component: Button,
});

const CardDef = defineComponent({
  name: "Card",
  props: z.object({
    title: z.string(),
    children: z.array(z.union([TextContentDef.ref, ButtonDef.ref])),
  }),
  description: "A card container with a title and child components",
  component: Card,
});

const StackDef = defineComponent({
  name: "Stack",
  props: z.object({
    children: z.array(z.union([CardDef.ref, TextContentDef.ref, ButtonDef.ref])),
  }),
  description: "Vertical layout container",
  component: Stack,
});

export const library = createLibrary({
  components: [TextContentDef, ButtonDef, CardDef, StackDef],
  root: "Stack",
});
