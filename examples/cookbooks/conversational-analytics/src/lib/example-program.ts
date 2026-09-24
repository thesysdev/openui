// Illustrative layout for prompting and parser tests, not a database response.
// A real answer replaces every illustrative value with a function-tool result.
export const exampleProgram = `root = Stack([heading, metrics, trend, products], "column", "l")
heading = TextContent("Example sales layout", "large-heavy")
metrics = Stack([sales, orders], "row", "m", "stretch", "start", true)
sales = Card([TextContent("Gross sales", "small"), TextContent("£125.00", "large-heavy")])
orders = Card([TextContent("Orders", "small"), TextContent("5", "large-heavy")])
trend = Card([CardHeader("Daily gross sales", "Gross sales in GBP"), LineChart(["2011-02-01", "2011-02-02"], [Series("Gross sales (GBP)", [50, 75])])])
products = Table([Col("Product", ["Example product"]), Col("Previous month", ["£100.00"]), Col("Selected month", ["£50.00"]), Col("Change", ["-£50.00"])])
`;
