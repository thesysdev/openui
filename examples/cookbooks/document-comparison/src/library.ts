import { createLibrary } from "@openuidev/react-lang";
import { openuiChatLibrary, openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { Sources } from "./components/sources";

// The same subset generates the server's specification and renders in the client.
export const library = createLibrary({
  root: "Stack",
  components: [
    ...[
      "Stack",
      "CardHeader",
      "TextContent",
      "Table",
      "Col",
      "BarChart",
      "HorizontalBarChart",
      "LineChart",
      "Series",
      "Callout",
      "TagBlock",
    ].map((name) => openuiLibrary.components[name]),
    Sources,
    // Follow-up suggestions live in the chat library.
    openuiChatLibrary.components.FollowUpBlock,
    openuiChatLibrary.components.FollowUpItem,
  ],
});
