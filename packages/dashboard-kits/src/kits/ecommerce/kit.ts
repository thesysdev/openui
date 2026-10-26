import type { KitDefinition } from "../../core/kit";
import { glossary } from "./metrics";
import { ecommerceTools } from "./tools";

const RANGE_FILTER = `rangeFilter = FilterSelect("range", "Period", [{value: "7d", label: "Last 7 days"}, {value: "30d", label: "Last 30 days"}, {value: "90d", label: "Last 90 days"}, {value: "mtd", label: "Month to date"}], $range)`;
const KPI_DEFAULTS = `{periodLabel: "", hero: {label: "Loading", value: "—"}, heroTrend: {labels: [], current: []}, metrics: []}`;
const ITEMS_DEFAULTS = `{labels: [], totalSales: [], orders: [], items: [], overTime: {labels: [], series: []}}`;
const COMPARE_FILTER = `compareFilter = FilterSelect("compare", "Compare with", [{value: "plan", label: "Plan"}, {value: "previous_period", label: "Prior period"}, {value: "last_year", label: "Last year"}], $compare)`;
const PROFIT_DEFAULTS = `{periodLabel: "", comparisonLabel: "", lines: [], grossMargin: "—", contributionMargin: "—", profitPerOrder: "—", breakEvenRoas: 0, byChannel: []}`;

const STORE_OVERVIEW = `root = Dashboard([header, section])
header = DashboardHeader("Store overview", kpis.periodLabel)
$range = "30d"
$channel = "all"
$compare = "plan"
section = Section([heroRow, kpiRow, profitRow, flowRow, whereRow], filters)
filters = FilterBar([rangeFilter, channelFilter, compareFilter])
${RANGE_FILTER}
channelFilter = FilterSelect("channel", "Sales channel", [{value: "all", label: "All channels"}, {value: "online", label: "Online store"}, {value: "app", label: "Mobile app"}, {value: "amazon", label: "Amazon"}], $channel)
${COMPARE_FILTER}
kpis = Query("get_store_kpis", {range: $range, channel: $channel, compare: $compare}, ${KPI_DEFAULTS})
insights = Query("get_store_insights", {range: $range, channel: $channel, compare: $compare}, {insights: []})
heroRow = CardRow([heroCard, insightCard])
heroCard = LargeCard([hero])
$metric = ""
hero = HeroMetric(kpis.hero, kpis.heroTrend, kpis.metrics, $metric)
insightCard = MediumCard([insightHeader, insightList])
insightHeader = DashboardCardHeader("What changed", "Most important first")
insightList = InsightList(insights.insights, 3)
kpiRow = CardRow([kpiCard])
kpiCard = LargeCard([kpiStrip, kpiRules])
kpiStrip = KpiStrip(kpis.metrics, $metric)
kpiRules = RuleChips(kpis.rules)
profit = Query("get_profit_bridge", {range: $range, channel: $channel, compare: $compare}, ${PROFIT_DEFAULTS})
goal = Query("get_sales_goal", {channel: $channel}, {label: "", goal: 0, labels: [], cumulative: []})
profitRow = CardRow([profitCard, goalCard])
profitCard = LargeCard([profitHeader, profitChart])
profitHeader = DashboardCardHeader(profit.contributionMargin, "Contribution margin: where each dollar of net sales went, against the comparison", "number")
profitChart = ProfitWaterfall(profit.lines, profit.comparisonLabel)
goalCard = MediumCard([goalHeader, goalPace])
goalHeader = DashboardCardHeader("Monthly goal", "October sales against the pace needed to reach the goal")
goalPace = GoalPace(goal)
breakdown = Query("get_sales_breakdown", {range: $range, channel: $channel}, {lines: []})
journey = Query("get_purchase_journey", {range: $range}, {steps: [], conversionRate: "—"})
top = Query("get_product_performance", {range: $range, channel: $channel, limit: 5}, {products: []})
flowRow = CardRow([breakdownCard, journeyCard, topCard])
breakdownCard = MediumCard([breakdownHeader, breakdownChart])
breakdownHeader = DashboardCardHeader("Total sales breakdown", "From gross sales to what the store collected")
breakdownChart = MoneyBreakdown(breakdown.lines)
journeyCard = MediumCard([journeyHeader, journeyFunnel])
journeyHeader = DashboardCardHeader(journey.conversionRate, "Session to purchase, store and app", "number")
journeyFunnel = ConversionFunnel(journey.steps)
topCard = MediumCard([topHeader, leaderboard])
topHeader = DashboardCardHeader("Top products", "By net sales, with change")
leaderboard = ProductLeaderboard(top.products, 5)
byChannel = Query("get_sales_by", {range: $range, channel: $channel, dimension: "channel"}, ${ITEMS_DEFAULTS})
byCountry = Query("get_sales_by", {range: $range, channel: $channel, dimension: "country"}, ${ITEMS_DEFAULTS})
whereRow = CardRow([whereCard])
whereCard = LargeCard([whereHeader, channelShare, countryList])
whereHeader = DashboardCardHeader("Where sales come from", "By channel, then by country; select a channel to filter the dashboard")
channelShare = ShareBar(byChannel.items, "currency", $channel)
countryList = BarList(byCountry.items, "currency", 6, "By country")`;

