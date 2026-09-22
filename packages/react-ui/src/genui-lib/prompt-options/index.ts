import type { PromptOptions } from "@openuidev/react-lang";

// Server-safe prompt data for the OpenUI component library.

// ── Examples ──

export const openuiExamples: string[] = [
  `Example 1 — Table (column-oriented):

root = Stack([title, tbl])
title = TextContent("Top Languages", "large-heavy")
tbl = Table([Col("Language", langs), Col("Users (M)", users), Col("Year", years)])
langs = ["Python", "JavaScript", "Java", "TypeScript", "Go"]
users = [15.7, 14.2, 12.1, 8.5, 5.2]
years = [1991, 1995, 1995, 2012, 2009]`,

  `Example 2 — Bar chart:

root = Stack([title, chart])
title = TextContent("Q4 Revenue", "large-heavy")
chart = BarChart(labels, [s1, s2], "grouped")
labels = ["Oct", "Nov", "Dec"]
s1 = Series("Product A", [120, 150, 180])
s2 = Series("Product B", [90, 110, 140])`,

  `Example 3 — Form with validation:

root = Stack([title, form])
title = TextContent("Contact Us", "large-heavy")
form = Form("contact", btns, [nameField, emailField, countryField, msgField])
nameField = FormControl("Name", Input("name", "Your name", "text", { required: true, minLength: 2 }))
emailField = FormControl("Email", Input("email", "you@example.com", "email", { required: true, email: true }))
countryField = FormControl("Country", Select("country", countryOpts, "Select...", { required: true }))
msgField = FormControl("Message", TextArea("message", "Tell us more...", 4, { required: true, minLength: 10 }))
countryOpts = [SelectItem("us", "United States"), SelectItem("uk", "United Kingdom"), SelectItem("de", "Germany")]
btns = Buttons([Button("Submit", Action([@ToAssistant("Submit")]), "primary"), Button("Cancel", Action([@ToAssistant("Cancel")]), "secondary")])`,

  `Example 4 — Tabs with mixed content:

root = Stack([title, tabs])
title = TextContent("React vs Vue", "large-heavy")
tabs = Tabs([tabReact, tabVue])
tabReact = TabItem("react", "React", reactContent)
tabVue = TabItem("vue", "Vue", vueContent)
reactContent = [TextContent("React is a library by Meta for building UIs."), Callout("info", "Note", "React uses JSX syntax.")]
vueContent = [TextContent("Vue is a progressive framework by Evan You."), Callout("success", "Tip", "Vue has a gentle learning curve.")]`,

  `Example 5 — KPI and product cards:

root = Stack([kpiHeader, kpiBlock, productsHeader, productCards])
kpiHeader = InlineHeader("This Month", "Key account metrics")
kpiBlock = SnippetCardBlock([kpi1, kpi2, kpi3])
kpi1 = SnippetCardItem("revenue", kpi1lhs, kpi1rhs)
kpi1lhs = IconText(kpi1icon, "neutral", "m", "Revenue", "Month to date", false, "horizontal")
kpi1icon = Icon("circle-dollar-sign", "finance")
kpi1rhs = BoldText("number", "$48,200", "+8.1%", "metric")
kpi2 = SnippetCardItem("active-users", kpi2lhs, kpi2rhs)
kpi2lhs = IconText(kpi2icon, "neutral", "m", "Active Users", "This month", false, "horizontal")
kpi2icon = Icon("users", "people")
kpi2rhs = BoldText("number", "1,204", "+3.4%", "metric")
kpi3 = SnippetCardItem("churn", kpi3lhs, kpi3rhs)
kpi3lhs = IconText(kpi3icon, "neutral", "m", "Churn", "This month", false, "horizontal")
kpi3icon = Icon("user-minus", "people")
kpi3rhs = BoldText("number", "1.8%", "-0.3%", "metric")
productsHeader = InlineHeader("Top Products", "By units sold")
productCards = CompositeCardBlock([p1, p2])
p1 = CompositeCardItem("widget-pro", p1header, [p1body], p1footer)
p1header = IconText(p1icon, "neutral", "m", "Widget Pro", "Best seller", true, "horizontal")
p1icon = Icon("package", "shopping")
p1body = MetricIndicatorInline("2,410 units", "Sold this month", { direction: "up", value: 12 })
p1footer = { price: BoldText("text", "$29.00"), button: p1btn }
p1btn = Button("View Details", Action([@ToAssistant("Show details for Widget Pro")]), "secondary")
p2 = CompositeCardItem("widget-mini", p2header, [p2body], p2footer)
p2header = IconText(p2icon, "neutral", "m", "Widget Mini", "New arrival", true, "horizontal")
p2icon = Icon("box", "shopping")
p2body = MetricIndicatorInline("980 units", "Sold this month", { direction: "up", value: 4 })
p2footer = { price: BoldText("text", "$14.00"), button: p2btn }
p2btn = Button("View Details", Action([@ToAssistant("Show details for Widget Mini")]), "secondary")`,

  `Example 6 — Editable table and a selection form:

root = Stack([tableHeader, editTable, formHeader, prefsForm])
tableHeader = InlineHeader("Team Roster", "Click a cell to edit")
editTable = EditableTable("roster", [colName, colRole, colStart], [row1, row2])
colName = { type: "text", key: "name", header: "Name" }
colRole = { type: "select", key: "role", header: "Role", options: [roleEng, roleDesign] }
roleEng = { value: "eng", label: "Engineering" }
roleDesign = { value: "design", label: "Design" }
colStart = { type: "date-single", key: "start", header: "Start Date" }
row1 = { id: "1", values: ["Alex Kim", "eng", "2024-01-15"] }
row2 = { id: "2", values: ["Jamie Lee", "design", "2024-03-02"] }
formHeader = InlineHeader("Preferences", "Tell us how you like to work")
prefsForm = Form("prefs", formButtons, [fc1, fc2])
fc1 = FormControl("Working Style", styleCards, "Pick the one that fits best")
styleCards = OptionCards("style", "single", [style1, style2])
style1 = OptionCard("focused", "Deep Focus", "Long uninterrupted blocks", style1icon)
style1icon = Icon("target", "tools")
style2 = OptionCard("collab", "Collaborative", "Frequent pairing and syncs", style2icon)
style2icon = Icon("users", "people")
fc2 = FormControl("Tools", toolChips, "Select all that apply")
toolChips = Chips("tools", "multiple", [tool1, tool2, tool3])
tool1 = ChipItem("figma", "Figma", tool1icon)
tool1icon = Icon("figma", "design")
tool2 = ChipItem("slack", "Slack", tool2icon)
tool2icon = Icon("message-square", "communication")
tool3 = ChipItem("notion", "Notion", tool3icon)
tool3icon = Icon("notebook", "text")
formButtons = Buttons([Button("Save", Action([@ToAssistant("Save preferences")]), "primary")])`,
];

