import {
  FaqSection as MarketingFaqSection,
  type MarketingFaq,
} from "../sections/FaqSection/FaqSection";

export const DASHBOARD_FAQS: MarketingFaq[] = [
  {
    question: "Where can dashboards appear in my product?",
    answer: [
      "In your agent’s chat, on a full page, in a side panel, or inside a mobile app. The same response renders in each one.",
    ],
  },
  {
    question: "Does the dashboard regenerate when the data changes?",
    answer: [
      "No. It is generated once. Filters and auto-refresh call your APIs and load new data into the same layout.",
    ],
  },
  {
    question: "Can I use my own design system?",
    answer: [
      "Yes. Dashboards render only with the components you register, so they match your product.",
    ],
  },
  {
    question: "Do I need a BI tool or semantic layer?",
    answer: ["No. Dashboards call your existing APIs through tools you provide."],
  },
  {
    question: "What if my API doesn’t return the numbers a user needs?",
    answer: [
      "OpenUI writes a script that calculates them from the data your tools return and runs it in a safe interpreter. For example, it can group participants by age without an age-group\u00a0endpoint.",
      "It can’t use fields your tools don’t return.",
    ],
  },
  {
    question: "Can a dashboard show data a user shouldn’t see?",
    answer: [
      "No. Tools call your own API routes, so your existing auth decides what each user gets.",
    ],
  },
  {
    question: "Can users edit a dashboard?",
    answer: [
      "Yes. They ask for a change, such as a new chart or filter. A targeted edit updates only that part.",
    ],
  },
  {
    question: "Which models can I use?",
    answer: ["Hundreds of models from OpenAI, Anthropic, Google, and other labs through one API."],
  },
  {
    question: "Do I need to replace my agent?",
    answer: [
      "No. Keep your agent framework and tools. Add the OpenUI instructions and render the response in your product.",
    ],
  },
];

export function FaqSection() {
  return <MarketingFaqSection faqs={DASHBOARD_FAQS} titleId="dashboard-faq" firstOpen />;
}
