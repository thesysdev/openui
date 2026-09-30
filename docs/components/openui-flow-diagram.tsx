import {
  AppWindow,
  Blocks,
  Bot,
  Cloud,
  Server,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
  icon: LucideIcon;
  title: string;
  lines: string[];
  footer?: string;
  highlight?: boolean;
  compact?: boolean;
  // Top of the icon, when the content should not start at the top of the box.
  contentY?: number;
};

const boxes: Box[] = [
  {
    x: 10,
    y: 40,
    width: 200,
    height: 184,
    icon: AppWindow,
    title: "Your frontend",
    lines: ["Renders the stream", "with your components"],
    footer: "e.g. Agent Interface",
  },
  {
    x: 10,
    y: 330,
    width: 200,
    height: 150,
    icon: Blocks,
    title: "Component library",
    lines: ["What the model uses"],
    compact: true,
  },
  {
    x: 290,
    y: 20,
    width: 150,
    height: 520,
    icon: Server,
    title: "Your backend",
    lines: ["Runs your agent", "and tools"],
    footer: "Your code",
    contentY: 190,
  },
  {
    x: 530,
    y: 75,
    width: 180,
    height: 175,
    icon: Sparkles,
    title: "OpenUI Gateway",
    lines: ["Any model, one API", "Fixes the stream"],
    highlight: true,
  },
  {
    x: 820,
    y: 75,
    width: 180,
    height: 175,
    icon: Bot,
    title: "Any model",
    lines: ["OpenAI, Anthropic,", "and more"],
  },
  {
    x: 530,
    y: 410,
    width: 180,
    height: 110,
    icon: Wrench,
    title: "Autofix",
    lines: ["Fixes the output"],
    highlight: true,
    compact: true,
  },
  {
    x: 820,
    y: 345,
    width: 180,
    height: 175,
    icon: Cloud,
    title: "Your provider",
    lines: ["Called directly", "by your backend"],
  },
];

const lanes = [
  { y: 20, height: 250, title: "Through OpenUI Gateway", tag: "Recommended" },
  { y: 290, height: 250, title: "Call models directly" },
];

const label = "fill-fd-foreground font-mono text-[13px] font-bold uppercase tracking-[0.1em]";

function BoxNode({ box }: { box: Box }) {
  const center = box.x + box.width / 2;
  const Icon = box.icon;
  const iconY = box.contentY ?? box.y + (box.compact ? 16 : 22);
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
        className={
          box.highlight
            ? "fill-[#eef1fb] stroke-fd-foreground dark:fill-[#1c2233]"
            : "fill-fd-background stroke-fd-foreground"
        }
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
      markerEnd="url(#openui-flow-arrow)"
    />
  );
}

// A request and its reply between two boxes, read left to right.
function Exchange({
  from,
  to,
  y,
  gap = 45,
  request,
  reply,
  labelX,
}: {
  from: number;
  to: number;
  y: number;
  gap?: number;
  request: string;
  reply: string;
  labelX?: number;
}) {
  const center = labelX ?? (from + to) / 2;
  return (
    <g>
      <Arrow x1={from + 4} y1={y} x2={to - 6} y2={y} />
      <text x={center} y={y - 12} textAnchor="middle" className={label}>
        {request}
      </text>
      <Arrow x1={to - 4} y1={y + gap} x2={from + 6} y2={y + gap} />
      <text x={center} y={y + gap + 22} textAnchor="middle" className={label}>
        {reply}
      </text>
    </g>
  );
}

export function OpenUIFlowDiagram() {
  return (
    <figure className="not-prose my-8 overflow-x-auto">
      <svg
        viewBox="0 0 1020 560"
        role="img"
        aria-labelledby="openui-flow-title openui-flow-description"
        className="h-auto w-full min-w-[640px] text-fd-foreground"
      >
        <title id="openui-flow-title">How OpenUI works</title>
        <desc id="openui-flow-description">
          Your component library gives your frontend its components and your backend its system
          prompt. Your frontend sends a message to your backend, which calls a model in one of two
          ways. The recommended way is through OpenUI Gateway, which calls any model and fixes the
          OpenUI Lang stream as it arrives. Alternatively, your backend calls your model provider
          directly and sends invalid output to Autofix to be fixed. Your backend streams the
          generated UI back to your frontend.
        </desc>
        <defs>
          <marker
            id="openui-flow-arrow"
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

        {lanes.map((lane) => (
          <g key={lane.title}>
            <rect
              x={500}
              y={lane.y}
              width={515}
              height={lane.height}
              rx={16}
              strokeWidth={1.25}
              strokeDasharray="6 6"
              className="fill-fd-muted/40 stroke-fd-muted-foreground/60"
            />
            <text x={520} y={lane.y + 32} className={label}>
              {lane.title}
            </text>
            {lane.tag && (
              <g>
                <rect
                  x={740}
                  y={lane.y + 14}
                  width={132}
                  height={26}
                  rx={13}
                  className="fill-fd-foreground"
                />
                <text
                  x={806}
                  y={lane.y + 32}
                  textAnchor="middle"
                  className="fill-fd-background font-mono text-[11.5px] font-bold uppercase tracking-[0.12em]"
                >
                  {lane.tag}
                </text>
              </g>
            )}
          </g>
        ))}

        <Exchange from={210} to={290} y={108} gap={50} request="Message" reply="Stream" />

        {/* The component library feeds both the renderer and the system prompt. */}
        <Arrow x1={110} y1={326} x2={110} y2={230} />
        <text x={122} y={283} className={label}>
          Components
        </text>
        <Arrow x1={214} y1={405} x2={284} y2={405} />
        <text x={250} y={393} textAnchor="middle" className={label}>
          Prompt
        </text>

        {/* Through Gateway. */}
        <Exchange from={440} to={530} y={140} request="Request" reply="Stream" />
        <Exchange from={710} to={820} y={140} request="Prompt" reply="OpenUI Lang" />

        {/* Directly: your backend calls your provider, then sends invalid output to Autofix. */}
        <Exchange
          from={440}
          to={820}
          y={365}
          gap={30}
          request="Prompt"
          reply="OpenUI Lang"
          labelX={765}
        />
        <Exchange from={440} to={530} y={455} gap={35} request="Output" reply="Fixed" />

        {boxes.map((box) => (
          <BoxNode key={box.title} box={box} />
        ))}
      </svg>
    </figure>
  );
}