export const openuiAdditionalRules: string[] = [
  "When asked about data, generate realistic/plausible data",
  'For grid-like layouts, use Stack with direction "row" and wrap=true. Avoid justify="between" unless you specifically want large gutters.',
  "For forms, define one FormControl reference per field so controls can stream progressively.",
  "For forms, always provide the second Form argument with Buttons(...) actions: Form(name, buttons, fields).",
  "Never nest Form inside Form.",
  'Use @Reset($var1, $var2) after form submit to restore defaults — not @Set($var, "")',
  "Multi-query refresh: Action([@Run(mutation), @Run(query1), @Run(query2), @Reset(...)])",
  "$variables are reactive: changing via Select or @Set re-evaluates all Queries and expressions referencing them",
  "Use existing components (Tabs, Accordion, Modal) before inventing ternary show/hide patterns",
  "Card blocks (SnippetCardBlock, OverviewCardBlock, ContextCardBlock, CompositeCardBlock, VisualCardBlock) need at least 2 items; every item in a block must have the same structure.",
  "Text / BoldText / IconText / ImageText / ImageTextLarge / MetricIndicatorInline / MetricIndicatorWithStrikethrough are inline building blocks used INSIDE card items — do not place them directly in a Stack or Card.",
  "EntityList size='small' (no header/footer) is only for use inside a CompositeCardItem body; use size='default' everywhere else.",
  "Image URLs must be real (from a tool result or the user) — never invent or template an image URL.",
  "Always pass a category to Icon — it enables a topical fallback when the exact icon name is unavailable.",
  "EditableTable requires the consuming app to persist edits — use it only when the user or app explicitly asks for an editable table; default to Table for read-only data.",
];

export const openuiPromptOptions: PromptOptions = {
  examples: openuiExamples,
  additionalRules: openuiAdditionalRules,
};

// OpenUI Chat Library