const WHY_DEFAULTS = `{metric: "", periodLabel: "", comparisonLabel: "", value: "—", comparison: "—", delta: "", change: 0, tone: "neutral", confidence: {level: "Low", z: 0, note: ""}, summary: "", drivers: [], offsetting: [], walk: [], format: "currency"}`;

const WHAT_CHANGED = `root = Dashboard([header, section])
header = DashboardHeader("What changed and why", why.periodLabel)
$why = "contribution_profit"
$range = "30d"
$channel = "all"
$compare = "plan"
section = Section([whyRow, walkRow, kpiRow], filters)
filters = FilterBar([metricFilter, rangeFilter, channelFilter, compareFilter])
metricFilter = FilterSelect("why", "Metric", [{value: "contribution_profit", label: "Contribution profit"}, {value: "total_sales", label: "Total sales"}, {value: "orders", label: "Orders"}, {value: "aov", label: "Average order value"}, {value: "conversion_rate", label: "Conversion rate"}], $why)
${RANGE_FILTER}
channelFilter = FilterSelect("channel", "Sales channel", [{value: "all", label: "All channels"}, {value: "online", label: "Online store"}, {value: "app", label: "Mobile app"}, {value: "amazon", label: "Amazon"}], $channel)
${COMPARE_FILTER}
why = Query("explain_change", {metric: $why, range: $range, channel: $channel, compare: $compare}, ${WHY_DEFAULTS})
insights = Query("get_store_insights", {range: $range, channel: $channel, compare: $compare, excluding: $why}, {insights: []})
whyRow = CardRow([whyCard, insightCard])
whyCard = LargeCard([whyHeader, drivers])
whyHeader = DashboardCardHeader(why.value, why.metric, "number")
drivers = DriverCards(why)
insightCard = MediumCard([insightHeader, insightList])
insightHeader = DashboardCardHeader("Across the store", "Other findings for the period, most important first")
insightList = InsightList(insights.insights, 4)
walkRow = CardRow([walkCard])
walkCard = LargeCard([walkHeader, walkChart])
walkHeader = DashboardCardHeader("From the comparison to this period", "Each change that lifted (blue) or lowered (red) the metric, in order")
walkChart = VarianceWalk(why.walk, why.comparisonLabel, why.format)
kpis = Query("get_store_kpis", {range: $range, channel: $channel, compare: $compare}, ${KPI_DEFAULTS})
kpiRow = CardRow([kpiCard])
kpiCard = LargeCard([kpiHeader, kpiStrip])
kpiHeader = DashboardCardHeader("The store against the same comparison", kpis.periodLabel)
kpiStrip = KpiStrip(kpis.metrics)`;

