import { Database, MessagesSquare, Server, Sparkles, type LucideIcon } from "lucide-react";

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
};

const boxes: Box[] = [
  {
    x: 10,
    y: 40,
    width: 210,
    height: 184,
    icon: MessagesSquare,
    title: "Chat interface",
    lines: ["Takes the question", "Shows the answer live"],
    footer: "e.g. Agent Interface",
  },
  {
    x: 350,
    y: 40,
    width: 230,
    height: 184,
    icon: Sparkles,
    title: "OpenUI Gateway",
    lines: ["Runs the model", "Checks the generated UI", "Stores the conversation"],
    highlight: true,
  },
  {
    x: 710,
    y: 40,
    width: 210,
    height: 184,
    icon: Server,
    title: "Your server",
    lines: ["Runs the tool", "Checks its arguments"],
    footer: "Application owned",
  },
  {
    x: 705,
    y: 314,
    width: 220,
    height: 146,
    icon: Database,
    title: "Your data",
    lines: ["Read-only queries"],
    footer: "F1 lap times · SQLite",
  },
];

// One request and one reply between each pair of boxes, read left to right.
const links = [
  { from: 220, to: 350, request: "Question", reply: "Answer" },
  { from: 580, to: 710, request: "Tool call", reply: "Tool result" },
];

const label = "fill-fd-foreground font-mono text-[13px] font-bold uppercase tracking-[0.1em]";

function BoxNode({ box }: { box: Box }) {
  const center = box.x + box.width / 2;
  const Icon = box.icon;
  const compact = box.height < 160;
  const titleY = box.y + (compact ? 76 : 84);
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
        y={box.y + (compact ? 18 : 22)}
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
        className="fill-fd-foreground font-mono text-[17px] font-bold uppercase tracking-[0.05em]"
      >
        {box.title}
      </text>
      {box.lines.map((line, index) => (
        <text
          key={line}
          x={center}
          y={titleY + 30 + index * 24}
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
      markerEnd="url(#analytics-architecture-arrow)"
    />
  );
}

export function CookbookAnalyticsArchitecture() {
  return (
    <figure className="not-prose my-6 overflow-x-auto">
      <svg
        viewBox="0 0 930 474"
        role="img"
        aria-labelledby="analytics-architecture-title analytics-architecture-description"
        className="h-auto w-full min-w-[640px] text-fd-foreground"
      >
        <title id="analytics-architecture-title">
          How the conversational analytics example works
        </title>
        <desc id="analytics-architecture-description">
          A chat interface, such as Agent Interface, sends the question to OpenUI Gateway, which
          runs the model. The model makes a tool call to your server, which runs a read-only query
          against your data and returns the tool result. Gateway then streams the answer back to the
          chat interface.
        </desc>
        <defs>
          <marker
            id="analytics-architecture-arrow"
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

        {links.map((link) => {
          const center = (link.from + link.to) / 2;
          return (
            <g key={link.request}>
              <Arrow x1={link.from + 4} y1={108} x2={link.to - 6} y2={108} />
              <text x={center} y={96} textAnchor="middle" className={label}>
                {link.request}
              </text>
              <Arrow x1={link.to - 4} y1={158} x2={link.from + 6} y2={158} />
              <text x={center} y={180} textAnchor="middle" className={label}>
                {link.reply}
              </text>
            </g>
          );
        })}

        {/* Your server queries the data and receives rows. */}
        <Arrow x1={790} y1={228} x2={790} y2={308} />
        <Arrow x1={840} y1={310} x2={840} y2={230} />
        <text x={780} y={274} textAnchor="end" className={label}>
          Query
        </text>
        <text x={850} y={274} className={label}>
          Rows
        </text>

        {boxes.map((box) => (
          <BoxNode key={box.title} box={box} />
        ))}
      </svg>
    </figure>
  );
}