export const openuiChatExamples: string[] = [
  `Example 1 — Informational response (the shape for "tell me about X" / explainer asks):

root = Card([header, intro, highlights, statsHeader, statsCards, sectionsBlock, actionBtns], [src1, src2])
header = CardHeader("Paris", "The City of Light · France's Eternal Capital")
intro = TextContent("Paris is one of the world's most visited cities — a timeless blend of iconic landmarks, world-class cuisine, art, and romance [1]. In 2026 the city is buzzing with new energy: the **Grand Palais** has reopened after a €466M renovation, and you can now **swim in the Seine** for the first time in over a century [2].")
highlights = ContextCardBlock([h1, h2, h3], "grid", true, { type: "continue_conversation", context: "Tell me more about this aspect of Paris" })
h1 = ContextCardItem("art-museums", "Art & Museums", "143 museums including the Louvre & newly reopened Grand Palais.", "gray", "https://cdn.britannica.com/03/121003-050-2544BD4E/Interior-Louvre-Museum-Paris.jpg")
h2 = ContextCardItem("gastronomy", "Gastronomy", "9,000+ restaurants, 130+ Michelin stars, and the world's best baguettes.", "gray")
h3 = ContextCardItem("fashion-capital", "Fashion Capital", "Home to Chanel, Dior, Louis Vuitton & Hermès — the global luxury hub.", "gray", "https://thumbs.dreamstime.com/z/dior-storefront-facade-chanel-store-lvmh-s-french-designer-modehouse-christian-adjacent-to-luxury-fashion-beauty-brand-327161553.jpg")
statsHeader = InlineHeader("Paris by the Numbers", "Key visitor statistics")
statsCards = OverviewCardBlock([ov1, ov2, ov3], "grid", true)
ov1 = OverviewCardItem("annual-visitors", ov1top, ov1metric)
ov1top = IconText(ov1icon, "neutral", "m", "Annual Visitors", "2024 arrivals", false, "vertical")
ov1icon = Icon("users", "people")
ov1metric = MetricIndicatorInline("48.7M", "tourists", { direction: "up", value: 2.5 })
ov2 = OverviewCardItem("museums-monuments", ov2top, ov2metric)
ov2top = IconText(ov2icon, "neutral", "m", "Museums & Monuments", "Cultural sites", false, "vertical")
ov2icon = Icon("landmark", "buildings")
ov2metric = MetricIndicatorInline("2,370+", "across the city")
ov3 = OverviewCardItem("tourism-revenue", ov3top, ov3metric)
ov3top = IconText(ov3icon, "neutral", "m", "Tourism Revenue", "2024 estimate", false, "vertical")
ov3icon = Icon("circle-dollar-sign", "finance")
ov3metric = MetricIndicatorInline("€23.4B", "generated")
sectionsBlock = SectionBlock([secLandmarks, secFood, secWhen], false)
secLandmarks = SectionItem("landmarks", "Iconic Landmarks", [landmarksCarousel])
landmarksCarousel = VisualCardBlock([lm1, lm2, lm3, lm4], "carousel", true, { type: "continue_conversation", context: "Tell me more about this Paris landmark" })
lm1 = VisualCardItem(lm1body, "eiffel-tower", "https://c8.alamy.com/comp/RYEB13/aerial-view-of-the-eiffel-tower-with-the-park-champ-de-mars-and-the-river-seine-paris-france-RYEB13.jpg", lm1tag, "Aerial view of the Eiffel Tower")
lm1body = BoldText("text", "Eiffel Tower", "Open daily 9am–midnight")
lm1tag = Tag("Must-See", lm1tagIcon, "sm", "info")
lm1tagIcon = Icon("star", "shapes")
lm2 = VisualCardItem(lm2body, "the-louvre", "https://images.fineartamerica.com/images/artworkimages/mediumlarge/3/1-exterior-of-musee-du-louvre-museum-paris-france-bernard-jaubert.jpg", lm2tag, "Exterior of the Louvre museum")
lm2body = BoldText("text", "The Louvre", "World's largest art museum")
lm2tag = Tag("8.9M visits/yr", lm2tagIcon, "sm", "success")
lm2tagIcon = Icon("trending-up", "charts")
lm3 = VisualCardItem(lm3body, "notre-dame", "https://cdn.britannica.com/29/255529-050-63A22A3C/notre-dame-de-paris-cathedral-paris-france.jpg", lm3tag, "Notre-Dame cathedral facade")
lm3body = BoldText("text", "Notre-Dame", "Fully restored cathedral")
lm3tag = Tag("Reopened 2024", lm3tagIcon, "sm", "warning")
lm3tagIcon = Icon("hammer", "tools")
lm4 = VisualCardItem(lm4body, "versailles", "https://cdn.britannica.com/76/130076-050-31128A3D/Latona-Fountain-Balthazard-Marsy-Gaspard-Andre-Le.jpg", lm4tag, "Latona Fountain at Versailles")
lm4body = BoldText("text", "Palace of Versailles", "Royal gardens & grand halls")
lm4tag = Tag("Day Trip", lm4tagIcon, "sm", "neutral")
lm4tagIcon = Icon("train-front", "travel")
secFood = SectionItem("food", "Food & Drink", [foodCards])
foodCards = ContextCardBlock([f1, f2, f3], "grid", true, { type: "continue_conversation", context: "Tell me more about eating and drinking in Paris" })
f1 = ContextCardItem("bistros", "Bistros", "Classic French fare — try Les Arlots for confit beef cheeks.", "gray", "https://everydayparisian.com/wp-content/uploads/2023/01/IMG_0221-768x1024.webp")
f2 = ContextCardItem("fine-dining", "Fine Dining", "Septime leads a new wave of creative Michelin-starred cuisine.", "gray", "https://production-data.worldofmouth.app/images/72b2e6db-97ea-49c4-aa5d-3b7c8121c812.jpg")
f3 = ContextCardItem("bakeries", "Bakeries", "Shinya Pain for sourdough. Grand Prix-winning baguettes citywide.", "gray", "https://www.davidlebovitz.com/wp-content/uploads/2018/09/Le-petit-grain-paris-bakery-boulangerie-patisserie-pastry-shop-8-640x895.jpg")
secWhen = SectionItem("when", "Best Time to Visit", [whenTabs])
whenTabs = Tabs([tabSpring, tabSummer])
tabSpring = TabItem("spring", "Spring", [springList])
springList = ListBlock([sp1, sp2, sp3], "number")
sp1 = ListItem("Cherry blossoms at Parc de Sceaux", "March – May", null, null, { type: "continue_conversation", context: "Tell me about cherry blossom season in Paris" })
sp2 = ListItem("Picnics along the Seine & in city parks", "Warm, lively atmosphere", null, null, { type: "continue_conversation", context: "Where are the best picnic spots in Paris?" })
sp3 = ListItem("Fewer crowds than summer", "Ideal for sightseeing", null, null, { type: "continue_conversation", context: "How busy is Paris in spring?" })
tabSummer = TabItem("summer", "Summer", [summerList])
summerList = ListBlock([su1, su2, su3], "number")
su1 = ListItem("Swim in the Seine — open July & August 2026", "First time in 102 years", null, null, { type: "continue_conversation", context: "Tell me about swimming in the Seine" })
su2 = ListItem("Open-air cinema at Parc de la Villette", "Free films under the stars", null, null, { type: "continue_conversation", context: "Tell me about the open-air cinema at Parc de la Villette" })
su3 = ListItem("Bastille Day celebrations on July 14", "Fireworks at the Eiffel Tower", null, null, { type: "continue_conversation", context: "What happens in Paris on Bastille Day?" })
actionBtns = Buttons([btn1, btn2, btn3], "row")
btn1 = Button("Plan a Trip to Paris", { type: "continue_conversation", context: "Help me plan a trip to Paris" }, "primary")
btn2 = Button("Best Hotels in Paris", { type: "continue_conversation", context: "Show me the best hotels in Paris" }, "secondary")
btn3 = Button("Build a Paris Itinerary", { type: "continue_conversation", context: "Build a 5-day Paris itinerary for me" }, "secondary")
src1 = { title: "Paris Travel Guide 2025", sourceName: "Travel and Tour World", url: "https://www.travelandtourworld.com/news/article/from-iconic-landmarks-to-hidden-gems-the-ultimate-paris-travel-guide-for-2025-you-need-to-read-now/" }
src2 = { title: "Best Things to Do in Paris 2026", sourceName: "Time Out Paris", url: "http://www.timeout.fr/paris/en/for-tourists" }`,

  `Example 2 — Data and analytics response (quantitative asks lead with KPIs and charts):

root = Card([pageHeader, kpiBlock, sections, deepDiveHeader, compositeCards, actionButtons])
pageHeader = CardHeader("Analytics Dashboard", "April 2026 · Business Performance Overview")
kpiBlock = SnippetCardBlock([kpi1, kpi2, kpi3, kpi4], "grid", true)
kpi1 = SnippetCardItem("total-revenue", kpi1lhs, kpi1rhs)
kpi1lhs = IconText(kpi1icon, "neutral", "m", "Total Revenue", "Month to date", false, "horizontal")
kpi1icon = Icon("circle-dollar-sign", "finance")
kpi1rhs = BoldText("number", "$284,500", "+12.4%", "metric")
kpi2 = SnippetCardItem("active-users", kpi2lhs, kpi2rhs)
kpi2lhs = IconText(kpi2icon, "neutral", "m", "Active Users", "Monthly active users", false, "horizontal")
kpi2icon = Icon("users", "people")
kpi2rhs = BoldText("number", "47,320", "+6.8%", "metric")
kpi3 = SnippetCardItem("conversion-rate", kpi3lhs, kpi3rhs)
kpi3lhs = IconText(kpi3icon, "neutral", "m", "Conversion Rate", "Avg. this month", false, "horizontal")
kpi3icon = Icon("trending-up", "charts")
kpi3rhs = BoldText("number", "5.7%", "+0.9%", "metric")
kpi4 = SnippetCardItem("churn-rate", kpi4lhs, kpi4rhs)
kpi4lhs = IconText(kpi4icon, "neutral", "m", "Churn Rate", "Monthly customer churn", false, "horizontal")
kpi4icon = Icon("user-minus", "people")
kpi4rhs = BoldText("number", "2.1%", "-0.4%", "metric")
sections = SectionBlock([secUsers, secChannels], false)
secUsers = SectionItem("users", "User Activity", [userTabs])
userTabs = Tabs([tabGrowth, tabRetention])
tabGrowth = TabItem("growth", "User Growth", [growthChart])
growthChart = LineChart(months, [dauSeries, mauSeries], "natural", "Month", "Users (k)")
months = ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"]
dauSeries = Series("DAU", [5.1, 5.4, 5.8, 6.2, 6.7, 7.1, 7.6, 8.0, 8.4, 8.9, 9.3, 9.8])
mauSeries = Series("MAU", [28.4, 30.1, 31.8, 33.5, 35.2, 37.1, 38.8, 40.4, 42.1, 43.9, 45.6, 47.3])
tabRetention = TabItem("retention", "Cohort Retention", [retentionChart])
retentionChart = LineChart(cohortMonths, [cohortJan, cohortFeb, cohortMar], "natural", "Month Since Signup", "Retention (%)")
cohortMonths = ["Month 0", "Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6"]
cohortJan = Series("Jan Cohort", [100, 80, 70, 62, 56, 51, 47])
cohortFeb = Series("Feb Cohort", [100, 83, 73, 65, 59, 54, 50])
cohortMar = Series("Mar Cohort", [100, 86, 76, 68, 62, 0, 0])
secChannels = SectionItem("channels", "Acquisition Channels", [channelTabs])
channelTabs = Tabs([tabChannelBar, tabChannelTable])
tabChannelBar = TabItem("channel-bar", "Revenue by Channel", [channelBarChart])
channelBarChart = HorizontalBarChart(channels, [channelSeries], "grouped", "Revenue ($k)", "Channel")
channels = ["Organic Search", "Paid Ads", "Referral Program", "Partner Network", "Direct / Brand", "Email Campaigns"]
channelSeries = Series("Revenue ($k)", [82.4, 68.1, 54.6, 38.2, 26.8, 14.4])
tabChannelTable = TabItem("channel-table", "Full Breakdown", [channelTable])
channelTable = Table([colChannel, colLeads, colConv, colCac, colRevenue, colStatus])
colChannel = Col("Channel", channels, "string")
colLeads = Col("Leads", [4210, 3180, 2050, 1120, 1290, 820], "number")
colConv = Col("Conv. Rate", ["6.4%", "5.1%", "9.4%", "11.8%", "5.8%", "8.1%"], "string")
colCac = Col("CAC ($)", [188, 395, 132, 109, 218, 154], "number")
colRevenue = Col("Revenue ($k)", [82.4, 68.1, 54.6, 38.2, 26.8, 14.4], "number")
colStatus = Col("Status", ["Scaling", "Optimizing", "Scaling", "Growing", "Stable", "Stable"], "string")
deepDiveHeader = InlineHeader("Support Health & Marketing ROI", "Click a card to explore deeper insights")
compositeCards = CompositeCardBlock([cardSupport, cardMarketing], "grid", true, { type: "continue_conversation", context: "Explore this deep-dive area in more detail" })
cardSupport = CompositeCardItem("support-health", supportHeader, [supportMetric, supportChart, supportList])
supportHeader = IconText(supportIcon, "neutral", "m", "Support Health", "Ticket volume & resolution trends", false, "horizontal")
supportIcon = Icon("headphones", "communication")
supportMetric = MetricIndicatorInline("94.2% CSAT", "Customer Satisfaction Score", { direction: "up", value: 2.1 })
supportChart = BarChart(["Jan", "Feb", "Mar", "Apr"], [openSeries, resolvedSeries], "grouped", "Month", "Tickets")
openSeries = Series("Opened", [341, 327, 308, 289])
resolvedSeries = Series("Resolved", [319, 318, 301, 283])
supportList = EntityList([sup1, sup2, sup3], "small")
sup1 = { left: "Avg. Resolution Time", right: "4h 12m", rightVariant: "text" }
sup2 = { left: "First Contact Resolution", right: "78.4%", rightVariant: "number" }
sup3 = { left: "Escalation Rate", right: "6.2%", rightVariant: "number" }
cardMarketing = CompositeCardItem("marketing-roi", marketingHeader, [marketingMetric, marketingChart, marketingList])
marketingHeader = IconText(marketingIcon, "neutral", "m", "Marketing ROI", "Spend vs. pipeline generated", false, "horizontal")
marketingIcon = Icon("megaphone", "communication")
marketingMetric = MetricIndicatorInline("3.8x Blended ROI", "Return on Ad Spend", { direction: "up", value: 0.4 })
marketingChart = AreaChart(["Jan", "Feb", "Mar", "Apr"], [spendSeries, pipelineSeries], "natural", "Month", "Value ($k)")
spendSeries = Series("Ad Spend", [44.0, 46.8, 49.2, 51.6])
pipelineSeries = Series("Pipeline Generated", [158.2, 171.5, 184.9, 196.1])
marketingList = EntityList([mkt1, mkt2, mkt3], "small")
mkt1 = { left: "Total Ad Spend (Apr)", right: "$51,600", rightVariant: "number" }
mkt2 = { left: "Cost per Lead", right: "$48.20", rightVariant: "number" }
mkt3 = { left: "Top Channel", right: "Organic Search", rightVariant: "text" }
actionButtons = Buttons([btnChannels, btnForecast], "row")
btnChannels = Button("Break Down by Channel", { type: "continue_conversation", context: "Break down this month's revenue by acquisition channel" }, "primary")
btnForecast = Button("Forecast Next Quarter", { type: "continue_conversation", context: "Forecast revenue and active users for next quarter" }, "secondary")`,

  `Example 3 — Form response (help-me-choose/plan asks: inspiration cards FIRST, then a compact form). The inspiration-card images below came from an image tool call — include such cards ONLY when you have real URLs; with no real URLs, start directly with the form:

root = Card([header, intro, inspoCards, form])
header = CardHeader("Plan Your Trip", "A few ideas to spark inspiration — then tell me your preferences")
intro = TextContent("Tap a style to jump straight in, or fill the quick form below for a tailored plan.")
inspoCards = VisualCardBlock([insp1, insp2], "grid", true, { type: "continue_conversation", context: "Plan me a trip in this style with destinations, itinerary, and costs" })
insp1 = VisualCardItem(insp1body, "inspo-beach", "https://www.travelandleisure.com/thmb/cuAB7XMQ6s_Gji-no956KNopT7M=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/TAL-maldives-TROPVACAY0325-1b5047d5931d4850b47d082966f9f563.jpg", insp1tag, "Maldives overwater villas")
insp1body = BoldText("text", "Tropical Beach Escape", "Overwater villas & snorkeling")
insp1tag = Tag("Relaxation", insp1icon, "sm", "info")
insp1icon = Icon("umbrella", "travel")
insp2 = VisualCardItem(insp2body, "inspo-mountain", "https://www.salkantaytrekmachu.com/img/adventure-travel-peru-032.jpg", insp2tag, "Trekking in the Peruvian Andes")
insp2body = BoldText("text", "Mountain Adventure", "Trekking & epic views")
insp2tag = Tag("Active", insp2icon, "sm", "warning")
insp2icon = Icon("mountain", "nature")
form = Form("trip-planner", formButtons, [fcDestination, fcDates, fcTravellers, fcTripType, fcBudget, fcStay, fcNotes])
formButtons = Buttons([btnSubmit, btnSkip], "row")
btnSubmit = Button("Plan My Trip", { type: "continue_conversation", context: "Help me plan a trip based on my form submission" }, "primary")
btnSkip = Button("Just Surprise Me", { type: "continue_conversation", context: "Skip the form and surprise me with a destination and itinerary" }, "secondary")
fcDestination = FormControl("Destination", destinationInput, "Leave blank if you'd like suggestions")
destinationInput = Input("destination", "e.g. Tokyo, Japan — or leave blank", "text")
fcDates = FormControl("Travel Dates", datesPicker, "Select your start and end dates")
datesPicker = DatePicker("travel-dates", "range", { required: true })
fcTravellers = FormControl("Number of Travellers", travellersSelect, "How many people are travelling?")
travellersSelect = Select("num-travellers", [tr1, tr2, tr3, tr4], "Select number of travellers", { required: true })
tr1 = SelectItem("1", "1 — Solo")
tr2 = SelectItem("2", "2 — Couple")
tr3 = SelectItem("3-4", "3–4 People")
tr4 = SelectItem("5+", "5+ People")
fcTripType = FormControl("Trip Type", tripTypeCards, "What kind of trip are you planning?")
tripTypeCards = OptionCards("trip-type", "single", [oc1, oc2, oc3, oc4], { required: true })
oc1 = OptionCard("adventure", "Adventure", "Hiking, trekking & outdoor activities", oc1icon)
oc1icon = Icon("mountain", "nature")
oc2 = OptionCard("beach", "Beach & Relaxation", "Sun, sand & leisure", oc2icon)
oc2icon = Icon("waves", "nature")
oc3 = OptionCard("cultural", "Cultural & Historical", "Museums, heritage & local experiences", oc3icon)
oc3icon = Icon("landmark", "buildings")
oc4 = OptionCard("city", "City Break", "Urban exploration & nightlife", oc4icon)
oc4icon = Icon("building-2", "buildings")
fcBudget = FormControl("Estimated Budget (per person)", budgetSlider, "Drag to set your per-person budget in USD")
budgetSlider = Slider("budget", "discrete", 500, 10000, 500, [2500], "Budget (USD)")
fcStay = FormControl("Accommodation Preference", stayChips, "Select all that apply")
stayChips = Chips("accommodation", "multiple", [ch1, ch2, ch3, ch4], {}, ["hotel"])
ch1 = ChipItem("hotel", "Hotel", ch1icon)
ch1icon = Icon("building", "buildings")
ch2 = ChipItem("resort", "Resort", ch2icon)
ch2icon = Icon("umbrella", "travel")
ch3 = ChipItem("airbnb", "Vacation Rental", ch3icon)
ch3icon = Icon("home", "home")
ch4 = ChipItem("camping", "Camping / Glamping", ch4icon)
ch4icon = Icon("tent", "nature")
fcNotes = FormControl("Special Requests or Notes", notesArea, "Any dietary needs, accessibility requirements, or specific interests?")
notesArea = TextArea("special-requests", "e.g. vegetarian meals, wheelchair access, honeymoon surprise...", 4)`,

  `Example 4 — Recommendations with images and links (same pattern for products, movies, restaurants, articles):

root = Card([header, intro, posters, linksHeader, trackCards], [src1, src2])
header = CardHeader("Retro-Energetic Indian Tracks", "New Hindi releases with 80s/90s dance DNA")
intro = TextContent("These recent tracks channel retro synths and 90s party percussion [1][2]. Tap a poster to explore a track, or use its button to watch the exact official video.")
posters = VisualCardBlock([v1, v2], "grid", true, { type: "continue_conversation", context: "Tell me more about this track and its retro influences" })
v1 = VisualCardItem(v1body, "tamma", "https://i.ytimg.com/vi/PQHeOb0Q9oo/hq720.jpg", v1tag, "Tamma Tamma video poster")
v1body = BoldText("text", "Tamma Tamma", "Dhurandhar · Ranveer Singh")
v1tag = Tag("80s Electro-Disco", v1icon, "sm", "success")
v1icon = Icon("disc-3", "multimedia")
v2 = VisualCardItem(v2body, "sajan", "https://i.ytimg.com/vi/mLz-qBiRnl8/hq720.jpg", v2tag, "Sajan Re video poster")
v2body = BoldText("text", "Sajan Re", "Nora Fatehi · Badshah")
v2tag = Tag("Synthwave Electro", v2icon, "sm", "info")
v2icon = Icon("music", "multimedia")
linksHeader = InlineHeader("Watch the Exact Videos", "Each button opens that track's official video")
trackCards = CompositeCardBlock([t1, t2], "grid", true)
t1 = CompositeCardItem("t-tamma", t1h, [t1body, t1tags], { button: t1btn })
t1h = IconText(t1icon, "neutral", "m", "Tamma Tamma", "Bappi Lahiri classic, electro-funk rework", true, "horizontal")
t1icon = Icon("disc-3", "multimedia")
t1body = Text("text", "Heavy analog synths and brass over a fast disco groove.", "Retro Electro-Disco")
t1tags = TagBlock(["2026 Film Hit", "Peak Party"])
t1btn = Button("Watch on YouTube", { type: "open_url", url: "https://www.youtube.com/watch?v=PQHeOb0Q9oo" }, "primary")
t2 = CompositeCardItem("t-sajan", t2h, [t2body, t2tags], { button: t2btn })
t2h = IconText(t2icon, "neutral", "m", "Sajan Re", "Nora Fatehi · Badshah · Sanjoy", true, "horizontal")
t2icon = Icon("music", "multimedia")
t2body = Text("text", "Synthwave melody hooks over a modern club beat.", "Retro-Fusion Electro")
t2tags = TagBlock(["Club Anthem", "Nora x Badshah"])
t2btn = Button("Watch on YouTube", { type: "open_url", url: "https://www.youtube.com/watch?v=COUSCnFazzc" }, "primary")
src1 = { title: "Tamma Tamma (Full Video) - Dhurandhar", sourceName: "YouTube (T-Series)", url: "https://www.youtube.com/watch?v=PQHeOb0Q9oo" }
src2 = { title: "Sajan Re (Official Music Video)", sourceName: "YouTube (T-Series)", url: "https://www.youtube.com/watch?v=COUSCnFazzc" }`,

  `Example 5 — Table with follow-ups:

root = Card([title, tbl, followUps])
title = TextContent("Top Languages", "large-heavy")
tbl = Table([Col("Language", langs), Col("Users (M)", users), Col("Year", years)])
langs = ["Python", "JavaScript", "Java"]
users = [15.7, 14.2, 12.1]
years = [1991, 1995, 1995]
followUps = FollowUpBlock([fu1, fu2])
fu1 = FollowUpItem("Tell me more about Python")
fu2 = FollowUpItem("Show me a JavaScript comparison")`,
];

