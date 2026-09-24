// Syntax guidance only. Real answers use values returned by query_race.
export const exampleProgram = `root = Stack([heading, comparison], "column", "l")
heading = TextContent("Example lap-time comparison", "large-heavy")
comparison = Card([CardHeader("Driver comparison", "Positive: Driver A faster; negative: Driver B faster. Illustrative values."), LineChart(["1", "2", "3"], [Series("Driver B minus Driver A", [0.9, 0.2, -0.2])], "linear", "Lap", "Lap time difference (seconds)")])
`;