const MARKETING_AND_PROFIT = `root = Dashboard([header, section])
header = DashboardHeader("Marketing and profit", mkt.periodLabel)
$range = "30d"
$model = "last_click"
section = Section([heroRow, kpiRow, channelRow, salesChannelRow, creativeRow, mixRow, hourRow], filters)
filters = FilterBar([rangeFilter, modelFilter])
modelFilter = FilterSelect("model", "Attribution", [{value: "last_click", label: "Last click"}, {value: "first_click", label: "First click"}, {value: "linear", label: "Linear"}, {value: "platform", label: "Platform reports"}], $model)
${RANGE_FILTER}
mkt = Query("get_marketing_performance", {range: $range, model: $model}, {periodLabel: "", hero: {label: "Blended ROAS", value: "—"}, heroTrend: {labels: [], current: []}, metrics: [], channels: [], targetRoas: 2})
profit = Query("get_profit_bridge", {range: $range}, ${PROFIT_DEFAULTS})
heroRow = CardRow([heroCard, profitCard])
heroCard = LargeCard([hero])
$metric = ""
hero = HeroMetric(mkt.hero, mkt.heroTrend, mkt.metrics, $metric)
profitCard = MediumCard([profitHeader, profitChart])
profitHeader = DashboardCardHeader(profit.contributionMargin, "Contribution margin after marketing, against the prior period", "number")
profitChart = MoneyBreakdown(profit.lines)
kpiRow = CardRow([kpiCard])
kpiCard = LargeCard([kpiStrip, kpiRules])
kpiStrip = KpiStrip(mkt.metrics, $metric)
kpiRules = RuleChips(mkt.rules)
channelRow = CardRow([channelCard])
salesChannelRow = CardRow([salesChannelCard])
channelCard = LargeCard([channelHeader, channelTable])
channelHeader = DashboardCardHeader("Channel performance", "Attributed revenue and ROAS against the target, by channel")
channelTable = ChannelPerformance(mkt.channels, mkt.targetRoas)
salesChannelCard = LargeCard([salesChannelHeader, salesChannelTable])
salesChannelHeader = DashboardCardHeader("Profit by sales channel", "What each channel keeps after product cost, fees, shipping, returns, and marketing; the tick is the prior period's margin")
salesChannelTable = ChannelProfit(profit.byChannel)
ads = Query("get_creatives", {range: $range}, {creatives: [], breakEvenRoas: 0})
creativeRow = CardRow([creativeCard])
creativeCard = LargeCard([creativeHeader, creativeTable])
creativeHeader = DashboardCardHeader("Creatives", "Spend, ROAS against break-even, attention, and fatigue for every ad")
creativeTable = CreativeLeaderboard(ads.creatives, ads.breakEvenRoas)
mix = Query("get_new_vs_returning", {range: $range}, {labels: [], newCustomerSales: [], returningCustomerSales: [], newCustomers: [], returningCustomers: []})
recon = Query("get_reconciliation", {range: $range}, {periodLabel: "", platforms: [], storeTotal: 0, claimedTotal: 0, storefrontSales: 0, summary: ""})
mixRow = CardRow([mixCard, reconCard])
mixCard = LargeCard([mixHeader, mixChart])
mixHeader = DashboardCardHeader("Sales from new and returning customers", "Where acquisition spend shows up in revenue")
mixChart = ColumnChart(mix.labels, [{name: "New customers", values: mix.newCustomerSales}, {name: "Returning customers", values: mix.returningCustomerSales}], "currency", true, "Sales (USD)")
reconCard = MediumCard([reconHeader, reconChart])
reconHeader = DashboardCardHeader("Store orders against platform claims", "What each ad platform says it drove, against what the store's orders credit it with")
reconChart = ReconciliationCard(recon)
hours = Query("get_orders_by_hour", {range: $range}, {rows: [], columns: [], peak: "", rule: ""})
hourRow = CardRow([hourCard])
hourCard = LargeCard([hourHeader, hourGrid])
hourHeader = DashboardCardHeader("When orders come in", hours.rule)
hourGrid = HeatGrid(hours.rows, hours.columns, "orders")`;

const CUSTOMERS_AND_RETENTION = `root = Dashboard([header, section])
header = DashboardHeader("Customers and retention", customers.periodLabel)
$range = "30d"
$cohortMetric = "ltv"
section = Section([heroRow, kpiRow, cohortRow, segmentRow, moveRow, mixRow], filters)
filters = FilterBar([rangeFilter, cohortFilter])
${RANGE_FILTER}
cohortFilter = FilterSelect("cohortMetric", "Cohort view", [{value: "ltv", label: "Cumulative LTV"}, {value: "repeat_rate", label: "Repeat purchase rate"}], $cohortMetric)
customers = Query("get_customer_kpis", {range: $range}, ${KPI_DEFAULTS})
orderJourney = Query("get_order_journey", {}, {steps: []})
heroRow = CardRow([heroCard, journeyCard])
heroCard = LargeCard([hero])
$metric = ""
hero = HeroMetric(customers.hero, customers.heroTrend, customers.metrics, $metric)
journeyCard = MediumCard([journeyHeader, journeyFunnel])
journeyHeader = DashboardCardHeader("From first to fifth order", "Last 6 months against the 6 before")
journeyFunnel = ConversionFunnel(orderJourney.steps)
kpiRow = CardRow([kpiCard])
kpiCard = LargeCard([kpiStrip])
kpiStrip = KpiStrip(customers.metrics, $metric)
cohorts = Query("get_customer_cohorts", {metric: $cohortMetric, months: 9}, {periodLabels: [], cohorts: [], format: "currency"})
cohortRow = CardRow([cohortCard])
cohortCard = LargeCard([cohortHeader, cohortGrid])
cohortHeader = DashboardCardHeader("Monthly cohorts by first order", "Read down a column to compare cohorts at the same age")
cohortGrid = CohortGrid(cohorts.cohorts, cohorts.periodLabels, cohorts.format, "Customers")
segments = Query("get_customer_segments", {}, {totalCustomers: 0, segments: [], movement: [], lapsePoint: {days: 0, note: ""}})
segmentRow = CardRow([segmentCard])
segmentCard = LargeCard([segmentHeader, segmentTiles])
segmentHeader = DashboardCardHeader("RFM segments", "Last 12 months of customers by recency, frequency, and spend")
segmentTiles = CustomerSegments(segments.segments)
moveRow = CardRow([moveCard])
moveCard = LargeCard([moveHeader, moveFlow, lapseNote])
moveHeader = DashboardCardHeader("How customers moved", "Segments 90 days ago against today, with first orders coming in and lapsed customers leaving")
moveFlow = SegmentFlow(segments.movement)
lapseNote = TextContent(segments.lapsePoint.note, "small")
flow = Query("get_customer_flow", {range: $range}, {periodLabel: "", labels: [], newCustomers: [], reactivated: [], lapsed: [], net: [], metrics: []})
mixRow = CardRow([flowCard])
flowCard = LargeCard([flowHeader, flowStrip, flowChart])
flowHeader = DashboardCardHeader("Is the customer base growing?", "Customers gained (new, and back after a year away) above the line, customers lapsing below it")
flowChart = ColumnChart(flow.labels, [{name: "New", values: flow.newCustomers}, {name: "Lapsed", values: flow.lapsed}, {name: "Reactivated", values: flow.reactivated}], "number", true, "Customers")
flowStrip = KpiStrip(flow.metrics)`;

