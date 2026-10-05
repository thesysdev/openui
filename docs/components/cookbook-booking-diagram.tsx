// How the booking assistant cookbook turns a request into a confirmed stay.
// Every label avoids cookbook-specific terms so the diagram stands on its own.

const mono = "font-mono font-bold uppercase";
const label = `fill-fd-foreground ${mono} text-[13px] tracking-[0.1em]`;
const caption = "fill-fd-muted-foreground font-mono text-[12px] uppercase tracking-[0.1em]";
const note = "fill-fd-muted-foreground font-sans text-[13px]";
const small = "fill-fd-foreground font-sans text-[12px]";
const box = "fill-fd-background stroke-fd-foreground";
const filled = "fill-[#f8e8e0] stroke-fd-foreground dark:fill-[#3a1f15]";
const accent = "fill-[#b4441f] dark:fill-[#f0875f]";

const screens = [
  { title: "Request", note: "In their own words" },
  { title: "Prefilled form", note: "Filled from the request" },
  { title: "Stays", note: "Live prices, with photos" },
  { title: "Summary", note: "Then the booking site" },
];
const fields = [
  { name: "Where", value: "New York" },
  { name: "Dates", value: "Oct 2 – 4" },
  { name: "Adults", value: "2" },
  { name: "Budget", value: null },
];
const stays = ["Times Square · $292 · 8.7", "Wall Street · $348 · 7.7", "SoHo · $516 · 8.7"];
const x = (index: number) => 10 + index * 235;

function Arrow({ d, id, both }: { d: string; id: string; both?: boolean }) {
  return (
    <path
      d={d}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeDasharray={both ? "5 5" : undefined}
      markerStart={both ? `url(#${id}-arrow)` : undefined}
      markerEnd={`url(#${id}-arrow)`}
    />
  );
}

