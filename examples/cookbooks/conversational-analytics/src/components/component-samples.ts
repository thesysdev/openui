// Sample OpenUI Lang programs for each component the chat library allows.
// Series, Col and FollowUpItem only render inside their parent, so their samples include one.
// The F1 charts fetch their own rows from the F1 tools, so the agent only names what it wants.
// The last F1 chart sample shows the raw-data escape hatch.
const f1ChartSamples = [
  { name: "GapChart", source: `root = GapChart("Baku", ["RUS", "VER", "HAD", "LEC"], "Gap to the leader, Baku top four")` },
  { name: "RaceTrace", source: `root = RaceTrace("Baku", null, "Race trace, Baku top six")` },
  { name: "LapTimes", source: `root = LapTimes("Baku", ["RUS", "VER"], "Russell and Verstappen lap times, Baku")` },
  { name: "RankedBars", source: `root = RankedBars("Baku qualifying", "gap to pole", "Gap to pole, Baku qualifying")` },
  { name: "HeadToHeadBars", source: `root = Stack([HeadToHeadBars(["LEC", "HAM"], "season", "Leclerc vs Hamilton, 2026"), HeadToHeadBars(["RUS", "VER"], "Baku", "Russell vs Verstappen, Baku")])` },
  { name: "StintBar", source: `root = StintBar("Baku", null, "Tyre strategies, Baku top ten")` },
  { name: "ChampionshipProgress", source: `root = Stack([ChampionshipProgress(["ANT", "RUS", "HAM", "NOR", "LEC"], "Drivers' championship, 2026"), ChampionshipProgress(["ANT", "RUS", "HAM"], "Gap to Antonelli, 2026", "gap")])` },
  {
    name: "StatCallout",
    source: `root = Stack([StatCallout("Winning margin", "0.196", "s", "Ahead of VER in Baku", "RUS"), StatCallout("Fastest lap", "1:44.916", "", "Lap 49", "RUS")], "row", "l")`,
  },
  { name: "Sparkline", source: `root = Stack([TextContent("Antonelli points through 2026", "small-heavy"), Sparkline("ANT")], "column", "s")` },
  {
    name: "RankedBars (raw data)",
    source: `root = RankedBars(null, null, "Top speed, Baku", null, [{code: "ALB", value: 351.2}, {code: "SAI", value: 349.8}, {code: "VER", value: 348.1}], "number")`,
  },
];