const MERCHANDISING_AND_CHECKOUT = `root = Dashboard([header, section])
header = DashboardHeader("Merchandising and checkout", "Products, stock, and where shoppers drop off")
$range = "30d"
$category = "all"
$device = "all"
$customer = "all"
section = Section([productRow, mapRow, stockRow, healthRow, returnRow, journeyRow, slaRow, ordersRow], filters)
filters = FilterBar([rangeFilter, categoryFilter, customerFilter, deviceFilter])
customerFilter = FilterSelect("customer", "Customers", [{value: "all", label: "All customers"}, {value: "new", label: "First orders"}, {value: "returning", label: "Returning"}], $customer)
${RANGE_FILTER}
categoryFilter = FilterSelect("category", "Category", [{value: "all", label: "All categories"}, {value: "apparel", label: "Apparel"}, {value: "footwear", label: "Footwear"}, {value: "accessories", label: "Accessories"}, {value: "home", label: "Home"}], $category)
deviceFilter = FilterSelect("device", "Device", [{value: "all", label: "All devices"}, {value: "desktop", label: "Desktop"}, {value: "mobile", label: "Mobile"}, {value: "tablet", label: "Tablet"}], $device)
products = Query("get_product_performance", {range: $range, category: $category, customerType: $customer, limit: 8}, {products: []})
productRow = CardRow([productCard])
productCard = LargeCard([productHeader, productTable])
productHeader = DashboardCardHeader("Product performance", "Net sales, page conversion, returns, margin, and stock; pick First orders to see what new customers start with")
productTable = ProductPerformance(products.products)
catalog = Query("get_product_performance", {range: $range, category: $category, customerType: $customer, limit: 16}, {products: []})
mapRow = CardRow([mapCard])
mapCard = LargeCard([mapHeader, productMap])
mapHeader = DashboardCardHeader("Which products to push, restock, or reprice", "Sell-through against gross margin, sized by net sales, split at the medians")
productMap = ProductQuadrant(catalog.products)
stock = Query("get_inventory_health", {category: $category}, {metrics: [], items: [], catalog: [], concentration: ""})
byCategory = Query("get_sales_by", {range: $range, customerType: $customer, dimension: "category"}, ${ITEMS_DEFAULTS})
stockRow = CardRow([stockCard, alertsCard])
stockCard = LargeCard([stockHeader, stockStrip, categoryChart])
stockHeader = DashboardCardHeader("Inventory and category sales", "Stock position today, and daily sales by category for the period")
stockStrip = KpiStrip(stock.metrics)
categoryChart = ColumnChart(byCategory.overTime.labels, byCategory.overTime.series, "currency", true, "Sales (USD)")
alertsCard = MediumCard([alertsHeader, alerts])
alertsHeader = DashboardCardHeader("Restock now", "Below reorder point, with open purchase orders")
alerts = InventoryAlerts(stock.items)
healthRow = CardRow([healthCard])
healthCard = LargeCard([healthHeader, healthTable])
healthHeader = DashboardCardHeader("Every product's stock", stock.concentration)
healthTable = InventoryHealth(stock.catalog)
returns = Query("get_returns", {range: $range, category: $category}, {periodLabel: "", lines: [], metrics: [], reasons: [], products: []})
returnRow = CardRow([returnCard, sizeCard])
returnCard = LargeCard([returnHeader, returnStrip, returnLedger, reasonList])
returnHeader = DashboardCardHeader("Returns and exchanges", "What came back, what the store kept as exchanges, and why customers sent things back")
returnStrip = KpiStrip(returns.metrics)
returnLedger = MoneyBreakdown(returns.lines)
reasonList = BarList(returns.reasons, "currency", 7, "Why, by value sent back")
sizeCard = MediumCard([sizeHeader, sizeGrid, returnedList])
sizeHeader = DashboardCardHeader("Size exchanges", "The size ordered against the size swapped to")
sizeGrid = ExchangeMatrix(returns.exchanges)
returnedList = BarList(returns.products, "percent", 5, "Most returned, % of units")
journey = Query("get_purchase_journey", {range: $range, device: $device}, {steps: [], conversionRate: "—"})
checkout = Query("get_checkout_journey", {range: $range, device: $device}, {steps: [], checkoutCompletion: "—"})
byDevice = Query("get_sales_by", {range: $range, customerType: $customer, dimension: "device"}, ${ITEMS_DEFAULTS})
journeyRow = CardRow([journeyCard, checkoutCard, deviceCard])
journeyCard = MediumCard([journeyHeader, journeyFunnel])
journeyHeader = DashboardCardHeader(journey.conversionRate, "Purchase journey, session to purchase", "number")
journeyFunnel = ConversionFunnel(journey.steps)
checkoutCard = MediumCard([checkoutHeader, checkoutFunnel])
checkoutHeader = DashboardCardHeader(checkout.checkoutCompletion, "Checkout journey completion", "number")
checkoutFunnel = ConversionFunnel(checkout.steps)
deviceCard = MediumCard([deviceHeader, deviceShare])
deviceHeader = DashboardCardHeader("Sales by device", "Store and app")
deviceShare = ShareBar(byDevice.items, "currency", $device)
recent = Query("get_recent_orders", {limit: 8}, {orders: []})
sla = Query("get_fulfillment_sla", {range: $range}, {days: [], summary: ""})
slaRow = CardRow([slaCard])
slaCard = LargeCard([slaHeader, slaTracker])
slaHeader = DashboardCardHeader("Fulfillment", "Orders shipped within 48 hours, each day against the 95% target")
slaTracker = Tracker(sla.days, sla.summary)
ordersRow = CardRow([ordersCard])
ordersCard = LargeCard([ordersHeader, ordersTable])
ordersHeader = DashboardCardHeader("Latest orders", "Newest first, all channels")
ordersTable = Table([Col("Order", recent.orders.id), Col("Customer", recent.orders.customer), Col("Channel", recent.orders.channel), Col("Items", recent.orders.items, "number"), Col("Total", recent.orders.total, "number"), Col("Fulfillment", recent.orders.fulfillment), Col("Country", recent.orders.country), Col("Placed", recent.orders.placedAt)])`;

