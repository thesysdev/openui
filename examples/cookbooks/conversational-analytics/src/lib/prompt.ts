import { additionalRules, examples } from "@openuidev/intelligent-ui-library";
import { generateSystemPrompt } from "@openuidev/lang-core";
import spec from "../generated/spec.json";
import { promptOptions } from "../library";
import { race, type Driver } from "./f1-data";

// Syntax guidance only. Real answers use values returned by query_lap_times.
const exampleProgram = `root = Col([Card([header, note, chart]), followUps])
header = Title("Driver comparison")
note = Text("Positive: Driver A faster; negative: Driver B faster. Illustrative values. Lap time difference in seconds.")
chart = Chart("line", [{Lap: "1", "Driver B minus Driver A (seconds)": 0.9}, {Lap: "2", "Driver B minus Driver A (seconds)": 0.2}, {Lap: "3", "Driver B minus Driver A (seconds)": -0.2}], "Lap", ["Driver B minus Driver A (seconds)"])
followUps = Col([Button("Compare their final ten laps", @ToAssistant("Compare their final ten laps"), "outline"), Button("Add a third driver", @ToAssistant("Add a third driver"), "outline")])
`;

// The generated spec also carries promptOptions. Cloud rejects them inside chatLibrary,
// so the library goes without them and the options are passed beside it below.
const { promptOptions: _specPromptOptions, ...library } = spec;
export function analyticsPrompt(drivers: Driver[]) {
  return generateSystemPrompt({
    cloud: true,
    library,
    promptOptions: {
      ...promptOptions,
      additionalRules: [
        ...additionalRules,
        `You answer questions about recorded lap times in the ${race.name} (${race.date}, ${race.laps} laps). Call query_lap_times before answering any data question. It is a function tool executed by the application server, not an OpenUI Query expression.`,
        `Available drivers: ${JSON.stringify(drivers)}. Resolve names to driver numbers using this list.`,
        "Use fastest_laps to rank drivers and lap_times to compare one to four drivers. The final ten laps are 48 through 57. On follow-ups, keep the previous drivers and lap range unless the user changes them, and query again.",
        "After the tool returns, emit root first, then the components in reading order. Use a table or bar chart for rankings and a line chart for lap-by-lap comparisons. Use root Col with Card to group the answer. End with two or three Button components whose @ToAssistant actions send short questions this data can answer, such as other drivers, lap ranges, or views.",
        "Use only values from the tool result and never fill missing laps with zero. To compare drivers, reshape comparison.gaps.series into Chart rows with Lap and numeric series keys; use a line Chart and label Lap and Lap time difference (seconds) in Text and series names, and explain the sign using comparison.gaps.meaning. For one driver, or when asked for absolute times, reshape comparison.series into Chart rows in seconds. Every row must contain a number for each selected series. Use Table(columns, rows) with column names and arrays of cell values. Mention any comparison.omittedLaps. Do not speculate about why a lap was slow.",
        "If the result is empty, the tool returns an error, or the request is outside this data, say so with Text. Do not generate Query, Mutation, reactive variables, or Select controls; users change the view with follow-up questions.",
      ],
      examples: [...examples, exampleProgram],
    },
  });
}
