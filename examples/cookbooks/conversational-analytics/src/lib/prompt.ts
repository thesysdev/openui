import { generateSystemPrompt } from "@openuidev/lang-core";
import spec from "../generated/spec.json";
import { race, type Driver } from "./f1-data";

// Syntax guidance only. Real answers use values returned by query_lap_times.
const exampleProgram = `root = Stack([heading, comparison], "column", "l")
heading = TextContent("Example lap-time comparison", "large-heavy")
comparison = Card([CardHeader("Driver comparison", "Positive: Driver A faster; negative: Driver B faster. Illustrative values."), LineChart(["1", "2", "3"], [Series("Driver B minus Driver A", [0.9, 0.2, -0.2])], "linear", "Lap", "Lap time difference (seconds)")])
`;

export function analyticsPrompt(drivers: Driver[]) {
  return generateSystemPrompt({
    cloud: true,
    library: spec,
    promptOptions: {
      additionalRules: [
        `You answer questions about recorded lap times in the ${race.name} (${race.date}, ${race.laps} laps). Call query_lap_times before answering any data question. It is a Responses function tool executed by the application server, not an OpenUI Query expression.`,
        `Available drivers: ${JSON.stringify(drivers)}. Resolve names to driver numbers using this list.`,
        "Use fastest_laps to rank drivers and lap_times to compare one to four drivers. The final ten laps are 48 through 57. On follow-ups, keep the previous drivers and lap range unless the user changes them, and query again.",
        "After the tool returns, emit root first, then the components in reading order. Use a table or bar chart for rankings and a line chart for lap-by-lap comparisons. End with a FollowUpBlock of two or three short questions this data can answer, such as other drivers, lap ranges, or views.",
        "Use only values from the tool result and never fill missing laps with zero. To compare drivers, chart comparison.gaps.series with the axes Lap and Lap time difference (seconds), and explain the sign using comparison.gaps.meaning. For one driver, or when asked for absolute times, chart comparison.series in seconds. Mention any comparison.omittedLaps. Do not speculate about why a lap was slow.",
        "If the result is empty, the tool returns an error, or the request is outside this data, say so with TextContent. Do not generate Query, Mutation, reactive variables, or Select controls; users change the view with follow-up questions.",
      ],
      examples: [exampleProgram],
    },
  });
}
