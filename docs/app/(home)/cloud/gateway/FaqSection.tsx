import {
  FaqSection as MarketingFaqSection,
  type MarketingFaq,
} from "../../sections/FaqSection/FaqSection";

const FAQS: MarketingFaq[] = [
  {
    question: "Do I need OpenUI Gateway to use OpenUI?",
    answer: [
      "No. OpenUI works without Gateway. You can call any supported LLM directly and use generatePrompt to create the system prompt.",
      "For production applications, OpenUI Gateway adds validation and automatic corrections for generated UI, model routing, and provider fallbacks through an OpenAI-compatible API.",
    ],
  },
  {
    question: "What happens to my data?",
    answer: [
      "Your Gateway data is never used to train models. Chat Completions requests use zero data retention by default.",
    ],
  },
  {
    question: "Can I use my existing OpenAI or Anthropic credits?",
    answer: [
      "Yes. Bring your own key (BYOK) to use your existing OpenAI or Anthropic credits and commitments. BYOK carries no platform fee.",
    ],
  },
  {
    question: "I already use open-source OpenUI. How do I add Gateway?",
    answer: [
      "Create a Gateway API key, update your base URL and model, and enable Gateway in your prompt. The integration guide covers the full setup.",
      "You can also give the setup prompt to your coding agent or book a call for help.",
    ],
  },
  {
    question: "Can I use OpenUI Gateway with Portkey or another gateway?",
    answer: ["Yes. Run OpenUI Gateway behind any OpenAI-compatible gateway, including Portkey."],
  },
  {
    question: "Will my cache configuration work?",
    answer: ["Yes. OpenUI Gateway honors your upstream cache configuration."],
  },
  {
    question: "Which model handles corrections, and are they billed separately?",
    answer: [
      "Corrections use a dedicated model tuned for low latency, which we continue to improve. All correction calls are included in your plan and are not billed separately.",
    ],
  },
  {
    question: "Do I need OpenUI Observability with Gateway?",
    answer: [
      "No. OpenUI Gateway and OpenUI Observability work independently. Gateway does not require Observability.",
      "We recommend using both. Gateway makes generated UI more reliable. Observability shows what users experienced and whether it worked.",
    ],
  },
];

export function FaqSection() {
  return (
    <MarketingFaqSection
      faqs={FAQS}
      titleId="gateway-faq"
      firstOpen
      contact={
        <>
          Have another question? Join our{" "}
          <a href="https://discord.com/invite/Pbv5PsqUSv" target="_blank" rel="noopener noreferrer">
            Discord
          </a>
          .
        </>
      }
    />
  );
}