const PROMOTIONS = `root = Dashboard([header, section])
header = DashboardHeader("Promotions", promo.detail)
$promo = "fall-sale"
$range = "90d"
section = Section([promoRow, yearRow], filters)
filters = FilterBar([promoFilter, rangeFilter])
promoFilter = FilterSelect("promo", "Promotion", [{value: "fall-sale", label: "Fall sale 2026"}, {value: "fall-sale-2025", label: "Fall sale 2025"}, {value: "bfcm-2025", label: "Black Friday Cyber Monday 2025"}], $promo)
${RANGE_FILTER}
promo = Query("get_promo_impact", {event: $promo}, {event: "", detail: "", labels: [], actual: [], baseline: [], events: [], metrics: [], summary: ""})
promoRow = CardRow([promoCard])
promoCard = LargeCard([promoHeader, promoChart, promoStrip, promoSummary])
promoHeader = DashboardCardHeader(promo.event, "Total sales each day against a baseline from the same weekdays in the four weeks before")
promoChart = TrendChart(promo.labels, [{name: "Actual", values: promo.actual, emphasis: "primary"}, {name: "Baseline", values: promo.baseline, emphasis: "muted"}], "currency", "area", promo.events)
promoStrip = KpiStrip(promo.metrics)
promoSummary = TextContent(promo.summary)
sales = Query("get_sales_over_time", {range: $range, compare: "last_year"}, {labels: [], totalSales: [], comparison: [], comparisonLabel: "", orders: [], events: []})
notes = Query("get_annotations", {range: $range}, {events: []})
yearRow = CardRow([yearCard])
yearCard = LargeCard([yearHeader, yearChart])
yearHeader = DashboardCardHeader("Against the same days last year", "Total sales with what happened marked: promotions, launches, stockouts, incidents, and tracking changes")
yearChart = TrendChart(sales.labels, [{name: "This year", values: sales.totalSales, emphasis: "primary"}, {name: sales.comparisonLabel, values: sales.comparison, emphasis: "muted"}], "currency", "area", notes.events, true)`;

