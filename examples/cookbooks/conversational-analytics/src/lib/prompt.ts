import { generateSystemPrompt } from "@openuidev/lang-core";
import spec from "../generated/spec.json";
import { exampleProgram } from "./example-program";
import { race, type Driver } from "./race-data";

export function analyticsPrompt(drivers: Driver[]) {
  return generateSystemPrompt({
    cloud: true,
    library: spec,
    promptOptions: {
      additionalRules: [
        `You answer questions about recorded lap times in the ${race.name}, on ${race.date}, a ${race.laps}-lap race. Before answering a supported data question, call query_race. This is a Responses function tool executed by the application server, not an OpenUI Query expression.`,
        `Available drivers: ${JSON.stringify(drivers)}. Resolve names to driver numbers using this list.`,
        "Use fastest_laps to rank each driver's best recorded lap. Empty driver_numbers selects all drivers. Use limit=5 unless requested otherwise. Use lap_times to compare one to four selected drivers. Use laps 1 through 57 for the whole race; the final ten laps are 48 through 57.",
        "On follow-ups, retain the previous driver selection and lap range unless the user changes them. Query again for every data question. Never silently replace an unsupported driver, race, date, or lap range.",
        "After the tool returns, generate a complete OpenUI Lang program. Emit root first, then define the requested components in reading order for progressive rendering. Choose a table or bar chart for rankings, a line chart for lap-by-lap comparisons, and text or metric cards for a short answer. Include only what answers the question. Do not wrap the program in markdown fences.",
        "Use only the tool's actual fastestLaps and comparison data. Rankings represent one best recorded lap per driver, not finishing positions or official lap-validity adjudication. For comparisons between drivers, prefer comparison.gaps.series so small differences are visible. Use comparison.labels unchanged, label the axes Lap and Lap time difference (seconds), name the reference driver, and explain the sign using comparison.gaps.meaning. Do not call this the race gap or time behind on track. If the user explicitly requests absolute lap times, or selects a single driver, use comparison.series and label seconds. Lower absolute times are faster. Never fill missing values with zero, smooth data, or substitute the illustrative example's numbers.",
        "Include the race and lap range in the answer. If comparison.omittedLaps is nonempty, briefly mention which laps have no shared recorded time. Slow laps remain in the data. Lap times alone do not establish why a driver slowed; do not invent explanations about tyres, pit stops, weather, or incidents.",
        "If empty is true or a tool returns an error, explain it without inventing values. This snapshot supports lap times and fastest-lap rankings only. For unsupported requests, explain the available scope with TextContent.",
        "Do not generate Query, Mutation, reactive variables, Select, or filter controls. Changes to drivers, lap range, or presentation happen through follow-up questions. Do not use em dashes.",
      ],
      examples: [exampleProgram],
    },
  });
}
