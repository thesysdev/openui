import { createLibrary } from "@openuidev/react-lang";
import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { f1Components } from "./components/f1-genui";
import { Table } from "./components/f1-table";
import { TextContent } from "./components/f1-text";
import { BarChart, LineChart } from "./components/f1-charts";
import { f1Charts } from "./components/f1-charts-genui";
import { FollowUpBlock, FollowUpItem, Spotlight, SpotlightItem } from "./components/f1-follow-ups";
import { settleWhileStreaming } from "./components/stream-settle";
import "./components/f1-layout.css";

// The same subset generates the server's specification (npm run generate writes
// src/generated/spec.json, which prompt.ts sends) and renders in the client.
export const library = createLibrary({
  root: "Stack",
  // Blocks such as Table, the charts, Spotlight, FollowUpBlock and Card appear once fully written.
  // Until then each holds a placeholder at its final size, so nothing reflows mid-stream
  // (see components/stream-settle.tsx).
  components: settleWhileStreaming([
    ...[
      "Stack",
      "Card",
      "CardHeader",
      "Series",
      "Col",
    ].map((name) => openuiLibrary.components[name]),
    // F1 text with headline sizes (h1, h2, h3), in place of OpenUI's TextContent.
    TextContent,
    // F1-styled Table with a start slot per row, and charts with a title, in place of OpenUI's.
    Table,
    // F1 charts that take the tools' rows; LineChart and BarChart stay as general fallbacks.
    ...f1Charts,
    LineChart,
    BarChart,
    // Follow-ups as F1 picture cards, in place of OpenUI's list.
    FollowUpBlock,
    FollowUpItem,
    // The same picture cards as 1 to 3 display tiles inside an answer.
    Spotlight,
    SpotlightItem,
    // F1 assets. The model passes data such as driver codes and team names; the assets draw them.
    ...f1Components,
  ]),
});