const TARGETS_AND_PACING = `root = Dashboard([header, section])
header = DashboardHeader("Targets and pacing", targets.periodLabel)
$channel = "all"
section = Section([targetRow, budgetRow, kpiRow], filters)
filters = FilterBar([channelFilter])
channelFilter = FilterSelect("channel", "Sales channel", [{value: "all", label: "All channels"}, {value: "online", label: "Online store"}, {value: "app", label: "Mobile app"}, {value: "amazon", label: "Amazon"}], $channel)
targets = Query("get_targets", {channel: $channel}, {periodLabel: "", targets: [], budgets: []})
goal = Query("get_sales_goal", {channel: $channel}, {label: "", goal: 0, labels: [], cumulative: []})
targetRow = CardRow([targetCard, goalCard])
targetCard = LargeCard([targetHeader, bullets])
targetHeader = DashboardCardHeader("October targets", "So far against the target to date (tick) and for the month (dashed), with the forecast range")
bullets = BulletList(targets.targets)
goalCard = MediumCard([goalHeader, goalPace])
goalHeader = DashboardCardHeader("Monthly sales goal", "October sales against the pace needed to reach the goal")
goalPace = GoalPace(goal)
budgetRow = CardRow([budgetCard])
budgetCard = LargeCard([budgetHeader, budgetTable])
budgetHeader = DashboardCardHeader("Ad budgets", "October spend by platform against its budget (last year +6%), and where this pace ends the month")
budgetTable = AdBudgetPacing(targets.budgets)
kpis = Query("get_store_kpis", {range: "mtd", channel: $channel, compare: "plan"}, ${KPI_DEFAULTS})
kpiRow = CardRow([kpiCard])
kpiCard = LargeCard([kpiHeader, kpiStrip, kpiRules])
kpiHeader = DashboardCardHeader("Month to date against plan", "A tile says so when its value is outside its own usual range")
kpiStrip = KpiStrip(kpis.metrics)
kpiRules = RuleChips(kpis.rules)`;

const MONDAY_SUMMARY = `root = Dashboard([header, section])
header = DashboardHeader("Monday summary", kpis.periodLabel)
$range = "7d"
$compare = "previous_period"
section = Section([heroRow, actionRow, targetRow], filters)
filters = FilterBar([rangeFilter, compareFilter])
${RANGE_FILTER}
${COMPARE_FILTER}
kpis = Query("get_store_kpis", {range: $range, compare: $compare}, ${KPI_DEFAULTS})
why = Query("explain_change", {metric: "contribution_profit", range: $range, compare: $compare}, ${WHY_DEFAULTS})
heroRow = CardRow([heroCard, whyCard])
heroCard = LargeCard([hero, kpiStrip])
$metric = ""
hero = HeroMetric(kpis.hero, kpis.heroTrend, kpis.metrics, $metric)
kpiStrip = KpiStrip(kpis.metrics, $metric)
whyCard = MediumCard([whyHeader, drivers])
whyHeader = DashboardCardHeader("Why profit moved", why.comparisonLabel)
drivers = DriverCards(why, 3)
actions = Query("get_actions", {range: $range}, {actions: []})
actionRow = CardRow([actionCard])
actionCard = LargeCard([actionHeader, actionList])
actionHeader = DashboardCardHeader("Decisions for this week", "Biggest expected effect first; approving records the decision")
actionList = ActionCards(actions.actions)
targets = Query("get_targets", {}, {periodLabel: "", targets: []})
stock = Query("get_inventory_health", {}, {metrics: [], items: []})
targetRow = CardRow([targetCard, stockCard])
targetCard = LargeCard([targetHeader, bullets])
targetHeader = DashboardCardHeader("October so far", targets.periodLabel)
bullets = BulletList(targets.targets)
stockCard = MediumCard([stockHeader, alerts])
stockHeader = DashboardCardHeader("Restock", "Below reorder point, most urgent first")
alerts = InventoryAlerts(stock.items)`;