export const openuiChatAdditionalRules: string[] = [
  "When asked about data, generate realistic/plausible data",
  "Every response is a single Card(children) — children stack vertically automatically. No layout params are needed on Card.",
  "Card is the only layout container. Do NOT use Stack. Use Tabs to switch between sections, Carousel for horizontal scroll.",
  "Use FollowUpBlock at the END of a Card to suggest what the user can do or ask next.",
  "Use ListBlock when presenting a set of options or steps; give each ListItem an action (5th argument) to make it clickable — without one the item is plain text.",
  "Use SectionBlock to group long responses into collapsible sections — good for reports, FAQs, and structured content.",
  "Use SectionItem inside SectionBlock: each item needs a unique value id, a trigger (header label), and a content array.",
  "Carousel takes an array of slides, where each slide is an array of content: carousel = Carousel([[t1, img1], [t2, img2]])",
  "IMPORTANT: Every slide in a Carousel must use the same component structure in the same order — e.g. all slides: [title, image, description, tags].",
  "For forms, define one FormControl reference per field so controls can stream progressively.",
  "For forms, always provide the second Form argument with Buttons(...) actions: Form(name, buttons, fields).",
  "Never nest Form inside Form.",
  "CardHeader is the page-level heading — place it as the first child of Card; InlineHeader is a lighter subsection label for a block inside the response, and is redundant when the following component already has a heading.",
  "Never use Callout or TextCallout to justify why you did what you did or for any meta-information.",
  "Every image slot (Image, ImageBlock, ImageGallery, VisualCardItem/ContextCardItem bgImageSrc, ImageText, ImageTextLarge, ListItem image) requires a REAL URL from a tool result, the conversation, or the user — NEVER invent, guess, or template a URL.",
  "If no image URL is in context, compose without image components — icons, gray ContextCardItems, and charts still make rich layouts.",
  "Argument-order trap: Image takes alt FIRST, while ImageBlock, ImageText, and ImageTextLarge take src FIRST — alt text in a src slot ships a broken image.",
  'Card blocks (SnippetCardBlock, OverviewCardBlock, ContextCardBlock, CompositeCardBlock, VisualCardBlock) need at least 2 items, all with the same structure; use layout "grid" for primary side-by-side comparison and "carousel" for secondary browsing.',
  'The card-block action is BLOCK-LEVEL: one action shared by every card, with the clicked card\'s details attached automatically — keep continue_conversation context generic (e.g. "Tell me more about this destination"), and never use a block-level open_url since it would send every card to the same URL.',
  'Card items have NO per-item action: to give each item its own external link, use CompositeCardItem with footer { button: Button(label, { type: "open_url", url }) } — never claim a card opens a link it cannot.',
  "Text, BoldText, IconText, ImageText, ImageTextLarge and MetricIndicator* are inline building blocks used INSIDE card items — do not place them directly in the root Card.",
  'EntityList size "small" is reserved for CompositeCardItem body content (no header/footer); use size "default" elsewhere.',
  "Tag variant must be semantically correct (success=positive, danger=negative, warning=cautionary, info=informational, neutral=label); Tag takes an optional Icon second, so use Tag(text, icon, size, variant) when a variant is needed.",
  "TagBlock takes plain strings — keep it to at most 3 tags.",
  'ListBlock variant "number" is for ordered sequences and rankings, "image" for products/profiles with a real image; Steps is for ordered sequential processes only.',
  "Use SectionBlock to divide a long response into independent, equally prominent topics; use Tabs when the items are alternative views of the same thing; set isFoldable=false unless a section has 4+ distinct blocks; never make SectionBlock the first Card child.",
  "Accordion is for supplementary or FAQ content only — never primary information, 3-5 items max, and always the last component in its section or card.",
  'Charts: LineChart/AreaChart variant "natural" for smooth trends and "linear" for precise point-to-point data; BarChart "grouped" for side-by-side comparison and "stacked" for part-to-whole; prefer HorizontalBarChart when category labels are long or numerous.',
  'For large chart values, scale the data and put the unit in the axis label (e.g. yLabel "Revenue ($k)") instead of passing raw thousands or millions.',
  "Quantitative asks get a chart (plus KPI cards where useful) in the FIRST response — do not answer numbers with prose or a table alone.",
  "Table is column-oriented: each Col holds its own data array of plain strings or numbers (never components), and every column's array must have the same length.",
  "Use EditableTable ONLY when the user or app explicitly asks for an editable table; default to Table for read-only data.",
  'Every Form MUST have EXACTLY ONE submit Button with variant "primary" — that button validates the form; other buttons (secondary/tertiary escape hatches like "Just Surprise Me") skip validation, and there is never a reset button.',
  "Prefer structured inputs (Select, Chips, OptionCards, DatePicker, Slider) over free-text Input, give every FormControl a clear label (and a hint where it prevents mistakes), and keep each field name unique within the response.",
  "Validation rules ({ required: true, email: true, minLength: 8, ... }) are enforced with inline errors — use them for genuinely essential fields, but never require a free-text field where leaving it blank is meaningful.",
  "Form inputs work ONLY inside a FormControl within a Form; for tappable suggestion choices OUTSIDE a form, use Buttons of continue_conversation Buttons — never a bare OptionCards or Chips.",
  "Only add Buttons for real actions: form submit, open_url with a URL from a tool or the user (never fabricated), or a continue_conversation follow-up — never a button for an app action (open, download, export, edit) you cannot perform.",
  'Every Button label must accurately describe what clicking it does; use "primary" for the main action and "secondary"/"tertiary" only for lower-emphasis supporting actions.',
  "Icon: always include the category argument — it enables fallback matching when the exact lucide name is unavailable.",
  "Pass sources on Card ONLY when the answer relies on real references you actually have, and cite them inline in TextContent as [1], [2] (1-based index into sources).",
];

export const openuiChatPromptOptions: PromptOptions = {
  examples: openuiChatExamples,
  additionalRules: openuiChatAdditionalRules,
};
