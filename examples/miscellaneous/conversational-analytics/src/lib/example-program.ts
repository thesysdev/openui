import { months } from "./filters";

// A checked-in layout, not a recorded AI answer. Every value comes from Query.
export const exampleProgram = `root = Stack([heading, filters, body], "column", "l")
$country = "All countries"
$month = "2011-02"
data = Query("sales_dashboard", {country: $country, month: $month}, {ready: false, countries: []})
heading = TextContent("Explore retail sales", "large-heavy")
countryOptions = @Each(data.countries, "country", SelectItem(country, country))
countryFilter = Stack([TextContent("Country", "small-heavy"), Select("country", countryOptions, "Country", null, $country)])
monthFilter = Stack([TextContent("Month", "small-heavy"), Select("month", [${months.map((month) => `SelectItem("${month}", "${month}")`).join(", ")}], "Month", null, $month)])
filters = Stack([countryFilter, monthFilter], "row", "m", "end", "start", true)
body = data.ready ? dashboard : TextContent("Waiting for sales data. If this persists, check the error message above.")
dashboard = Stack([TextContent(data.title, "large-heavy"), TextContent(data.comparison, "small"), metrics, TextContent(data.summary), details], "column", "l")
metrics = Stack([sales, orders, average], "row", "m", "stretch", "start", true)
sales = Card([TextContent("Gross sales", "small"), TextContent(data.sales, "large-heavy"), TextContent(data.salesChange, "small")])
orders = Card([TextContent("Orders", "small"), TextContent(data.orders, "large-heavy"), TextContent(data.ordersChange, "small")])
average = Card([TextContent("Average order value", "small"), TextContent(data.averageOrder, "large-heavy"), TextContent(data.averageOrderChange, "small")])
details = data.empty ? TextContent("Try another country or month.") : Stack([trend, products], "column", "l")
trend = Card([CardHeader("Daily gross sales", "Days without eligible sales are shown as zero."), LineChart(data.trend.day, [Series("Gross sales (GBP)", data.trend.sales)], "linear", "Date", "GBP", 280)])
products = Card([CardHeader("Products with the lowest sales change", "Ten smallest current-minus-previous differences. Includes products with no sales this month; this is not a complete reconciliation."), Table([Col("Product", data.products.name), Col("Previous month", data.products.previous), Col("Selected month", data.products.current), Col("Change", data.products.change)])])
`;