const LIVE = `root = Dashboard([header, section])
header = DashboardHeader("Live", "Today so far and the last hour, online store and app")
section = Section([todayRow, liveRow, flowRow])
live = Query("get_live_view", {}, {asOf: "", labels: [], sessions: [], sessionsWeekAgo: [], visitorsNow: 0, metrics: [], funnel: [], products: [], hours: [], hourlyToday: [], hourlyYesterday: [], todayMetrics: []})
todayRow = CardRow([todayCard])
todayCard = LargeCard([todayHeader, todayStrip, todayChart])
todayHeader = DashboardCardHeader("Today so far", "Sales by hour since midnight UTC, against yesterday; the close projects today's pace")
todayStrip = KpiStrip(live.todayMetrics)
todayChart = ColumnChart(live.hours, [{name: "Today", values: live.hourlyToday, emphasis: "primary"}, {name: "Yesterday", values: live.hourlyYesterday, emphasis: "muted"}], "currency")
liveRow = CardRow([liveCard])
liveCard = LargeCard([liveHeader, liveStrip, liveChart])
liveHeader = DashboardCardHeader(live.visitorsNow, "Visitors on the store right now", "number")
liveStrip = KpiStrip(live.metrics)
liveChart = TrendChart(live.labels, [{name: "Sessions", values: live.sessions, emphasis: "primary"}, {name: "Same time last week", values: live.sessionsWeekAgo, emphasis: "muted"}], "number", "area", [], true)
flowRow = CardRow([funnelCard, productCard])
funnelCard = LargeCard([funnelHeader, funnel])
funnelHeader = DashboardCardHeader("The last hour's shoppers", "Session to purchase, last 58 minutes")
funnel = ConversionFunnel(live.funnel)
productCard = MediumCard([productHeader, productList])
productHeader = DashboardCardHeader("Added to carts", "Most added in the last hour")
productList = BarList(live.products, "number", 5)`;

const SALE_COMMAND_CENTER = `root = Dashboard([header, section])
header = DashboardHeader("Black Friday Cyber Monday", sale.detail)
section = Section([planRow, readyRow])
sale = Query("get_sale_plan", {}, {event: "", detail: "", daysToGo: 0, labels: [], lastYear: [], plan: [], events: [], metrics: [], orderBy: "", extraUnits: []})
planRow = CardRow([planCard])
planCard = LargeCard([planHeader, planStrip, planChart])
planHeader = DashboardCardHeader(sale.daysToGo, "Days to Black Friday: the plan by day against last year's same weekdays", "number")
planStrip = KpiStrip(sale.metrics)
planChart = TrendChart(sale.labels, [{name: "Plan", values: sale.plan, emphasis: "primary"}, {name: "Last year", values: sale.lastYear, emphasis: "muted"}], "currency", "area", sale.events)
ads = Query("get_creatives", {range: "30d"}, {creatives: [], breakEvenRoas: 0})
readyRow = CardRow([readyCard, adCard])
readyCard = MediumCard([readyHeader, readyList])
readyHeader = DashboardCardHeader(sale.orderBy, "Order by: the extra units each product needs for the sale, beyond normal reorders", "number")
readyList = BarList(sale.extraUnits, "number", 8)
adCard = LargeCard([adHeader, creativeTable])
adHeader = DashboardCardHeader("Creatives to scale or refresh before the sale", "Last 30 days, ROAS against break-even")
creativeTable = CreativeLeaderboard(ads.creatives, ads.breakEvenRoas)`;

