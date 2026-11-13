import { createLibrary, tagSchemaId } from "@openuidev/react-lang";
import { formatSchema } from "../shared/format";
import { goodWhenSchema, widthSchema } from "../shared/schema";
import { groupComponents, inPromptOrder } from "./defineComponents";
import { promptGroups } from "./prompt-options";

// Name the shared types so each signature prints "Format" instead of the whole
// union (it appears ~20 times); the Structure notes define them once.
tagSchemaId(formatSchema, "Format");
tagSchemaId(widthSchema, "Width");
tagSchemaId(goodWhenSchema, "GoodWhen");

export { additionalRules, examples, promptOptions } from "./prompt-options";

/** Every OpenUI Lang component of the dashboard, in prompt order, for use in another library. */
export const dashboardComponents = inPromptOrder(groupComponents);

/** The dashboard's prompt groups and their notes. */
export const componentGroups = promptGroups();

export const library = createLibrary({
  root: "Dashboard",
  components: dashboardComponents,
  componentGroups,
});
