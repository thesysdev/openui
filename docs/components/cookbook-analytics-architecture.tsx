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
    title: "Agent Interface",
    lines: ["Takes the question", "Renders streamed UI"],
  },
  {
    x: 350,
    y: 24,
    width: 230,
    height: 216,
    icon: Server,
    title: "Your server",
    lines: ["Validates each request", "Runs query_lap_times"],
    footer: "Application owned",
  },
  {
    x: 710,
    y: 40,
    width: 210,
    height: 184,
    icon: Sparkles,
    title: "OpenUI Gateway",
    lines: ["Runs the model", "Validates OpenUI Lang", "Stores the conversation"],
    highlight: true,
  },
  {
    x: 355,
    y: 314,
    width: 220,
    height: 146,
    icon: Database,
    title: "Your data",
    lines: ["Read-only SQL queries"],
    footer: "F1 lap times · SQLite",
  },
];

// Horizontal links: a forward arrow above a return arrow, each with its label.
const links = [
  { from: 220, to: 350, forward: ["Question"], back: ["UI stream"] },
  {
    from: 580,
    to: 710,
    forward: ["Question", "Tool results"],
    back: ["Tool calls", "OpenUI Lang"],
  },
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
          Agent Interface sends the question to your server, which forwards it to OpenUI Gateway.
          Gateway calls query_lap_times, your server queries its read-only data and returns the
          rows, and Gateway streams OpenUI Lang back through your server to Agent Interface.
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
            <g key={link.from}>
              <line
                x1={link.from + 4}
                y1={100}
                x2={link.to - 6}
                y2={100}
                stroke="currentColor"
                strokeWidth={1.6}
                markerEnd="url(#analytics-architecture-arrow)"
              />
              <line
                x1={link.to - 4}
                y1={150}
                x2={link.from + 6}
                y2={150}
                stroke="currentColor"
                strokeWidth={1.6}
                markerEnd="url(#analytics-architecture-arrow)"
              />
              {link.forward.map((text, index) => (
                <text
                  key={text}
                  x={center}
                  y={88 - (link.forward.length - 1 - index) * 17}
                  textAnchor="middle"
                  className={label}
                >
                  {text}
                </text>
              ))}
              {link.back.map((text, index) => (
                <text
                  key={text}
                  x={center}
                  y={172 + index * 17}
                  textAnchor="middle"
                  className={label}
                >
                  {text}
                </text>
              ))}
            </g>
          );
        })}

        {/* Your server queries the data and receives rows. */}
        <line
          x1={440}
          y1={244}
          x2={440}
          y2={308}
          stroke="currentColor"
          strokeWidth={1.6}
          markerEnd="url(#analytics-architecture-arrow)"
        />
        <line
          x1={490}
          y1={310}
          x2={490}
          y2={246}
          stroke="currentColor"
          strokeWidth={1.6}
          markerEnd="url(#analytics-architecture-arrow)"
        />
        <text x={430} y={281} textAnchor="end" className={label}>
          Query
        </text>
        <text x={500} y={281} className={label}>
          Rows
        </text>

        {boxes.map((box) => (
          <BoxNode key={box.title} box={box} />
        ))}
      </svg>
    </figure>
  );
}
