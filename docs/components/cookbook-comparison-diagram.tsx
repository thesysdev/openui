import { ChartColumn, MessagesSquare } from "lucide-react";

// How the document comparison cookbook turns a question into a cited comparison.
// Page numbers are the real citations for revenue and R&D in the three annual reports.
// Every label avoids cookbook-specific terms so the diagram stands on its own.

const pipeline = [
  { title: "Annual reports", detail: "NVIDIA, AMD, Intel" },
  { title: "Pages", detail: "Text read per page" },
  { title: "Text chunks", detail: "Each keeps its page" },
  { title: "Embeddings", detail: "Meaning as numbers" },
  { title: "Database", detail: "Local SQLite file" },
];

// After each answer: the thread is kept in a Gateway conversation.
const thread = [
  { title: "Turn", detail: "Question and answer" },
  { title: "Conversation", detail: "Saved in Gateway" },
  { title: "Thread", detail: "Reopens later" },
];

const companies = ["NVIDIA", "AMD", "Intel"];
const criteria = [
  { name: "Revenue", pages: ["Page 37", "Page 50", "Page 27"], y: 222 },
  { name: "R&D spending", pages: ["Page 41", "Page 56", "Page 16"], y: 288 },
];

const mono = "font-mono font-bold uppercase";
const label = `fill-fd-foreground ${mono} text-[13px] tracking-[0.1em]`;
const caption = "fill-fd-muted-foreground font-mono text-[12px] uppercase tracking-[0.1em]";
const box = "fill-fd-background stroke-fd-foreground";
const cell = "fill-[#eef1fb] stroke-fd-foreground dark:fill-[#1c2233]";

function Arrow({ d, id, dashed }: { d: string; id: string; dashed?: boolean }) {
  return (
    <path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeDasharray={dashed ? "5 5" : undefined}
      markerEnd={`url(#${id}-arrow)`}
    />
  );
}

