import {
  ArrowsClockwise,
  ArrowsLeftRight,
  CursorClick,
  Key,
  MagnifyingGlass,
  PlayCircle,
  WarningDiamond,
  Wrench,
} from "@phosphor-icons/react/dist/ssr";
import { createElement } from "react";
import { GatewayReliabilityDashboardIllustration } from "../ProductIllustrations/ProductIllustrations";
import type { ProductSectionProps } from "./ProductSection";

/* The product bands, in the order the page tells them: what OpenUI is, then
   the hosted thing built on it.

   OBSERVABILITY_PRODUCT is still defined but no longer rendered: while it is in
   early access the home page gives it a line rather than a band. Its props are
   kept here so promoting it back is a one-line change in CloudSection.
 *
 * ARTWORK PENDING. None of the three has a `shot` yet, so each stage renders
 * empty, holding its space. Add the images to /public and set `shot` to their
 * basename (minus -light/-dark.webp); nothing else needs to change.
 *
 * What each visual should show:
 *   Lang          a prompt transforming into OpenUI Lang, then into a rich
 *                 interactive interface
 *   Gateway       code switching the OpenAI baseURL to OpenUI Gateway, the
 *                 request flowing through Route, Validate, Correct, Fallback,
 *                 Model
 *   Observability the OpenUI Console: a generated UI session on one side, its
 *                 events, interactions, errors and insights on the other
 *
 * Homepage labels use the same outlined product-name chips as the product pages.
 *
 * HREFS: Gateway points at its own page. Observability's still points at the
 * nearest real destination; repoint it if that band comes back. */

export const LANG_PRODUCT: ProductSectionProps = {
  /* "OpenUI", not "OpenUI Lang": the language/runtime split is a distinction the
     docs make and the marketing pages do not. The const keeps its name because
     it is internal. */
  name: "OpenUI",
  tag: "Open Source",
  /* Keep the performance claim qualitative here. The benchmark fold directly
     below carries the supporting numbers and comparison details. */
  headline: "A framework for agent-driven interfaces.",
  description:
    "Make your AI agents stream live charts, forms, cards, tables, and dashboards faster, with fewer tokens.",
  secondaryCta: { label: "View docs", href: "/docs/openui-lang" },
  tone: "light",
  stageAspectRatio: "1120 / 440",
  /* No cards. Interactive, Bring your UI library, Safe by default and Stream UI
     live all moved to the feature grid directly below this band, which states
     them once alongside Live data and Cross-platform. */
  cards: [],
};

export const GATEWAY_PRODUCT: ProductSectionProps = {
  name: "OpenUI",
  tag: "Gateway",
  headline: "Production reliability for OpenUI",
  description:
    "Make agent responses more reliable in production. Gateway catches and repairs invalid output before users see it.",
  primaryCta: {
    label: "Get API key",
    href: "https://console.thesys.dev/keys",
    external: true,
  },
  secondaryCta: { label: "Learn more", href: "/cloud/gateway" },
  tone: "dark",
  art: createElement(GatewayReliabilityDashboardIllustration, { inverted: true }),
  fullBleedArt: true,
  stageAspectRatio: "1120 / 440",
  stageMobileAspectRatio: "4 / 2.4",
  cards: [
    {
      Icon: ArrowsLeftRight,
      title: "Keep your existing SDK",
      description: "Chat Completions and Responses endpoints work with existing SDKs.",
    },
    {
      Icon: Wrench,
      title: "Repair before users see it",
      description: "Fix invalid output as it streams, before it reaches users.",
    },
    {
      Icon: ArrowsClockwise,
      title: "Stay online through outages",
      description: "Gateway switches providers if one fails, keeping the same model.",
    },
    {
      Icon: Key,
      title: "Use existing LLM spend",
      description: "Use your existing model provider credentials and commitments.",
    },
  ],
};

export const OBSERVABILITY_PRODUCT: ProductSectionProps = {
  name: "OpenUI Observability",
  headline: "Product analytics for Generative UI.",
  description:
    "See what your agent generated, what users experienced, and where your product needs to improve.",
  secondaryCta: { label: "View docs", href: "/docs/agent/getting-started/openui-cloud" },
  tone: "dark",
  cards: [
    {
      Icon: PlayCircle,
      title: "Replay sessions",
      description: "See the exact UI and interactions your users experienced.",
    },
    {
      Icon: WarningDiamond,
      title: "Track every failure",
      description: "Capture errors, corrections, fallbacks, and failed generations.",
    },
    {
      Icon: CursorClick,
      title: "Understand users",
      description: "See what people use, where they struggle, and what works.",
    },
    {
      Icon: MagnifyingGlass,
      title: "Find what\u2019s missing",
      description: "Surface unmet needs, emerging demand, and opportunities to improve.",
    },
  ],
};
