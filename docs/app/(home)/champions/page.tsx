import { createPageMetadata } from "@/lib/page-metadata";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import heroStyles from "../cloud/gateway/page.module.css";
import layout from "../cloud/gateway/sections.module.css";
import { BevelButton } from "../components/Button/BevelButton";
import { CHAMPIONS, type Champion } from "../data/champions";
import pageStyles from "../page.module.css";
import { FaqSection, type MarketingFaq } from "../sections/FaqSection/FaqSection";
import { Footer } from "../sections/Footer/Footer";
import { HeroSection } from "../sections/HeroSection/HeroSection";
import page from "./metadata";
import styles from "./page.module.css";

export const metadata = createPageMetadata(page);

const DISCORD_URL = "https://discord.com/invite/Pbv5PsqUSv";

const FAQS: MarketingFaq[] = [
  {
    question: "How do I get listed as a Champion?",
    answer: [
      "Build with OpenUI and help others do the same: contribute to the repo, ship a project, write or demo what you made, or help people get started on Discord.",
      "Then tell us about it in the OpenUI Discord. The team reviews requests and adds new Champions to this page.",
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
      <Image
        src={champion.photo}
        alt={champion.name}
        width={640}
        height={640}
        className={styles.photo}
      />
      <div className={styles.cardBody}>
        <div>
          <h3 className={styles.name}>{champion.name}</h3>
          <p className={styles.meta}>
            @{champion.handle}
            {champion.location ? ` · ${champion.location}` : null}
          </p>
        </div>
        <p className={styles.bio}>{champion.bio}</p>
        <ul className={styles.links}>
          {champion.links.map((link) => (
            <li key={link.href}>
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

export default function ChampionsPage() {
  return (
    <div className={pageStyles.page}>
      <main>
        <div className={styles.hero}>
          <HeroSection
            align="left"
            title={
              <span className={heroStyles.titleBlock}>
                <span className={heroStyles.eyebrow}>OpenUI Champions</span>
                <span className={heroStyles.title}>
                  The people
                  <br />
                  building OpenUI.
                </span>
              </span>
            }
            subtitle={
              <span className={heroStyles.subtitle}>
                Champions build with OpenUI and help shape it through code, product feedback, and
                content for the community.
              </span>
            }
            smallSubtitle
            tightDesktopSpacing
            splitLockup
            flushInnerInlinePadding
            showCommand={false}
            showPreview={false}
            showPlaygroundButton={false}
            showGitHubBanner={false}
            showTagline={false}
          />
        </div>

        <div className={styles.softBand}>
          <section
            className={`${layout.section} ${styles.meetSection}`}
            aria-labelledby="meet-champions"
          >
            <h2 id="meet-champions" className={`${layout.heading} ${styles.meetHeading}`}>
              Meet the Champions
            </h2>
            <ul className={styles.grid}>
              {CHAMPIONS.map((champion) => (
                <ChampionCard key={champion.handle} champion={champion} />
              ))}
            </ul>
          </section>
        </div>

        <section className={`${layout.section} ${styles.section}`} aria-labelledby="become">
          <div className={layout.sectionLockup}>
            <h2 id="become" className={layout.heading}>
              Become a Champion
            </h2>
            <div className={styles.cta}>
              <p className={layout.lead}>
                Building with OpenUI or contributing to the repo? Tell us about it on Discord.
              </p>
              <BevelButton
                href={DISCORD_URL}
                variant="primary"
                label="Join the Discord"
                badge={<ArrowRight size={16} />}
              />
            </div>
          </div>
        </section>

        <div className={`${layout.faqBand} ${styles.softBand}`}>
          <FaqSection faqs={FAQS} titleId="champions-faq" firstOpen />
        </div>
      </main>
      <Footer />
    </div>
  );
}
