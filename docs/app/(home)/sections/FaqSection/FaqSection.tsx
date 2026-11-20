import { BRIEFS, tokens } from "@/lib/benchmark-data";
import type { ReactNode } from "react";
import styles from "./FaqSection.module.css";

export type MarketingFaq = {
  question: string;
  /* One entry per paragraph. */
  answer: string[];
};

const fewerOutputTokensThan = (format: "jsonRender" | "a2ui") =>
  Math.round((1 - tokens.outputPerScreen.openui / tokens.outputPerScreen[format]) * 100);

export const FAQS: MarketingFaq[] = [
  {
    question: "What should I use to build a Generative UI app?",
    answer: [
      "Start with OpenUI and OpenUI Gateway. One command scaffolds a working app: npx @openuidev/cli@latest create. Or let a coding agent do it: Setup for agents in the hero copies a prompt that walks your agent through the same setup.",
      "Gateway gives you free models to build with, and repairs invalid output so broken UI doesn't reach users. The same setup carries into production.",
    ],
  },
  {
    question: "How can I set up my coding agent to use OpenUI?",
    answer: [
      "For a new project, click Setup for agents in the hero and paste the copied prompt into Claude Code, Codex, Cursor, or any other coding agent: it scaffolds the app and verifies the first generated response.",
      "In an existing project, run npx @openuidev/cli@latest setup-agent. It adds OpenUI instructions to AGENTS.md, or creates the file, so your agent knows how to build with OpenUI; run it again any time to refresh them. Projects created with the CLI already include them.",
    ],
  },
  {
    question: "What is OpenUI Lang?",
    answer: [
      "OpenUI Lang is a compact, streaming-first language that LLMs write to build interfaces from your own components.",
      "It is not JSON. Each line defines one component, such as root = Stack([header, chart]), so the interface renders while the response is still streaming.",
      `Across the same ${BRIEFS} interfaces in our benchmark, OpenUI Lang averaged ${tokens.outputPerScreen.openui.toLocaleString("en-US")} output tokens per screen: ${fewerOutputTokensThan("jsonRender")}% fewer than json-render and ${fewerOutputTokensThan("a2ui")}% fewer than A2UI, both JSON formats.`,
    ],
  },
  {
    /* Asked because people keep reading the hero screenshot as the whole
       product. Stated plainly and near the top: the misunderstanding is common
       enough that it is worth its own question rather than a clause elsewhere. */
    question: "Is OpenUI only for chat?",
    answer: [
      "No. OpenUI renders whatever interface a response describes: dashboards, forms, tables, charts, and complete application screens, not only messages in a chat thread.",
      "The same response renders through React, Vue, Svelte, React Native, email, or a plain script tag.",
    ],
  },
  {
    question: "Is OpenUI free and open source?",
    answer: [
      "Yes. OpenUI is fully open source and works with your own components and design system.",
    ],
  },
  {
    /* The same answer both product pages give, so the advice does not change
       with the door you came in through. */
    question: "Do I need both Gateway and Observability?",
    answer: [
      "No. They work independently.",
      "We recommend using both. Gateway makes generated UI more reliable. Observability shows what users experienced and whether it worked.",
    ],
  },
  {
    question: "How is Thesys related to OpenUI?",
    answer: [
      "Thesys is the company behind OpenUI, much like Vercel is the company behind Next.js.",
      "Thesys maintains the open-source OpenUI framework and operates OpenUI Cloud.",
    ],
  },
];

/* Closing FAQ. Title and contact note on the left, the questions on the right.
 *
 * Built on <details>, not a JS accordion, for two reasons: every answer is in
 * the markup whether or not it is open, so crawlers and coding agents reading
 * the page get the full text even while every item is collapsed; and it keeps
 * working with no JavaScript.
 */
export function FaqSection({
  faqs = FAQS,
  title = "Frequently asked questions",
  titleId = "faq-title",
  contact,
  firstOpen = false,
}: {
  faqs?: MarketingFaq[];
  title?: string;
  titleId?: string;
  contact?: ReactNode;
  firstOpen?: boolean;
} = {}) {
  return (
    <section className={styles.section} aria-labelledby={titleId}>
      <div className={styles.lead}>
        {/* Phones get the short form; both render, the viewport picks one. */}
        <h2 id={titleId} className={styles.title}>
          <span className={styles.titleFull}>{title}</span>
          <span className={styles.titleShort}>
            {title === "Frequently asked questions" ? "FAQs" : title}
          </span>
        </h2>
        <p className={styles.note}>
          {contact ?? (
            <>
              Have another question?
              <br />
              Join our{" "}
              <a
                className={styles.noteLink}
                href="https://discord.com/invite/Pbv5PsqUSv"
                target="_blank"
                rel="noopener noreferrer"
              >
                Discord
              </a>
              .
            </>
          )}
        </p>
      </div>

      <FaqList faqs={faqs} name={`${titleId}-accordion`} firstOpen={firstOpen} />
    </section>
  );
}

/* The questions on their own, for pages that supply their own heading (blog
 * posts). Items sharing `name` open one at a time. */
export function FaqList({
  faqs,
  name,
  firstOpen = false,
}: {
  faqs: { question: string; answer: ReactNode[] }[];
  name: string;
  firstOpen?: boolean;
}) {
  return (
    <div className={styles.list}>
      {faqs.map(({ question, answer }, index) => (
        <details className={styles.item} key={question} name={name} open={firstOpen && index === 0}>
          <summary className={styles.question}>
            <span className={styles.questionText}>{question}</span>
            {/* Two bars making a plus; the upright one collapses when open,
                leaving a minus. */}
            <span className={styles.marker} aria-hidden="true" />
          </summary>
          <div className={styles.answer}>
            {answer.map((paragraph, paragraphIndex) => (
              <p className={styles.paragraph} key={paragraphIndex}>
                {paragraph}
              </p>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
