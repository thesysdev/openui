import {
  AppWindow,
  Bot,
  Cpu,
  Database,
  FileCode,
  FilePen,
  FileSearch,
  GitMerge,
  LayoutDashboard,
  LineChart,
  ListFilter,
  MessageSquare,
  Search,
  Server,
  Type,
  Variable,
  Wrench,
} from "lucide-react";
import {
  Arrow,
  CodeNode,
  DiagramFrame,
  Label,
  Lane,
  Node,
  PathArrow,
  RowNode,
} from "./diagram-kit";

/** openui-lang/index: message in, prompt to the model, OpenUI Lang streamed back and rendered. */
export function LangGlanceDiagram() {
  const m = "lang-glance";
  return (
    <DiagramFrame
      id={m}
      title="OpenUI Lang at a glance"
      description="Your frontend sends the user's message to your backend. Your backend adds the prompt generated from your component library and calls the model. The model writes OpenUI Lang, for example root = Stack([chart]). Your backend streams it to your frontend, where the Renderer turns each line into your components."
      width={1020}
      height={400}
      minWidth={640}
    >
      <Node
        x={10}
        y={30}
        width={230}
        height={210}
        icon={AppWindow}
        title="Your frontend"
        lines={["The Renderer turns", "each line into your", "components"]}
      />
      <Node
        x={395}
        y={30}
        width={230}
        height={210}
        icon={Server}
        title="Your backend"
        lines={["Adds the prompt", "made from your", "component library"]}
      />
      <Node
        x={780}
        y={30}
        width={230}
        height={210}
        icon={Bot}
        title="Model"
        lines={["Writes OpenUI Lang", "with your components"]}
        highlight
      />

      <Arrow marker={m} x1={244} y1={110} x2={389} y2={110} />
      <Label x={317} y={98}>
        Message
      </Label>
      <Arrow marker={m} x1={391} y1={160} x2={246} y2={160} />
      <Label x={317} y={182}>
        Stream
      </Label>

      <Arrow marker={m} x1={629} y1={110} x2={774} y2={110} />
      <Label x={702} y={98}>
        Prompt
      </Label>
      <Arrow marker={m} x1={776} y1={160} x2={631} y2={160} />
      <Label x={702} y={182}>
        OpenUI Lang
      </Label>

      <Arrow marker={m} x1={895} y1={244} x2={895} y2={266} dashed />
      <CodeNode
        x={720}
        y={270}
        width={290}
        height={120}
        icon={FileCode}
        title="Example output"
        code={["root = Stack([chart])", "chart = PieChart(...)"]}
      />
    </DiagramFrame>
  );
}

