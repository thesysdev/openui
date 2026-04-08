import svgPaths from "@/imports/svg-urruvoh2be";
import {
  StackChip,
  stackChipStyles,
  type StackChipItem,
} from "../../components/StackChip/StackChip";
import styles from "./CompatibilitySection.module.css";

interface StackRow {
  label: string;
  items: StackChipItem[];
}

function splitItemsIntoRows(items: StackChipItem[], rowCount: number): StackChipItem[][] {
  const itemsPerRow = Math.ceil(items.length / rowCount);

  return Array.from({ length: rowCount }, (_, rowIndex) =>
    items.slice(rowIndex * itemsPerRow, (rowIndex + 1) * itemsPerRow),
  ).filter((row) => row.length > 0);
}

function createMoreChip(): StackChipItem {
  return {
    name: "+ more",
    iconKind: "more",
    badgeClassName: stackChipStyles.badgeMore,
    isBlurred: true,
  };
}

const STACK_ROWS: StackRow[] = [
  {
    label: "All LLMs",
    items: [
      {
        name: "OpenAI",
        iconKind: "image",
        localSrc: "/brand-icons/openai.svg",
        iconColor: "000000",
        badgeClassName: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
      },
      {
        name: "Anthropic",
        iconKind: "image",
        slug: "anthropic",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeAnthropic,
      },
      {
        name: "Gemini",
        iconKind: "image",
        slug: "googlegemini",
        iconColor: "000000",
        badgeClassName: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
      },
      {
        name: "Mistral",
        iconKind: "image",
        slug: "mistralai",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeMistral,
      },
      {
        name: "xAI",
        iconKind: "image",
        slug: "xai",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeBlack,
      },
      {
        name: "DeepSeek",
        iconKind: "image",
        slug: "deepseek",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeDeepSeek,
      },
      createMoreChip(),
    ],
  },
  {
    label: "Any UI Library",
    items: [
      {
        name: "OpenUI Design system",
        iconKind: "mascot",
        badgeClassName: stackChipStyles.badgeOpenUi,
      },
      {
        name: "ShadCN",
        iconKind: "vector",
        badgeClassName: stackChipStyles.badgeBlack,
        iconViewBox: "0 0 24 24",
        iconPath: svgPaths.p46a4800,
        iconFill: "white",
        clipId: "clip_shadcn",
        clipSize: "24",
      },
      {
        name: "Material Design system",
        iconKind: "vector",
        badgeClassName: stackChipStyles.badgeMaterial,
        iconViewBox: "0 0 30 30",
        iconPath: svgPaths.p3a7bdd80,
        iconFill: "white",
        clipId: "clip_material",
        clipSize: "30",
      },
      {
        name: "DaisyUI",
        iconKind: "text",
        iconText: "D",
        badgeClassName: stackChipStyles.badgeDaisyUi,
      },
      {
        name: "Base UI",
        iconKind: "text",
        iconText: "B",
        badgeClassName: stackChipStyles.badgeBaseUi,
      },
      createMoreChip(),
    ],
  },
  {
    label: "Any Framework",
    items: [
      {
        name: "Vercel AI SDK",
        iconKind: "image",
        slug: "vercel",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeBlack,
      },
      {
        name: "LangChain",
        iconKind: "image",
        slug: "langchain",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeLangChain,
      },
      {
        name: "CrewAI",
        iconKind: "image",
        slug: "crewai",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeCrewAi,
      },
      {
        name: "OpenAI Agents SDK",
        iconKind: "image",
        localSrc: "/brand-icons/openai.svg",
        iconColor: "000000",
        badgeClassName: `${stackChipStyles.badgeWhite} ${stackChipStyles.badgeWithBorder}`,
      },
      {
        name: "Anthropic Agents SDK",
        iconKind: "image",
        slug: "anthropic",
        iconColor: "ffffff",
        badgeClassName: stackChipStyles.badgeAnthropic,
      },
      createMoreChip(),
    ],
  },
];

export function CompatibilitySection() {
  return (
    <section className={styles.section} aria-labelledby="favorite-stack-title">
      <div className={styles.container}>
        <div className={styles.stack}>
          <header className={styles.header}>
            <h2 id="favorite-stack-title" className={styles.title}>
              Works effortlessly
              <br />
              with your favorite stack.
            </h2>
          </header>

          <div className={styles.rows}>
            {STACK_ROWS.map((row) => {
              const chipRows = splitItemsIntoRows(row.items, 2);

              return (
                <div key={row.label} className={styles.row}>
                  <span className={styles.label}>{row.label}</span>
                  <div className={styles.chipsViewport}>
                    <div className={styles.chips}>
                      {chipRows.map((chipRow, rowIndex) => (
                        <div key={`${row.label}-row-${rowIndex}`} className={styles.chipRow}>
                          {chipRow.map((item, itemIndex) => (
                            <StackChip
                              key={`${row.label}-${item.name}-${rowIndex}-${itemIndex}`}
                              item={item}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
