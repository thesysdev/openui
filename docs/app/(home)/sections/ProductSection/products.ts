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
import type { ProductSectionProps } from "./ProductSection";

/* The product bands. The open-source band's copy now opens the "What it does"
   fold (WhatItDoesSection); Gateway is the one band left on the home page.

   OBSERVABILITY_PRODUCT is still defined but no longer rendered: while it is in
   early access the home page gives it a line rather than a band. Its props are
   kept here so promoting it back is a one-line change in CloudSection.
 *
 * ARTWORK. Each band's `shot` is a basename; ProductSection appends
 * -light.webp and -dark.webp. The suffix is the picture's own tone, not the
 * page theme: the stylesheet picks the one that suits whatever the band's
 * background happens to be, which for the dark band is black in light theme
 * and white in dark theme. The export these came from names its folders the
 * other way round, so Gateway's and Observability's are swapped relative to it.
 * Every file is 1120x440 at 1x with its own transparent margin baked in, so
 * all three set fullBleedArt and sit directly on the section rather than
 * inside a stage frame.
 *
 * Homepage labels use the same outlined product-name chips as the product pages.
 *
 * HREFS: Gateway points at its own page. Observability's still points at the
 * nearest real destination; repoint it if that band comes back. */

export const GATEWAY_PRODUCT: ProductSectionProps = {
  name: "OpenUI",
  tag: "Gateway",
  headline: "OpenUI in production",
  description:
    "Make agent responses more reliable in production. Gateway catches and repairs invalid output before users see it.",
  primaryCta: {
    label: "Get API key",
    href: "https://console.thesys.dev/keys",
    external: true,
  },
  secondaryCta: { label: "Explore Gateway", href: "/cloud/gateway" },
  tone: "dark",
  shot: "/homepage/gateway",
  fullBleedArt: true,
  /* No mobile override: the artwork is drawn at this ratio, and cropping it to
     a squarer one on phones cuts into the content. */
  stageAspectRatio: "1120 / 440",
  /* The phone artwork is a different drawing, at 1440x1200. */
  stageMobileAspectRatio: "1440 / 1200",
  cards: [
    {
      Icon: ArrowsLeftRight,
      icon: "swap",
      title: "Keep your existing SDK",
      description: "Chat Completions and Responses endpoints work with existing SDKs.",
    },
    {
      Icon: Wrench,
      icon: "repair",
      title: "Repair before users see it",
      description: "Fix invalid output as it streams, before it reaches users.",
    },
    {
      Icon: ArrowsClockwise,
      icon: "refresh",
      title: "Stay online through outages",
      description: "Gateway switches providers if one fails, keeping the same model.",
    },
    {
      Icon: Key,
      icon: "key",
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
  secondaryCta: { label: "View docs", href: "/docs/agent/getting-started/quickstart" },
  tone: "dark",
  shot: "/homepage/observability",
  fullBleedArt: true,
  stageAspectRatio: "1120 / 440",
  /* The phone artwork is a different drawing, at 1440x1200. */
  stageMobileAspectRatio: "1440 / 1200",
  cards: [
    {
      Icon: PlayCircle,
      icon: "replay",
      title: "Replay sessions",
      description: "See the exact UI and interactions your users experienced.",
    },
    {
      Icon: WarningDiamond,
      icon: "warning",
      title: "Track every failure",
      description: "Capture errors, corrections, fallbacks, and failed generations.",
    },
    {
      Icon: CursorClick,
      icon: "interaction",
      title: "Understand users",
      description: "See what people use, where they struggle, and what works.",
    },
    {
      Icon: MagnifyingGlass,
      icon: "search",
      title: "Find what\u2019s missing",
      description: "Surface unmet needs, emerging demand, and opportunities to improve.",
    },
  ],
};

/* The open-source band ("OpenUI" / "Open Source"), restored under the logo
   carousel on the home page. */
export const LANG_PRODUCT: ProductSectionProps = {
  name: "OpenUI",
  tag: "Open Source",
  headline: "A framework for agent-driven interfaces.",
  /* No description: the headline stands alone. */
  secondaryCta: { label: "View docs", href: "/docs/openui-lang" },
  tone: "light",
  /* The stage is live HTML (LangShowcase, passed as art from page.tsx): the
     KALLAX answer streams as OpenUI Lang beside its rendered preview. */
  fullBleedArt: true,
  bareStage: true,
  stageAspectRatio: "1120 / 560",
  /* Taller on a phone, where the three agent panels stack (the closed two
     are thin rows, so the open one still gets most of the height). */
  stageMobileAspectRatio: "3 / 4",
  cards: [],
};
