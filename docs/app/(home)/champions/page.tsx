import svgPaths from "@/imports/svg-urruvoh2be";
import { createPageMetadata } from "@/lib/page-metadata";
import { Globe, Plus } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { CHAMPIONS, type Champion, type ChampionLink } from "../data/champions";
import pageStyles from "../page.module.css";
import { FaqSection, type MarketingFaq } from "../sections/FaqSection/FaqSection";
import { Footer } from "../sections/Footer/Footer";
import { HeroSection } from "../sections/HeroSection/HeroSection";
import page from "./metadata";
import styles from "./page.module.css";

export const metadata = createPageMetadata(page);

const DISCORD_URL = "https://discord.com/invite/Pbv5PsqUSv";

/* The real marks, from the same sources as the site's GitHub button and footer. */
const GITHUB_PATH =
  "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12";

const BRAND_MARKS: Partial<
  Record<ChampionLink["label"], { viewBox: string; path: string; size: number }>
> = {
  GitHub: { viewBox: "0 0 24 24", path: GITHUB_PATH, size: 17 },
  X: { viewBox: "0 0 24 24", path: svgPaths.pa1e7100, size: 15 },
  LinkedIn: { viewBox: "0 0 19 19", path: svgPaths.p26fc3100, size: 15 },
};

function LinkMark({ label }: { label: ChampionLink["label"] }) {
  const mark = BRAND_MARKS[label];
  if (!mark) return <Globe size={17} aria-hidden="true" />;
  return (
    <svg
      width={mark.size}
      height={mark.size}
      viewBox={mark.viewBox}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={mark.path} />
    </svg>
  );
}

const FAQS: MarketingFaq[] = [
  {
    question: "How do I get listed as a Champion?",
    answer: [
      "You don't need to contribute to the OpenUI repo. If you've built something with OpenUI, such as a package, a repo, a demo, or a blog post, you can apply.",
      "Share what you built in the OpenUI Discord. The team reviews requests and adds new Champions to this page.",
    ],
  },
  {
    question: "Do I need to contribute code?",
    answer: [
      "No. Code helps, but so do projects built on OpenUI, tutorials, talks, product feedback, and answering questions from the community.",
    ],
  },
  {
    question: "What do Champions get?",
    answer: [
      "Early access to new features, a direct line to the OpenUI team, and a spot on this page.",
    ],
  },
  {
    question: "I'm new to OpenUI. Where do I start?",
    answer: [
      "Scaffold an app with npx @openuidev/cli@latest create and follow the Getting Started guide in the docs.",
      "To contribute, browse the open issues in the OpenUI GitHub repo, and ask in Discord if you want help picking one.",
    ],
  },
  {
    question: "Can I nominate someone?",
    answer: [
      "Yes. If someone has been building with OpenUI or helping others, mention them in Discord and tell us what they have done.",
    ],
  },
];

function ChampionCard({ champion }: { champion: Champion }) {
  return (
    <li className={styles.card}>
      <div className={styles.media}>
        <Image
          src={champion.photo}
          alt={champion.name}
          width={640}
          height={640}
          sizes="(min-width: 1024px) 384px, (min-width: 640px) 50vw, 100vw"
          className={styles.photo}
        />
      </div>
      <div className={styles.body}>
        <div className={styles.identity}>
          <div className={styles.nameBlock}>
            <h3 className={styles.name}>{champion.name}</h3>
            <p className={styles.handle}>
              @{champion.handle}
              {champion.location ? ` · ${champion.location}` : null}
            </p>
          </div>
          <ul className={styles.links}>
            {champion.links.map((link) => (
              <li key={link.href}>
                <a
                  className={styles.iconLink}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${champion.name} on ${link.label}`}
                  title={link.label}
                >
                  <LinkMark label={link.label} />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <p className={styles.bio}>{champion.bio}</p>
      </div>
    </li>
  );
}

/* The open seat: a grey slot the size of a card, one action in the middle. */
function JoinCard() {
  return (
    <li className={styles.joinCard}>
      <a className={styles.joinSlot} href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
        <span className={styles.joinIcon} aria-hidden="true">
          <Plus size={22} weight="bold" />
        </span>
        <span className={styles.joinTitle}>Become a Champion</span>
        <span className={styles.joinText}>Share what you built on Discord</span>
      </a>
    </li>
  );
}

export default function ChampionsPage() {
  return (
    <div className={pageStyles.page}>
      <main className={styles.main}>
        <div className={styles.hero}>
          <HeroSection
            align="left"
            title="OpenUI Champions"
            subtitle="The people building OpenUI."
            showCommand={false}
            showPreview={false}
            showPlaygroundButton={false}
            showGitHubBanner={false}
            showTagline={false}
            flushInnerInlinePadding
          />
        </div>

        <section className={styles.champions} aria-labelledby="meet-champions">
          <h2 id="meet-champions" className={styles.srOnly}>
            Meet the Champions
          </h2>
          <ul className={styles.grid}>
            {CHAMPIONS.map((champion) => (
              <ChampionCard key={champion.handle} champion={champion} />
            ))}
            <JoinCard />
          </ul>
          <p className={styles.note}>
            Champions build with OpenUI and help shape it through code, product feedback, and
            content for the community.
          </p>
        </section>

        <div className={styles.faq}>
          <FaqSection faqs={FAQS} titleId="champions-faq" firstOpen />
        </div>
      </main>
      <Footer />
    </div>
  );
}
