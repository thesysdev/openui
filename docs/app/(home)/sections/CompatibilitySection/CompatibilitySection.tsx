// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

import styles from "./CompatibilitySection.module.css";

interface CompatibilityItem {
  name: string;
  slug?: string;
  localSrc?: string;
  iconColor: string;
  badgeClassName?: string;
}

const LLMS: CompatibilityItem[] = [
  {
    name: "OpenAI",
    localSrc: "/brand-icons/openai.svg",
    iconColor: "000000",
    badgeClassName: `${styles.badgeWhite} ${styles.badgeWithBorder}`,
  },
  {
    name: "Anthropic",
    slug: "anthropic",
    iconColor: "ffffff",
    badgeClassName: styles.badgeAnthropic,
  },
  {
    name: "Gemini",
    slug: "googlegemini",
    iconColor: "000000",
    badgeClassName: `${styles.badgeWhite} ${styles.badgeWithBorder}`,
  },
  { name: "Mistral", slug: "mistralai", iconColor: "ffffff", badgeClassName: styles.badgeMistral },
];

const FRAMEWORKS: CompatibilityItem[] = [
  { name: "Vercel AI SDK", slug: "vercel", iconColor: "ffffff", badgeClassName: styles.badgeBlack },
  {
    name: "LangChain",
    slug: "langchain",
    iconColor: "ffffff",
    badgeClassName: styles.badgeLangChain,
  },
  { name: "CrewAI", slug: "crewai", iconColor: "ffffff", badgeClassName: styles.badgeCrewAi },
  {
    name: "OpenAI Agents SDK",
    localSrc: "/brand-icons/openai.svg",
    iconColor: "000000",
    badgeClassName: `${styles.badgeWhite} ${styles.badgeWithBorder}`,
  },
  {
    name: "Anthropic Agents SDK",
    slug: "anthropic",
    iconColor: "ffffff",
    badgeClassName: styles.badgeAnthropic,
  },
  { name: "Google ADK", slug: "google", iconColor: "ffffff", badgeClassName: styles.badgeGoogle },
];

// ---------------------------------------------------------------------------
// Chip
// ---------------------------------------------------------------------------

function Chip({ item }: { item: CompatibilityItem }) {
  const imgSrc = item.localSrc ?? `https://cdn.simpleicons.org/${item.slug}/${item.iconColor}`;
  return (
    <div className={styles.chip}>
      <div className={`${styles.badge} ${item.badgeClassName ?? ""}`.trim()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgSrc} alt={item.name} width={14} height={14} className={styles.badgeImage} />
      </div>
      <span className={styles.chipLabel}>{item.name}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function CompatibilitySection() {
  return (
    <div className={styles.section}>
      <div className={styles.container}>
        <div className={styles.stack}>
          {/* LLMs row */}
          <div className={styles.row}>
            <span className={styles.label}>Any LLM</span>
            <div className={styles.chips}>
              {LLMS.map((item) => (
                <Chip key={item.name} item={item} />
              ))}
              <span className={styles.more}>+ more</span>
            </div>
          </div>

          {/* Divider */}
          <div className={styles.divider} />

          {/* Frameworks row */}
          <div className={styles.row}>
            <span className={styles.label}>Any Framework</span>
            <div className={styles.chips}>
              {FRAMEWORKS.map((item) => (
                <Chip key={item.name} item={item} />
              ))}
              <span className={styles.more}>+ more</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
