import type { ReactNode } from "react";
import styles from "./FaqSection.module.css";

export type MarketingFaq = {
  question: string;
  /* One entry per paragraph. */
  answer: string[];
};

const FAQS: MarketingFaq[] = [
  {
    question: "What should I use to build a Generative UI app?",
    answer: [
      "Start with OpenUI, the free and open-source framework for Generative UI.",
      "For production, we recommend adding OpenUI Gateway for reliability and OpenUI Observability for monitoring and product analytics.",
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
      "Yes. OpenUI is fully open source and works with your own models, infrastructure, components, and design system.",
      "OpenUI Gateway and OpenUI Observability are managed services for teams running Generative UI in production.",
    ],
  },
  {
    question: "Do I need OpenUI Gateway to use OpenUI?",
    answer: [
      "No. You can call any supported LLM directly.",
      "For production applications, OpenUI Gateway adds validation and automatic corrections for generated UI, model routing, and provider fallbacks through an OpenAI-compatible API.",
      "Adopt it by changing your base URL and model configuration.",
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
    question: "Can OpenUI work with my existing stack?",
    answer: [
      "Yes. OpenUI works with your existing LLMs, agent frameworks, design systems, and infrastructure.",
      "Bring your own OpenAI, Anthropic, or Google keys, use custom component libraries, and run OpenUI Gateway behind any OpenAI-compatible gateway, including Portkey.",
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
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p className={styles.note}>
          {contact ?? (
            <>
              Have another question? Join our{" "}
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

      <div className={styles.list}>
        {faqs.map(({ question, answer }, index) => (
          <details
            className={styles.item}
            key={question}
            name={`${titleId}-accordion`}
            open={firstOpen && index === 0}
          >
            <summary className={styles.question}>
              <span className={styles.questionText}>{question}</span>
              {/* Two bars making a plus; the upright one collapses when open,
                  leaving a minus. */}
              <span className={styles.marker} aria-hidden="true" />
            </summary>
            <div className={styles.answer}>
              {answer.map((paragraph) => (
                <p className={styles.paragraph} key={paragraph}>
                  {paragraph}
                </p>
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
