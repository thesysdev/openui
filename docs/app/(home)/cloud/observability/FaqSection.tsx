import {
  FaqSection as MarketingFaqSection,
  type MarketingFaq,
} from "../../sections/FaqSection/FaqSection";
import styles from "../../sections/FaqSection/FaqSection.module.css";

const FAQS: MarketingFaq[] = [
  {
    question: "How is OpenUI Observability different from tracing tools?",
    answer: [
      "Tracing tools show how your agent ran. OpenUI Observability shows what users experienced, including generated UI, interactions, errors, corrections, and fallbacks.",
      "They work together. Export flagged responses as eval cases to tools such as Braintrust or LangSmith.",
    ],
  },
  {
    question: "What does the SDK capture?",
    answer: [
      "The SDK captures events from OpenUI when rendering settles, including timestamps, update counts, error counts, and error details such as code, source, and component.",
      "Full capture includes the generated response and is enabled by default. Minimal capture excludes response content and error messages.",
    ],
  },
  {
    question: "Can I control what data is sent?",
    answer: [
      "Yes. Choose minimal capture to send metadata without generated responses. Use the beforeSend hook to edit or drop events before they’re sent to OpenUI Observability.",
    ],
  },
  {
    question: "Is the frontend API key safe to expose?",
    answer: [
      "Yes. Frontend API keys are publishable and designed for use in browser code, like an analytics key.",
    ],
  },
  {
    question: "What does OpenUI Observability cost?",
    answer: [
      "OpenUI Observability is free during early access. Pricing will be published before paid access begins.",
    ],
  },
  {
    question: "Do I need OpenUI Gateway?",
    answer: [
      "No. OpenUI Observability and OpenUI Gateway work independently.",
      "We recommend using both. Gateway makes generated UI more reliable. Observability shows what users experienced and whether it worked.",
    ],
  },
];

export function FaqSection() {
  return (
    <MarketingFaqSection
      faqs={FAQS}
      titleId="observability-faq"
      firstOpen
      contact={
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
      }
    />
  );
}
