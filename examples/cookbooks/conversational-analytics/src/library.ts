import { createLibrary } from "@openuidev/react-lang";
import { openuiChatLibrary, openuiLibrary } from "@openuidev/react-ui/genui-lib";

// The same subset generates the server's specification and renders in the client.
export const library = createLibrary({
  root: "Stack",
  components: [
    ...[
      "Stack",
      "Card",
      "CardHeader",
      "TextContent",
      "LineChart",
      "BarChart",
      "Series",
      "Table",
      "Col",
    ].map((name) => openuiLibrary.components[name]),
    // Follow-up suggestions live in the chat library.
    openuiChatLibrary.components.FollowUpBlock,
    openuiChatLibrary.components.FollowUpItem,
  ],
});
