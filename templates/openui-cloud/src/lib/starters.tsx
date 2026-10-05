import { PromptTemplate } from "@openuidev/react-ui";
import { GitCompareArrows, Search } from "lucide-react";

export const OPENUI_LOGOS = {
  LIGHT: "/openui-cloud-logo-light.svg",
  DARK: "/openui-cloud-logo-dark.svg",
};

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    displayText: "Research a topic",
    prompt: "Research ",
    icon: <Search size={16} />,
    completions: [
      {
        displayText: "The rise of reusable rockets and commercial spaceflight",
        prompt: "the rise of reusable rockets and commercial spaceflight",
        icon: <></>,
      },
      {
        displayText: "How Formula 1 became a global business",
        prompt: "how Formula 1 became a global business",
        icon: <></>,
      },
      {
        displayText: "Why electric vehicles are changing transportation",
        prompt: "why electric vehicles are changing transportation",
        icon: <></>,
      },
    ],
  },
  {
    displayText: "Compare options",
    prompt: "Compare ",
    icon: <GitCompareArrows size={16} />,
    completions: [
      {
        displayText: "Leading electric vehicles for long road trips",
        prompt: "leading electric vehicles for long road trips",
        icon: <></>,
      },
      {
        displayText: "Popular frontend frameworks for a new web app",
        prompt: "popular frontend frameworks for a new web app",
        icon: <></>,
      },
      {
        displayText: "Top destinations for a summer vacation",
        prompt: "top destinations for a summer vacation",
        icon: <></>,
      },
    ],
  },
];

export const STARTERS = [
  {
    displayText: "Relive the FIFA World Cup 2026",
    prompt: "Relive the FIFA World Cup 2026.",
    icon: <></>,
  },
  {
    displayText: "Explore global coffee trends",
    prompt: "Explore global coffee trends.",
    icon: <></>,
  },
  {
    displayText: "Help me plan my next vacation",
    prompt: "Help me plan my next vacation.",
    icon: <></>,
  },
];