/** architecture: generate once with the model, then execute without it. */
export function GenerateExecuteDiagram() {
  const m = "generate-execute";
  const xs = [35, 295, 555, 815];
  const w = 180;
  return (
    <DiagramFrame
      id={m}
      title="Generate once, then execute"
      description="Generate runs once per request: the user's request goes to your backend, which sends the system prompt and tool specs to the model, and the model writes an OpenUI Lang program. Execute runs after generation, without the model: the Renderer parses the program and renders your components. When the user clicks or changes a $variable, the runtime calls your tools through the toolProvider and sends the rows back to the components."
      width={1020}
      height={520}
      minWidth={680}
    >
      <Lane
        x={10}
        y={10}
        width={1000}
        height={210}
        title="Generate"
        tag="Once per request"
        tagWidth={170}
        tagRight
      />
      <Node
        x={xs[0]}
        y={60}
        width={w}
        height={140}
        icon={MessageSquare}
        title="Request"
        lines={["The user asks", "for a UI"]}
      />
      <Node
        x={xs[1]}
        y={60}
        width={w}
        height={140}
        icon={Server}
        title="Your backend"
        lines={["System prompt", "and tool specs"]}
      />
      <Node
        x={xs[2]}
        y={60}
        width={w}
        height={140}
        icon={Bot}
        title="Model"
        lines={["Writes the", "program"]}
      />
      <Node
        x={xs[3]}
        y={60}
        width={w}
        height={140}
        icon={FileCode}
        title="OpenUI Lang"
        lines={["Layout, queries,", "and actions"]}
        highlight
      />
      {[0, 1, 2].map((i) => (
        <Arrow key={i} marker={m} x1={xs[i] + w + 4} y1={130} x2={xs[i + 1] - 6} y2={130} />
      ))}

      <PathArrow marker={m} d="M905 204 V250 H125 V331" />
      <Label x={515} y={242}>
        Program
      </Label>

      <Lane
        x={10}
        y={280}
        width={1000}
        height={230}
        title="Execute"
        tag="Every click, no model"
        tagWidth={200}
        tagRight
      />
      <Node
        x={xs[0]}
        y={335}
        width={w}
        height={140}
        icon={FileSearch}
        title="Renderer"
        lines={["Parses the", "program"]}
      />
      <Node
        x={xs[1]}
        y={335}
        width={w}
        height={140}
        icon={LayoutDashboard}
        title="Components"
        lines={["Your design", "system"]}
      />
      <Node
        x={xs[2]}
        y={335}
        width={w}
        height={140}
        icon={Cpu}
        title="Runtime"
        lines={["Runs queries", "and actions"]}
      />
      <Node
        x={xs[3]}
        y={335}
        width={w}
        height={140}
        icon={Wrench}
        title="Your tools"
        lines={["Function map", "or MCP"]}
      />

      <Arrow marker={m} x1={xs[0] + w + 4} y1={405} x2={xs[1] - 6} y2={405} />
      <Label x={xs[0] + w + 40} y={393}>
        Renders
      </Label>

      <Arrow marker={m} x1={xs[1] + w + 4} y1={385} x2={xs[2] - 6} y2={385} />
      <Label x={xs[1] + w + 40} y={373}>
        Clicks
      </Label>
      <Arrow marker={m} x1={xs[2] - 4} y1={425} x2={xs[1] + w + 6} y2={425} />
      <Label x={xs[1] + w + 40} y={447}>
        Data
      </Label>

      <Arrow marker={m} x1={xs[2] + w + 4} y1={385} x2={xs[3] - 6} y2={385} />
      <Label x={xs[2] + w + 40} y={373}>
        Call
      </Label>
      <Arrow marker={m} x1={xs[3] - 4} y1={425} x2={xs[2] + w + 6} y2={425} />
      <Label x={xs[2] + w + 40} y={447}>
        Rows
      </Label>
    </DiagramFrame>
  );
}

/** reactive-state: one $variable change updates everything that reads it. */
export function ReactivityDiagram() {
  const m = "reactivity";
  return (
    <DiagramFrame
      id={m}
      title="How a $variable change spreads"
      description="The user picks 30 days in a Select. The Select is bound to $days, which changes from 7 to 30. The TextContent that reads $days shows the new text. The Query that takes $days in its arguments fetches again with days 30, and the Chart that reads the Query's rows re-renders."
      width={1020}
      height={450}
      minWidth={640}
    >
      <Node
        x={30}
        y={20}
        width={260}
        height={150}
        icon={ListFilter}
        title="Select"
        lines={["The user picks", '"30 days"']}
      />
      <Node
        x={370}
        y={20}
        width={260}
        height={150}
        icon={Variable}
        title="$days"
        lines={['"7"  →  "30"']}
        codeTitle
        highlight
      />
      <Arrow marker={m} x1={294} y1={95} x2={364} y2={95} />
      <Label x={329} y={83}>
        Sets
      </Label>

      <Arrow marker={m} x1={500} y1={174} x2={500} y2={274} />
      <PathArrow marker={m} d="M500 222 H170 V274" />
      <Label x={335} y={212}>
        Re-evaluates
      </Label>
      <Label x={512} y={212} anchor="start">
        Re-fetches
      </Label>

      <Node
        x={30}
        y={280}
        width={280}
        height={150}
        icon={Type}
        title="TextContent"
        lines={['"Showing last', '30 days"']}
      />
      <Node
        x={360}
        y={280}
        width={280}
        height={150}
        icon={Search}
        title="Query"
        lines={["Fetches again with", '{days: "30"}']}
      />
      <Node
        x={690}
        y={280}
        width={280}
        height={150}
        icon={LineChart}
        title="Chart"
        lines={["Re-renders with", "the new rows"]}
      />
      <Arrow marker={m} x1={644} y1={355} x2={684} y2={355} />
      <Label x={665} y={343}>
        Rows
      </Label>
    </DiagramFrame>
  );
}