export const componentSamples: { name: string; source: string }[] = [
  ...f1ChartSamples,
  {
    name: "Stack",
    source: `root = Stack([a, b, c], "row", "m")
a = Card([TextContent("Verstappen")])
b = Card([TextContent("Norris")])
c = Card([TextContent("Leclerc")])`,
  },
  {
    name: "Card",
    source: `root = Card([CardHeader("Miami Grand Prix", "2024, Round 6"), TextContent("Lando Norris took his first Formula 1 win.")])`,
  },
  {
    name: "CardHeader",
    source: `root = CardHeader("Fastest lap", "Recorded lap times from OpenF1")`,
  },
  {
    name: "TextContent",
    source: `root = Stack([TextContent("Russell won Baku by 0.196s", "h1"), TextContent("How he won it", "h2"), TextContent("George Russell", "h3"), TextContent("Norris led the final **24 laps** after the safety car."), TextContent("Top three", "small-heavy"), TextContent("Source: OpenF1", "small")])`,
  },
  {
    name: "LineChart",
    source: `root = LineChart(["1", "2", "3", "4", "5"], [Series("Norris", [93.2, 92.8, 92.5, 92.9, 92.4]), Series("Verstappen", [93.0, 92.9, 92.7, 92.6, 92.8])], "linear", "Lap", "Lap time (s)")`,
  },
  {
    name: "BarChart",
    source: `root = BarChart(["Norris", "Verstappen", "Leclerc", "Perez", "Sainz"], [Series("Best lap (s)", [90.6, 90.9, 91.1, 91.3, 91.2])], "grouped", "Driver", "Seconds")`,
  },
  {
    name: "Series",
    source: `root = BarChart(["Q1", "Q2", "Q3"], [Series("Norris", [88.4, 87.9, 87.6]), Series("Verstappen", [88.1, 87.7, 87.2])])`,
  },
  {
    name: "Table",
    source: `root = Table([Col("Driver", ["Norris", "Verstappen", "Leclerc"]), Col("Lap", [54, 50, 49], "number"), Col("Time", ["1:30.634", "1:30.980", "1:31.102"])])`,
  },
  {
    name: "Table with start slot",
    source: `root = Card([CardHeader("Azerbaijan Grand Prix", "Race classification · top five"), Table([Col("Pos", [1, 2, 3, 4, 5]), Col("Driver", ["George Russell", "Charles Leclerc", "Lando Norris", "Max Verstappen", "Oscar Piastri"]), Col("Team", [TeamChip("Mercedes"), TeamChip("Ferrari"), TeamChip("McLaren"), TeamChip("Red Bull Racing"), TeamChip("McLaren")]), Col("Time / gap", ["1:38:02.143", "+2.817", "+6.090", "+11.402", "+14.771"], "number"), Col("Pts", [25, 18, 15, 12, 10], "number")], [DriverAvatar("RUS", "s", true), DriverAvatar("LEC", "s", true), DriverAvatar("NOR", "s", true), DriverAvatar("VER", "s", true), DriverAvatar("PIA", "s", true)])])`,
  },
  {
    name: "Team table",
    source: `root = Table([Col("Pos", [1, 2, 3]), Col("Team", ["McLaren", "Ferrari", "Mercedes"]), Col("Pts", [412, 356, 331], "number")], [TeamLogo("McLaren", "s"), TeamLogo("Ferrari", "s"), TeamLogo("Mercedes", "s")])`,
  },
  {
    name: "Col",
    source: `root = Table([Col("Position", [1, 2, 3], "number"), Col("Team", ["McLaren", "Red Bull", "Ferrari"])])`,
  },
  {
    name: "FollowUpBlock",
    source: `root = FollowUpBlock([FollowUpItem("Where did Verstappen gain on Russell?", "VER vs RUS"), FollowUpItem("Show Leclerc's fastest laps", "LEC"), FollowUpItem("How strong is Ferrari this year?", "Ferrari"), FollowUpItem("Show the tyre strategies in Monza", "Monza"), FollowUpItem("What happened on lap 31?", "lap 31")])`,
  },
  {
    name: "FollowUpItem",
    source: `root = FollowUpBlock([FollowUpItem("Who was fastest after the safety car?")])`,
  },
  {
    name: "DriverAvatar",
    source: `root = Stack([DriverAvatar("NOR", "l"), DriverAvatar("LEC", "l", true), DriverAvatar("VER"), DriverAvatar("44", "s")], "row", "m", "center")`,
  },
  {
    name: "TeamLogo",
    source: `root = Stack([TeamLogo("McLaren", "l"), TeamLogo("Ferrari", "l"), TeamLogo("Red Bull"), TeamLogo("Mercedes", "s")], "row", "l", "center")`,
  },
  {
    name: "TeamChip",
    source: `root = Stack([TeamChip("McLaren"), TeamChip("Ferrari"), TeamChip("Aston Martin")], "column", "s")`,
  },
  {
    name: "CircuitMap",
    source: `root = Stack([CircuitMap("Monza", "l"), CircuitMap("Miami"), CircuitMap("Baku", "s")], "row", "m", "center")`,
  },
  {
    name: "CountryFlag",
    source: `root = Stack([CountryFlag("it", "l"), CountryFlag("Silverstone"), CountryFlag("jp", "s")], "row", "m", "center")`,
  },
  {
    name: "CarSilhouette",
    source: `root = Stack([CarSilhouette("McLaren"), CarSilhouette("Ferrari", "top")], "row", "l", "center")`,
  },
  {
    name: "Car3D",
    source: `root = Stack([Car3D("Mercedes"), Car3D("Aston Martin", "s")], "row", "l", "end")`,
  },
  {
    name: "Helmet",
    source: `root = Stack([Helmet("Ferrari", "l"), Helmet("Williams"), Helmet("Alpine", "s")], "row", "m", "center")`,
  },
  {
    name: "Driver card",
    source: `root = Card([CardHeader("Charles Leclerc", "Ferrari · #16"), Stack([DriverAvatar("LEC", "l", true), Stack([TeamLogo("Ferrari"), TeamChip("Ferrari"), CountryFlag("mc")], "column", "s"), Car3D("Ferrari", "s")], "row", "l", "center")])`,
  },
  {
    name: "Mascot (agent)",
    source: `root = Stack([Mascot("m", "happy"), Stack([TextContent("Hi, I'm Shiro", "h2"), TextContent("Your pit-wall engineer for Formula 1. Ask me about any race, driver or team.")], "column", "s")], "row", "l", "center")`,
  },
  {
    name: "Spotlight",
    source: `root = Spotlight([SpotlightItem("Closed 17.4s after the lap 31 safety car", "VER vs RUS"), SpotlightItem("Second straight win from pole", "RUS"), SpotlightItem("Both safety cars came on lap 31 and 36", "lap 31")])`,
  },
];