export function CookbookComparisonDiagram() {
  const id = "comparison-diagram";
  return (
    <figure className="not-prose my-6 overflow-x-auto">
      <svg
        viewBox="0 0 930 490"
        role="img"
        aria-labelledby={`${id}-title ${id}-description`}
        className="h-auto w-full min-w-[640px] text-fd-foreground"
      >
        <title id={`${id}-title`}>From a question to a cited comparison</title>
        <desc id={`${id}-description`}>
          First, once: the annual reports of NVIDIA, AMD, and Intel are read page by page, split
          into text chunks that keep their page number, turned into embeddings that capture their
          meaning, and saved in a local database. Then, for each question, such as comparing revenue
          and R&D spending, the model picks what to compare, the best-matching page in each report
          is found for each item, and the answer appears in the chat as a table, charts, and quoted
          sources. Finally, each question and answer is saved to the thread's Gateway conversation,
          so the thread reopens later with its messages.
        </desc>
        <defs>
          <marker
            id={`${id}-arrow`}
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

        {/* Prepare once: npm run prepare:documents */}
        <text x={10} y={22} className={caption}>
          Prepare the reports once
        </text>
        {pipeline.map((step, index) => {
          const x = 10 + index * 190;
          return (
            <g key={step.title}>
              <rect
                x={x}
                y={34}
                width={150}
                height={56}
                rx={28}
                strokeWidth={1.6}
                className={box}
              />
              <text x={x + 75} y={58} textAnchor="middle" className={label}>
                {step.title}
              </text>
              <text
                x={x + 75}
                y={77}
                textAnchor="middle"
                className="fill-fd-muted-foreground font-sans text-[13px]"
              >
                {step.detail}
              </text>
              {index < pipeline.length - 1 && <Arrow d={`M${x + 154} 62 H${x + 184}`} id={id} />}
            </g>
          );
        })}

        {/* The search reads the chunks prepared above. */}
        <Arrow d="M845 94 V150 H545 V190" id={id} dashed />
        <text x={695} y={142} textAnchor="middle" className={caption}>
          Searched for every question
        </text>

        {/* Every question */}
        <text x={10} y={160} className={caption}>
          Answer each question
        </text>

        <rect x={10} y={196} width={170} height={150} rx={12} strokeWidth={1.75} className={box} />
        <MessagesSquare
          x={80}
          y={212}
          width={30}
          height={30}
          strokeWidth={1.6}
          className="text-fd-foreground"
          aria-hidden="true"
        />
        <text x={95} y={268} textAnchor="middle" className={label}>
          Question
        </text>
        <text
          x={95}
          y={296}
          textAnchor="middle"
          className="fill-fd-muted-foreground font-sans text-[14px]"
        >
          “Compare revenue
        </text>
        <text
          x={95}
          y={316}
          textAnchor="middle"
          className="fill-fd-muted-foreground font-sans text-[14px]"
        >
          and R&D”
        </text>

        {criteria.map((criterion) => (
          <g key={criterion.name}>
            <Arrow
              d={`M184 271 C200 271 200 ${criterion.y + 22} 211 ${criterion.y + 22}`}
              id={id}
            />
            <rect
              x={215}
              y={criterion.y}
              width={140}
              height={44}
              rx={22}
              strokeWidth={1.6}
              className={box}
            />
            <text x={285} y={criterion.y + 27} textAnchor="middle" className={label}>
              {criterion.name}
            </text>
            <Arrow d={`M359 ${criterion.y + 22} H381`} id={id} />
            {criterion.pages.map((page, index) => (
              <g key={page}>
                <rect
                  x={385 + index * 108}
                  y={criterion.y}
                  width={96}
                  height={44}
                  rx={8}
                  strokeWidth={1.4}
                  className={cell}
                />
                <text
                  x={433 + index * 108}
                  y={criterion.y + 27}
                  textAnchor="middle"
                  className="fill-fd-foreground font-mono text-[14px]"
                >
                  {page}
                </text>
              </g>
            ))}
          </g>
        ))}
        {companies.map((company, index) => (
          <text key={company} x={433 + index * 108} y={210} textAnchor="middle" className={label}>
            {company}
          </text>
        ))}

        <Arrow d="M705 271 H741" id={id} />
        <rect x={745} y={196} width={175} height={150} rx={12} strokeWidth={1.75} className={box} />
        <ChartColumn
          x={817}
          y={212}
          width={30}
          height={30}
          strokeWidth={1.6}
          className="text-fd-foreground"
          aria-hidden="true"
        />
        <text x={832} y={268} textAnchor="middle" className={label}>
          Comparison
        </text>
        <text
          x={832}
          y={296}
          textAnchor="middle"
          className="fill-fd-muted-foreground font-sans text-[14px]"
        >
          Table and charts
        </text>
        <text
          x={832}
          y={316}
          textAnchor="middle"
          className="fill-fd-muted-foreground font-sans text-[14px]"
        >
          Quoted sources
        </text>

        <text x={95} y={374} textAnchor="middle" className={caption}>
          Chat interface
        </text>
        <text x={285} y={374} textAnchor="middle" className={caption}>
          What to compare
        </text>
        <text x={541} y={374} textAnchor="middle" className={caption}>
          Best match in each report
        </text>
        <text x={832} y={374} textAnchor="middle" className={caption}>
          Answer in the chat
        </text>

        {/* After each answer */}
        <text x={10} y={412} className={caption}>
          Keep the thread
        </text>
        {thread.map((step, index) => {
          const x = 10 + index * 190;
          return (
            <g key={step.title}>
              <rect
                x={x}
                y={424}
                width={150}
                height={56}
                rx={28}
                strokeWidth={1.6}
                className={box}
              />
              <text x={x + 75} y={448} textAnchor="middle" className={label}>
                {step.title}
              </text>
              <text
                x={x + 75}
                y={467}
                textAnchor="middle"
                className="fill-fd-muted-foreground font-sans text-[13px]"
              >
                {step.detail}
              </text>
              {index < thread.length - 1 && <Arrow d={`M${x + 154} 452 H${x + 184}`} id={id} />}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