export function CookbookBookingDiagram() {
  const id = "booking-diagram";
  return (
    <figure className="not-prose my-6 overflow-x-auto">
      <svg
        viewBox="0 0 930 410"
        role="img"
        aria-labelledby={`${id}-title ${id}-description`}
        className="h-auto w-full min-w-[640px] text-fd-foreground"
      >
        <title id={`${id}-title`}>From a request to a booked stay</title>
        <desc id={`${id}-description`}>
          A guest writes “Book a room in New York for two this weekend.” The model replies with a
          form that already has the destination, dates, and adults filled in, and leaves the
          optional budget empty. After the guest submits it, the server searches through trivago’s
          MCP server, which returns live prices from booking sites, and the model shows the stays as
          cards with photos. The guest picks one and sees a summary with a Continue button that
          opens the booking site, where they book and pay. The model writes every screen; the search
          and the booking happen outside the chat. Your server also saves each turn to the thread's
          Gateway conversation, so the thread reopens later with its messages.
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

        <text x={10} y={22} className={caption}>
          In the chat
        </text>
        {screens.map((screen, index) => (
          <g key={screen.title}>
            <rect
              x={x(index)}
              y={36}
              width={205}
              height={176}
              rx={12}
              strokeWidth={1.75}
              className={box}
            />
            <text x={x(index) + 16} y={62} className={label}>
              {screen.title}
            </text>
            <text x={x(index) + 16} y={198} className={note}>
              {screen.note}
            </text>
            {index < screens.length - 1 && (
              <Arrow d={`M${x(index) + 209} 124 H${x(index + 1) - 5}`} id={id} />
            )}
          </g>
        ))}

        {/* The request, as a chat message. */}
        <rect x={x(0) + 16} y={78} width={173} height={78} rx={14} className={filled} />
        {["Book a room in", "New York for two", "this weekend."].map((line, index) => (
          <text
            key={line}
            x={x(0) + 30}
            y={102 + index * 20}
            className="fill-fd-foreground font-sans text-[14px]"
          >
            {line}
          </text>
        ))}

        {/* The form: understood details are filled in, the rest stays empty. */}
        {fields.map((field, index) => {
          const y = 76 + index * 26;
          return (
            <g key={field.name}>
              <text x={x(1) + 16} y={y + 15} className={note}>
                {field.name}
              </text>
              <rect
                x={x(1) + 88}
                y={y}
                width={101}
                height={21}
                rx={5}
                strokeWidth={1.2}
                strokeDasharray={field.value ? undefined : "4 3"}
                className={field.value ? filled : box}
              />
              <text
                x={x(1) + 96}
                y={y + 15}
                className={field.value ? small : "fill-fd-muted-foreground font-sans text-[12px]"}
              >
                {field.value ?? "Optional"}
              </text>
            </g>
          );
        })}

        {/* The stays, one selected. */}
        {stays.map((stay, index) => {
          const y = 76 + index * 34;
          const selected = index === 1;
          return (
            <g key={stay}>
              <rect
                x={x(2) + 16}
                y={y}
                width={173}
                height={27}
                rx={6}
                strokeWidth={selected ? 2.4 : 1.2}
                className={selected ? filled : box}
              />
              <text x={x(2) + 26} y={y + 18} className={small}>
                {stay}
              </text>
            </g>
          );
        })}

        {/* The summary and its confirm button. */}
        <text x={x(3) + 16} y={90} className={small}>
          Wall Street · Oct 2 – 4
        </text>
        <text x={x(3) + 16} y={110} className={small}>
          2 nights · 2 adults · $695
        </text>
        <rect x={x(3) + 16} y={128} width={112} height={27} rx={6} className={accent} />
        <text
          x={x(3) + 72}
          y={146}
          textAnchor="middle"
          className="fill-white font-sans text-[13px] font-semibold dark:fill-[#2a0f05]"
        >
          Continue
        </text>

        {/* Who does what. */}
        <text x={10} y={278} className={caption}>
          Outside the chat
        </text>
        <text x={10} y={302} className={note}>
          The model writes every screen from your components.
        </text>
        <text x={10} y={322} className={note}>
          The search and the booking happen elsewhere.
        </text>

        <Arrow d={`M${x(2) + 102} 218 V256`} id={id} both />
        <rect x={x(2)} y={262} width={205} height={56} rx={28} strokeWidth={1.6} className={box} />
        <text x={x(2) + 102} y={286} textAnchor="middle" className={label}>
          Your server
        </text>
        <text x={x(2) + 102} y={305} textAnchor="middle" className={note}>
          Checks each search
        </text>
        <Arrow d={`M${x(2) + 102} 322 V344`} id={id} both />
        <rect x={x(2)} y={350} width={205} height={50} rx={12} strokeWidth={1.6} className={box} />
        <text x={x(2) + 102} y={371} textAnchor="middle" className={label}>
          trivago MCP
        </text>
        <text x={x(2) + 102} y={390} textAnchor="middle" className={note}>
          Prices from booking sites
        </text>

        <Arrow d={`M${x(3) + 102} 218 V256`} id={id} />
        <rect x={x(3)} y={262} width={205} height={56} rx={28} strokeWidth={1.6} className={box} />
        <text x={x(3) + 102} y={286} textAnchor="middle" className={label}>
          Booking site
        </text>
        <text x={x(3) + 102} y={305} textAnchor="middle" className={note}>
          The guest books and pays
        </text>

        {/* Your server saves each turn to the thread's Gateway conversation. */}
        <Arrow d={`M${x(2) - 4} 290 H${x(1) + 165} V344`} id={id} />
        <rect x={x(1)} y={350} width={205} height={50} rx={12} strokeWidth={1.6} className={box} />
        <text x={x(1) + 102} y={371} textAnchor="middle" className={label}>
          Conversation
        </text>
        <text x={x(1) + 102} y={390} textAnchor="middle" className={note}>
          Keeps each turn in Gateway
        </text>
      </svg>
    </figure>
  );
}