export const ecommerceKit: KitDefinition = {
  id: "ecommerce",
  name: "E-commerce",
  tagline:
    "Sales, marketing efficiency, profit, customers and cohorts, merchandising, and checkout for a direct-to-consumer brand.",
  preamble:
    "You build e-commerce analytics dashboards for the team running Sundial Goods, a direct-to-consumer brand selling apparel, footwear, accessories, and home goods through its online store, mobile app, and Amazon. You are generating an openui-lang dashboard.",
  rules: [
    'Filters: $range ("7d" | "30d" | "90d" | "mtd", default "30d"), $channel ("all" | "online" | "app" | "amazon"), $category ("all" | "apparel" | "footwear" | "accessories" | "home"), $device ("all" | "desktop" | "mobile" | "tablet"), $customer ("all" | "new" | "returning"; argument customerType), $compare ("previous_period" | "last_year" | "plan"; "plan" for a store overview). Arguments of the same names take these values; add only filters the dashboard\'s tools accept.',
    `Definitions: ${glossary()}. Each KPI carries its definition, shown when hovering its value.`,
    "Layout: rows of three MediumCards, or a LargeCard and a MediumCard. An overview opens with the hero beside a MediumCard that explains it (InsightList with a limit, DriverCards, a funnel, or MoneyBreakdown), then the KpiStrip row. An InsightList always takes a limit of 3 or 4.",
    'Use a KPI tool\'s periodLabel as the DashboardHeader subtitle: DashboardHeader("Store overview", kpis.periodLabel). KPI query defaults: {periodLabel: "", hero: {label: "Loading", value: "—"}, heroTrend: {labels: [], current: []}, metrics: []}.',
    'Charts by question, preferring the specific one when the question matches it: change over time → TrendChart (prior period "muted"); per-period counts or gains and losses → ColumnChart; ranked categories → BarList; part-to-whole → ShareBar; when orders come in → HeatGrid(hours.rows, hours.columns, "orders") from get_orders_by_hour; which products to push, fix, or cut → ProductQuadrant(catalog.products) from get_product_performance with limit 16; on pace for the month → GoalPace(goal) from get_sales_goal; how customers moved between segments → SegmentFlow(segments.movement) from get_customer_segments; shipping on time day by day → Tracker(sla.days, sla.summary) from get_fulfillment_sla. Not LineChart, AreaChart, BarChart, or PieChart.',
    "Why questions → explain_change (DriverCards, VarianceWalk), with the question's metric and the dashboard's range, channel, and compare; never write a cause the tools did not return. Otherwise: overview → get_store_kpis, get_store_insights; profit → get_profit_bridge; marketing → get_marketing_performance, get_creatives, get_reconciliation; customers → get_customer_kpis, get_customer_flow, get_customer_cohorts, get_customer_segments; products and stock → get_product_performance, get_inventory_health, get_returns; timing → get_orders_by_hour; conversion → get_purchase_journey, get_checkout_journey; plans → get_targets, get_sales_goal, get_sale_plan; promotions → get_promo_impact; today and now → get_live_view; next steps → get_actions.",
    'Give every card but the hero a DashboardCardHeader whose subtitle says what is measured and against what. A card that leads with one number makes it the title, titleType "number".',
  ],
  tools: ecommerceTools,
  gallery: [
    {
      title: "Store overview",
      description:
        "Contribution profit hero against plan (or the prior period, or last year) with the Fall sale, what changed, supporting KPIs, the profit waterfall beside the monthly goal, the sales breakdown, the purchase funnel, top products, channel mix, and countries.",
      program: STORE_OVERVIEW,
    },
    {
      title: "What changed and why",
      description:
        "Pick a metric and a comparison: the computed explanation with its confidence and drivers beside the store's other findings, the step-by-step walk from the comparison to this period, and the KPI strip on the same comparison.",
      program: WHAT_CHANGED,
    },
    {
      title: "Marketing and profit",
      description:
        "Blended ROAS hero against break-even beside the contribution profit ledger, marketing KPIs with how they are counted, channel ROAS against break-even, new versus returning sales, store orders against ad-platform claims, and when orders come in by weekday and hour.",
      program: MARKETING_AND_PROFIT,
      example: false,
    },
    {
      title: "Customers and retention",
      description:
        "New customers hero beside the 1st-to-5th order funnel, customer KPIs, first-order cohorts (LTV or repeat rate), RFM segments with actions, and customers gained and lapsed with net active customers.",
      program: CUSTOMERS_AND_RETENTION,
      example: false,
    },
    {
      title: "Targets and pacing",
      description:
        "October's targets as bullet charts with forecasts, the monthly sales goal's pace, each ad platform's budget burn-down, and month-to-date KPIs against plan, flagged when outside their usual range.",
      program: TARGETS_AND_PACING,
      example: false,
    },
    {
      title: "Monday summary",
      description:
        "The week in one screen: contribution profit and its drivers, the decisions to make with their expected effect, October's targets, and what to restock.",
      program: MONDAY_SUMMARY,
      example: false,
    },
    {
      title: "Live",
      description:
        "The last hour: visitors now, sessions, orders, sales, and conversion against a week ago, orders every 10 minutes, the hour's purchase funnel, and products being added to carts.",
      program: LIVE,
      example: false,
    },
    {
      title: "Black Friday Cyber Monday",
      description:
        "The sale command center: days to go, the plan by day against last year's same weekdays, plan KPIs, the extra stock to buy and when, and creatives to scale or refresh.",
      program: SALE_COMMAND_CENTER,
      example: false,
    },
    {
      title: "Promotions",
      description:
        "Pick a promotion: daily sales against a baseline from the weeks before, the order lift against the lift needed to cover the discount, the dip after, and the net profit effect; then the period against the same days last year with every event marked.",
      program: PROMOTIONS,
      // get_promo_impact's description shows how to chart it.
      example: false,
    },
    {
      title: "Merchandising and checkout",
      description:
        "Product table with sparklines, returns, margin, and stock; inventory position and restock alerts; purchase and checkout funnels by device; device mix; latest orders.",
      program: MERCHANDISING_AND_CHECKOUT,
      // Its tools' descriptions say how to feed each component; the prompt keeps
      // the overview and why examples, which show every layout pattern.
      example: false,
    },
  ],
  starters: [
    "Give me this month's store overview: what changed and why?",
    "Why is contribution profit below plan this month?",
    "Is our ad spend paying back? Compare channels against the ROAS target and show contribution profit.",
    "How valuable are the customers we acquired this year, and who is about to churn?",
    "Which products need restocking, and where do mobile shoppers drop off in checkout?",
    "When do orders come in, which products should we push or cut, and are we on pace for this month's sales goal?",
    "Are we shipping orders on time, and which products get returned most?",
  ],
};
