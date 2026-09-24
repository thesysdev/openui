import { createLibrary } from "@openuidev/react-lang";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";

// The same subset generates the server's specification and renders in the client.
export const library = createLibrary({
  root: "Stack",
  components: [
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
});
