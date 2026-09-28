import { createLibrary } from "@openuidev/react-lang";
import { openuiChatLibrary, openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { DatePicker } from "./components/date-picker";

// The same subset generates the server's specification and renders in the client.
export const library = createLibrary({
  root: "Stack",
  components: [
    ...[
      "Stack",
      "CardHeader",
      "TextContent",
      "Callout",
      "Table",
      "Col",
      "Form",
      "FormControl",
      "Input",
      "Select",
      "SelectItem",
      "Chips",
      "ChipItem",
      "OptionCards",
      "OptionCard",
      "Buttons",
      "Button",
    ].map((name) => openuiLibrary.components[name]),
    // Replaces React UI's DatePicker so dates can be prefilled and submitted as YYYY-MM-DD.
    DatePicker,
    // Follow-up suggestions live in the chat library.
    openuiChatLibrary.components.FollowUpBlock,
    openuiChatLibrary.components.FollowUpItem,
  ],
});
