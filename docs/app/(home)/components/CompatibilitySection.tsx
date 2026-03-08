// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface CompatibilityItem {
  name: string;
  slug?: string;
  localSrc?: string;
  iconColor: string;
  badgeBg: string;
  border?: boolean;
}

const LLMS: CompatibilityItem[] = [
  {
    name: "OpenAI",
    localSrc: "/brand-icons/openai.svg",
    iconColor: "000000",
    badgeBg: "bg-white",
    border: true,
  },
  { name: "Anthropic", slug: "anthropic", iconColor: "ffffff", badgeBg: "bg-[#D4A574]" },
  { name: "Gemini", slug: "googlegemini", iconColor: "000000", badgeBg: "bg-white", border: true },
  { name: "Mistral", slug: "mistralai", iconColor: "ffffff", badgeBg: "bg-[#FF7000]" },
];

const FRAMEWORKS: CompatibilityItem[] = [
  { name: "Vercel AI SDK", slug: "vercel", iconColor: "ffffff", badgeBg: "bg-black" },
  { name: "LangChain", slug: "langchain", iconColor: "ffffff", badgeBg: "bg-[#1C3144]" },
  { name: "CrewAI", slug: "crewai", iconColor: "ffffff", badgeBg: "bg-[#FF4B4B]" },
  {
    name: "OpenAI Agents SDK",
    localSrc: "/brand-icons/openai.svg",
    iconColor: "000000",
    badgeBg: "bg-white",
    border: true,
  },
  { name: "Anthropic Agents SDK", slug: "anthropic", iconColor: "ffffff", badgeBg: "bg-[#D4A574]" },
  { name: "Google ADK", slug: "google", iconColor: "ffffff", badgeBg: "bg-[#4285F4]" },
];

// ---------------------------------------------------------------------------
// Chip
// ---------------------------------------------------------------------------

function Chip({ item }: { item: CompatibilityItem }) {
  const borderClass = item.border ? "border border-black/10" : "";
  const imgSrc = item.localSrc ?? `https://cdn.simpleicons.org/${item.slug}/${item.iconColor}`;
  return (
    <div className="flex items-center gap-1.5 bg-white rounded-full px-2.5 py-1.5 border border-black/8 shadow-[0px_2px_8px_-2px_rgba(22,34,51,0.08)]">
      <div
        className={`${item.badgeBg} ${borderClass} rounded-[5px] size-5.5 shrink-0 flex items-center justify-center overflow-hidden`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={item.name}
          width={14}
          height={14}
          className="size-3.5 object-contain"
        />
      </div>
      <span className="font-['Inter',sans-serif] text-[13px] font-medium text-black/60 leading-none whitespace-nowrap">
        {item.name}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CompatibilitySection() {
  return (
    <div className="w-full px-5 lg:px-8">
      <div className="max-w-300 mx-auto">
        <div className="flex flex-col gap-4 lg:gap-5">
          {/* LLMs row */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <span className="font-['Inter',sans-serif] text-[13px] font-medium text-black/30 uppercase tracking-wider shrink-0">
              Any LLM
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {LLMS.map((item) => (
                <Chip key={item.name} item={item} />
              ))}
              <span className="font-['Inter',sans-serif] text-[13px] text-black/30 ml-1">
                + more
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-black/6" />

          {/* Frameworks row */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <span className="font-['Inter',sans-serif] text-[13px] font-medium text-black/30 uppercase tracking-wider shrink-0">
              Any Framework
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {FRAMEWORKS.map((item) => (
                <Chip key={item.name} item={item} />
              ))}
              <span className="font-['Inter',sans-serif] text-[13px] text-black/30 ml-1">
                + more
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
