import { componentGroups, library as intelligentLibrary } from "@openuidev/intelligent-ui-library";
import { createLibrary } from "@openuidev/react-lang";
import { DatePicker } from "./components/date-picker";

export { promptOptions } from "@openuidev/intelligent-ui-library";

// Replace the built-in date picker while keeping the new root, groups and functions.
export const library = createLibrary({
  root: intelligentLibrary.root,
  componentGroups,
  functions: Object.values(intelligentLibrary.functions),
  components: Object.values({ ...intelligentLibrary.components, DatePicker }),
});