/** queries-mutations: a Query goes from the program through the runtime to your tools. */
export function QueryFlowDiagram() {
  const m = "query-flow";
  return (
    <DiagramFrame
      id={m}
      title="How a Query reaches your tools"
      description="The program declares tickets = Query(list_tickets). On load, or when an action runs it with @Run, the runtime evaluates the arguments and calls the tool through toolProvider. Your tools, a function map or an MCP server, return rows. The runtime passes the rows to the components that read them, such as a table and a chart."
      width={1020}
      height={460}
      minWidth={640}
    >
      <CodeNode
        x={10}
        y={30}
        width={300}
        height={160}
        icon={FileCode}
        title="OpenUI Lang"
        code={["tickets = Query(", '  "list_tickets",', "  {}, {rows: []})"]}
      />
      <Arrow marker={m} x1={314} y1={110} x2={414} y2={110} />
      <Label x={364} y={84}>
        On load
      </Label>
      <Label x={364} y={100}>
        or @Run
      </Label>

      <Node
        x={420}
        y={30}
        width={180}
        height={160}
        icon={Cpu}
        title="Runtime"
        lines={["Evaluates the", "arguments"]}
        highlight
      />

      <Arrow marker={m} x1={604} y1={90} x2={804} y2={90} />
      <Label x={704} y={78} code>
        toolProvider
      </Label>
      <Arrow marker={m} x1={806} y1={140} x2={606} y2={140} />
      <Label x={704} y={162} code>
        {"{ rows: [...] }"}
      </Label>

      <Node
        x={810}
        y={30}
        width={200}
        height={160}
        icon={Wrench}
        title="Your tools"
        lines={["Function map", "or MCP server"]}
      />

      <Arrow marker={m} x1={510} y1={194} x2={510} y2={290} />
      <Label x={522} y={248} anchor="start">
        Rows
      </Label>

      <Node
        x={375}
        y={296}
        width={270}
        height={150}
        icon={LayoutDashboard}
        title="Your components"
        lines={["The table and chart", "re-render with the rows"]}
      />
    </DiagramFrame>
  );
}

