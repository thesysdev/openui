import {
  Database,
  MessageSquare,
  PanelsTopLeft,
  Server,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Arrow, DiagramFrame, Label, Lane, Node } from "./diagram-kit";

/** A numbered badge followed by an arrow label, centred on x. */
function StepLabel({
  x,
  y,
  n,
  code,
  anchor = "middle",
  children,
}: {
  x: number;
  y: number;
  n: number;
  code?: boolean;
  anchor?: "start" | "middle";
  children: string;
}) {
  // Approximate width of the label text: mono 13px, uppercase labels are tracked wider.
  const textWidth = children.length * (code ? 7.9 : 9.3);
  const total = 20 + 6 + textWidth;
  const left = anchor === "middle" ? x - total / 2 : x;
  const cx = left + 10;
  return (
    <g>
      <circle
        cx={cx}
        cy={y - 4.5}
        r={10}
        className="fill-fd-background stroke-fd-muted-foreground"
        strokeWidth={1.25}
      />
      <text
        x={cx}
        y={y}
        textAnchor="middle"
        className="fill-fd-muted-foreground font-mono text-[11.5px] font-semibold"
      >
        {n}
      </text>
      <Label x={left + 26} y={y} anchor="start" code={code}>
        {children}
      </Label>
    </g>
  );
}

/** dashboards/index: how a dashboard is generated, rendered, and loads its data. */
export function DashboardFlowDiagram() {
  const m = "dashboard-flow";
  return (
    <DiagramFrame
      id={m}
      title="How dashboards work"
      description="1. The user asks for a dashboard in the chat, and the agent on your server receives the message. 2. The agent's create_dashboard or edit_dashboard tool calls dashboards.create() or dashboards.edit(), and OpenUI's generator starts building the dashboard. 3. The call returns a response right away. 4. The agent returns the response as the tool result. 5. The chat passes the result to LiveArtifactRenderer. 6. The dashboard's Query() calls go to the interpreter route on your server. 7. A generated script runs in OpenUI's interpreter, a secure execution environment. 8. The script calls your data tools on your server. 9. The results return to the renderer."
      width={1020}
      height={520}
      minWidth={640}
    >
      <Lane x={10} y={10} width={250} height={480} title="Browser" />
      <Lane x={380} y={10} width={250} height={480} title="Your server" />
      <Lane x={790} y={10} width={220} height={480} title="OpenUI" />

      <Node
        x={30}
        y={60}
        width={210}
        height={170}
        icon={MessageSquare}
        title="Chat"
        lines={["The user asks", "for a dashboard"]}
      />
      <Node
        x={400}
        y={60}
        width={210}
        height={170}
        icon={Server}
        title="Agent"
        lines={["create_dashboard", "and edit_dashboard", "tools"]}
      />
      <Node
        x={810}
        y={60}
        width={180}
        height={170}
        icon={Sparkles}
        title="Generator"
        lines={["Builds the", "dashboard from", "your library"]}
        highlight
      />
      <Node
        x={30}
        y={300}
        width={210}
        height={170}
        icon={PanelsTopLeft}
        title="LiveArtifactRenderer"
        lines={["Renders the", "dashboard"]}
        codeTitle
      />
      <Node
        x={400}
        y={300}
        width={210}
        height={170}
        icon={Database}
        title="Data tools"
        lines={["/api/interpreter", "runs your tools"]}
      />
      <Node
        x={810}
        y={300}
        width={180}
        height={170}
        icon={ShieldCheck}
        title="Interpreter"
        lines={["Secure execution", "of generated", "scripts"]}
        highlight
      />

      {/* Chat and agent. */}
      <Arrow marker={m} x1={244} y1={120} x2={394} y2={120} />
      <StepLabel x={320} y={108} n={1}>
        Message
      </StepLabel>
      <Arrow marker={m} x1={396} y1={170} x2={246} y2={170} />
      <StepLabel x={320} y={192} n={4}>
        Tool result
      </StepLabel>

      {/* Agent and generator. */}
      <Arrow marker={m} x1={614} y1={120} x2={804} y2={120} />
      <StepLabel x={710} y={108} n={2} code>
        create() / edit()
      </StepLabel>
      <Arrow marker={m} x1={806} y1={170} x2={616} y2={170} />
      <StepLabel x={710} y={192} n={3}>
        Response
      </StepLabel>

      {/* The chat passes the tool result to the renderer. */}
      <Arrow marker={m} x1={135} y1={234} x2={135} y2={294} />
      <StepLabel x={147} y={270} n={5} anchor="start">
        Result
      </StepLabel>

      {/* Renderer and the interpreter route on your server. */}
      <Arrow marker={m} x1={244} y1={360} x2={394} y2={360} />
      <StepLabel x={320} y={348} n={6} code>
        Query()
      </StepLabel>
      <Arrow marker={m} x1={396} y1={410} x2={246} y2={410} />
      <StepLabel x={320} y={432} n={9}>
        Results
      </StepLabel>

      {/* Your server and the interpreter: scripts run there and call your tools back. */}
      <Arrow marker={m} x1={614} y1={360} x2={804} y2={360} />
      <StepLabel x={710} y={348} n={7}>
        Run script
      </StepLabel>
      <Arrow marker={m} x1={806} y1={410} x2={616} y2={410} />
      <StepLabel x={710} y={432} n={8}>
        Tool calls
      </StepLabel>
    </DiagramFrame>
  );
}
