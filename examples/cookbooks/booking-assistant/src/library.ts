import { createLibrary } from "@openuidev/react-lang";
import { openuiChatLibrary } from "@openuidev/react-ui/genui-lib";
import { DatePicker } from "./components/date-picker";

// The chat library generates the server's specification and renders in the client.
// Its DatePicker is replaced so dates can be prefilled and submitted as YYYY-MM-DD.
export const library = createLibrary({
  root: openuiChatLibrary.root,
  componentGroups: openuiChatLibrary.componentGroups,
  components: Object.values({ ...openuiChatLibrary.components, DatePicker }),
});