/** message-protocol: how a stored message is written and read again. */
export function MessageProtocolDiagram() {
  const m = "message-protocol";
  return (
    <DiagramFrame
      id={m}
      title="Storing and reloading a message"
      description="Save: the model streams a response, your app wraps it with buildMessage into ]]>openui: marker lines, and stores it. Reload: your app reads the stored message with parseMessage. The content goes to the Renderer, the context goes to your app, for example to restore form values, and no marker lines go to the model."
      width={1020}
      height={540}
      minWidth={680}
    >
      <Lane x={10} y={10} width={1000} height={200} title="Save" />
      <Node
        x={40}
        y={55}
        width={220}
        height={135}
        icon={Bot}
        title="Model"
        lines={["Streams the", "response"]}
      />
      <Node
        x={400}
        y={55}
        width={220}
        height={135}
        icon={FilePen}
        title="buildMessage"
        lines={["Your app adds the", "]]>openui: lines"]}
        codeTitle
        highlight
      />
      <Node
        x={760}
        y={55}
        width={220}
        height={135}
        icon={Database}
        title="Storage"
        lines={["Your database"]}
      />
      <Arrow marker={m} x1={264} y1={122} x2={394} y2={122} />
      <Label x={329} y={110}>
        Text
      </Label>
      <Arrow marker={m} x1={624} y1={122} x2={754} y2={122} />
      <Label x={689} y={110}>
        Message
      </Label>

      <Lane x={10} y={240} width={1000} height={290} title="Reload" />
      <Node
        x={40}
        y={315}
        width={180}
        height={150}
        icon={Database}
        title="Storage"
        lines={["Stored message"]}
      />
      <Node
        x={300}
        y={315}
        width={200}
        height={150}
        icon={FileSearch}
        title="parseMessage"
        lines={["Your app splits", "the message"]}
        codeTitle
        highlight
      />
      <Arrow marker={m} x1={224} y1={390} x2={294} y2={390} />
      <Label x={259} y={378}>
        Load
      </Label>

      <RowNode
        x={680}
        y={278}
        width={310}
        height={64}
        icon={AppWindow}
        title="Renderer"
        line="Renders the content"
      />
      <RowNode
        x={680}
        y={358}
        width={310}
        height={64}
        icon={Server}
        title="Your app"
        line="Restores form values"
      />
      <RowNode
        x={680}
        y={438}
        width={310}
        height={64}
        icon={Bot}
        title="Model"
        line="Never sees the markers"
      />
      <Arrow marker={m} x1={504} y1={390} x2={674} y2={390} />
      <PathArrow marker={m} d="M560 390 V310 H674" />
      <PathArrow marker={m} d="M560 390 V470 H674" dashed />
      <Label x={620} y={302}>
        Content
      </Label>
      <Label x={620} y={382}>
        Context
      </Label>
      <Label x={620} y={462}>
        No markers
      </Label>
    </DiagramFrame>
  );
}

/** incremental-editing: the parser merges the model's patch into the previous program by name. */
export function IncrementalEditDiagram() {
  const m = "incremental-edit";
  return (
    <DiagramFrame
      id={m}
      title="Merging a patch by statement name"
      description="The previous program has root, header, tickets, and tbl. The model's patch redefines root to include chart and adds chart. mergeStatements merges them by name: root is replaced, header, tickets, and tbl are kept, and chart is added."
      width={1020}
      height={350}
      minWidth={680}
    >
      <CodeNode
        x={10}
        y={10}
        width={350}
        height={162}
        icon={FileCode}
        title="Previous program"
        code={[
          "root = Stack([header, tbl])",
          'header = CardHeader("Tickets")',
          "tickets = Query(...)",
          "tbl = Table([...])",
        ]}
      />
      <CodeNode
        x={10}
        y={220}
        width={350}
        height={114}
        icon={Bot}
        title="Model patch"
        code={["root = Stack([header, chart, tbl])", "chart = PieChart(...)"]}
        highlight
      />
      <Node
        x={410}
        y={100}
        width={175}
        height={150}
        icon={GitMerge}
        title="mergeStatements"
        lines={["Merges", "by name"]}
        codeTitle
      />
      <PathArrow marker={m} d="M364 91 H385 V150 H404" />
      <PathArrow marker={m} d="M364 277 H385 V200 H404" />
      <Arrow marker={m} x1={589} y1={175} x2={614} y2={175} />

      <CodeNode
        x={620}
        y={82}
        width={390}
        height={186}
        icon={FileCode}
        title="Merged program"
        code={[
          { text: "root = Stack([header, chart, tbl])", tag: "Replaced" },
          { text: 'header = CardHeader("Tickets")', tag: "Kept" },
          { text: "tickets = Query(...)", tag: "Kept" },
          { text: "tbl = Table([...])", tag: "Kept" },
          { text: "chart = PieChart(...)", tag: "Added" },
        ]}
      />
    </DiagramFrame>
  );
}
