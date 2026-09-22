import { createLibrary, defineComponent } from "@openuidev/lang-core";
import { z } from "zod/v4";
import { definitions, promptOptions } from "../src/app/openui/schema.ts";
export { promptOptions };
const blocks = Object.entries(definitions).map(([name, definition]) =>
  defineComponent({ name, ...definition, component: null }),
);
const root = defineComponent({
  name: "Response",
  description: "Root container for every assistant message.",
  props: z.object({ children: z.array(z.union(blocks.map((block) => block.ref))) }),
  component: null,
});
export const library = createLibrary({
  id: "angular-agent-chat",
  root: "Response",
  components: [root, ...blocks],
});
