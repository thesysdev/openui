import { AppWindow, Bot, Server, Wrench, type LucideIcon } from "lucide-react";

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
  icon: LucideIcon;
  title: string;
  lines: string[];
  footer?: string;
  compact?: boolean;
};

const boxes: Box[] = [
  {
    x: 10,
    y: 20,
    width: 200,
    height: 270,
    icon: AppWindow,
    title: "Chat UI",
    lines: ["Renders the stream", "with your components"],
    footer: "Your frontend",
  },
  {
    x: 410,
    y: 20,
    width: 200,
    height: 270,
    icon: Server,
    title: "Agent backend",
    lines: ["Adds OpenUI", "instructions to", "the system prompt"],
    footer: "Your code",
  },
  {
    x: 810,
    y: 20,
    width: 200,
    height: 270,
    icon: Bot,
    title: "Model",
    lines: ["Any provider,", "or OpenUI Gateway"],
  },
  {
    x: 410,
    y: 370,
    width: 200,
    height: 110,
    icon: Wrench,
    title: "Tools",
    lines: ["Run by your agent"],
    compact: true,
  },
];

const label = "fill-fd-foreground font-mono text-[13px] font-bold uppercase tracking-[0.1em]";
// Approximate advance of one label character, used to place the step badge beside centered text.
const labelCharWidth = 9.2;

function BoxNode({ box }: { box: Box }) {
  const center = box.x + box.width / 2;
  const Icon = box.icon;
  const iconY = box.compact ? box.y + 16 : box.y + 72;
  const titleY = iconY + (box.compact ? 54 : 62);
  return (
    <g>
      <rect
        x={box.x}
        y={box.y}
        width={box.width}
        height={box.height}
        rx={12}
        strokeWidth={1.75}
        className="fill-fd-background stroke-fd-foreground"
      />
      <Icon
        x={center - 15}
        y={iconY}
        width={30}
        height={30}
        strokeWidth={1.6}
        className="text-fd-foreground"
        aria-hidden="true"
      />
      <text
        x={center}
        y={titleY}
        textAnchor="middle"
        className="fill-fd-foreground font-mono text-[16px] font-bold uppercase tracking-[0.05em]"
      >
        {box.title}
      </text>
      {box.lines.map((line, index) => (
        <text
          key={line}
          x={center}
          y={titleY + (box.compact ? 26 : 30) + index * 24}
          textAnchor="middle"
          className="fill-fd-muted-foreground font-sans text-[15.5px]"
        >
          {line}
        </text>
      ))}
      {box.footer && (
        <text
          x={center}
          y={box.y + box.height - 16}
          textAnchor="middle"
          className="fill-fd-muted-foreground font-mono text-[12px] font-semibold uppercase tracking-[0.12em]"
        >
          {box.footer}
        </text>
      )}
    </g>
  );
}

function Arrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="currentColor"
      strokeWidth={1.6}
      markerEnd="url(#agent-turn-arrow)"
    />
  );
}

// A label placed at x, led by a numbered badge matching the steps under the diagram.
// Without a step, it's a plain label.
function Step({
  x,
  y,
  step,
  text,
  anchor = "middle",
}: {
  x: number;
  y: number;
  step?: number;
  text: string;
  anchor?: "middle" | "start" | "end";
}) {
  if (step === undefined) {
    return (
      <text x={x} y={y} textAnchor={anchor} className={label}>
        {text}
      </text>
    );
  }

  const badge = 22;
  const gap = 8;
  const textWidth = text.length * labelCharWidth;
  const total = badge + gap + textWidth;
  const left = anchor === "middle" ? x - total / 2 : anchor === "start" ? x : x - total;
  return (
    <g>
      <circle cx={left + badge / 2} cy={y - 5} r={badge / 2} className="fill-fd-foreground" />
      <text
        x={left + badge / 2}
        y={y - 1}
        textAnchor="middle"
        className="fill-fd-background font-mono text-[12px] font-bold"
      >
        {step}
      </text>
      <text x={left + badge + gap} y={y} className={label}>
        {text}
      </text>
    </g>
  );
}

/** Pass `showSteps={false}` where the numbered steps aren't listed alongside the diagram. */
export function AgentTurnDiagram({ showSteps = true }: { showSteps?: boolean }) {
  const step = (n: number) => (showSteps ? n : undefined);
  return (
    <figure className="not-prose my-8 overflow-x-auto">
      <svg
        viewBox="0 0 1020 500"
        role="img"
        aria-labelledby="agent-turn-title agent-turn-description"
        className="h-auto w-full min-w-[640px] text-fd-foreground"
      >
        <title id="agent-turn-title">One turn of an OpenUI agent</title>
        <desc id="agent-turn-description">
          The chat UI sends the user&apos;s message to the agent backend. The backend sends the
          model a system prompt that includes OpenUI instructions, along with the messages. The
          model may call tools, which the backend runs and returns results for. The model streams
          OpenUI Lang to the backend, which forwards the stream to the chat UI, where the renderer
          draws components as lines arrive. When the user clicks a button in the generated
          interface, the chat UI sends the action and form values to the backend as a new turn.
        </desc>
        <defs>
          <marker
            id="agent-turn-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="11"
            markerHeight="11"
            markerUnits="userSpaceOnUse"
            orient="auto-start-reverse"
          >
            <path
              d="M1 1 L9 5 L1 9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        </defs>

        {/* Requests read left to right above their arrows, replies right to left below. */}
        {/* 1. The message goes to the backend; 2. the backend prompts the model. */}
        <Arrow x1={214} y1={90} x2={404} y2={90} />
        <Step x={310} y={76} step={step(1)} text="Message" />
        <Arrow x1={614} y1={90} x2={804} y2={90} />
        <Step x={710} y={76} step={step(2)} text="Prompt" />

        {/* 3. Tools run in the backend between model calls. */}
        <Arrow x1={490} y1={294} x2={490} y2={364} />
        <Arrow x1={530} y1={366} x2={530} y2={296} />
        <Step x={478} y={336} step={step(3)} text="Tool call" anchor="end" />
        <text x={542} y={336} className={label}>
          Result
        </text>

        {/* 4. OpenUI Lang streams back through the backend to the chat UI. */}
        <Arrow x1={806} y1={140} x2={616} y2={140} />
        <Step x={710} y={168} step={step(4)} text="OpenUI Lang" />
        <Arrow x1={406} y1={140} x2={216} y2={140} />
        <text x={310} y={168} textAnchor="middle" className={label}>
          Stream
        </text>

        {/* 6. A click in the generated interface becomes a new turn. */}
        <Arrow x1={214} y1={240} x2={404} y2={240} />
        <Step x={310} y={226} step={step(6)} text="Action" />
        <text
          x={310}
          y={264}
          textAnchor="middle"
          className="fill-fd-muted-foreground font-sans text-[14px]"
        >
          with form values
        </text>

        {boxes.map((box) => (
          <BoxNode key={box.title} box={box} />
        ))}

        {/* 5. Rendering happens inside the chat UI. */}
        {showSteps && <Step x={26} y={47} step={5} text="Render" anchor="start" />}
      </svg>
    </figure>
  );
}
