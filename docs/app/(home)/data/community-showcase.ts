/**
 * The community showcase on the homepage: the projects featured for one
 * rotation. To rotate, replace `projects` and move the two dates forward.
 * Demo clips live in /public/community-showcase, cut from each maker's own
 * demo video where they posted one.
 */

export interface ShowcaseProject {
  name: string;
  /** The project site the row links to. */
  href: string;
  /** Who built it. */
  maker: string;
  /** The maker's X or LinkedIn profile, linked from their name. */
  makerHref: string;
  /** One or two sentences on what it does with OpenUI. */
  description: string;
  tags: string[];
  /** Demo clip under /public: muted, short (5 to 20s), 16:10 or wider. */
  video: string;
  /** Optional still shown before the recording loads. */
  poster?: string;
}

export interface ShowcaseRotation {
  /** Inclusive ISO dates (YYYY-MM-DD) for the featured window. */
  featuredFrom: string;
  featuredUntil: string;
  /** Exactly five, in rank order. The first plays first. */
  projects: ShowcaseProject[];
}

export const COMMUNITY_SHOWCASE: ShowcaseRotation = {
  featuredFrom: "2026-11-09",
  featuredUntil: "2026-11-15",
  projects: [
    {
      name: "Curio",
      href: "https://curio-landing-phi.vercel.app",
      maker: "Jose Estevez",
      makerHref: "https://x.com/JoseEstevez520",
      description:
        "A reading companion: answers render as generative UI, and clicking any highlighted term opens an explanation right where you are reading.",
      tags: ["Reading", "Generative UI"],
      video: "/community-showcase/curio.mp4",
    },
    {
      name: "Windshift",
      href: "https://windshift.sh",
      maker: "Stefan Ernst",
      makerHref: "https://github.com/stefan-ernst",
      description:
        "A self-hosted work management platform. Describe a dashboard widget and it is generated as OpenUI Lang and rendered with @openuidev/svelte-lang.",
      tags: ["Work management", "Svelte", "Dashboards"],
      video: "/community-showcase/windshift.mp4",
    },
    {
      name: "AI Native Dashboard",
      href: "https://github.com/jaibhasin/AI-Native-Dashboard",
      maker: "Jai Bhasin",
      makerHref: "https://x.com/bhasin_jai_",
      description:
        "An infinite canvas where you ask for a widget in plain language and OpenUI renders it as a movable, resizable card.",
      tags: ["Dashboards", "Canvas"],
      video: "/community-showcase/ai-native-dashboard.mp4",
    },
    {
      name: "OpenUI Sports",
      href: "https://naivesolution.dev/projects/openui-sports",
      maker: "Michael Kolkov",
      makerHref: "https://x.com/michaelkolkov",
      description:
        "A registry of soccer, NBA, and NFL components that a model fills in with OpenUI Lang: match cards, standings, leaderboards, and charts.",
      tags: ["Sports", "Component registry", "SwiftUI"],
      video: "/community-showcase/openui-sports.mp4",
    },
    {
      name: "Learnify",
      href: "https://learnify.ahmedfahim.dev",
      maker: "Ahmed Fahim",
      makerHref: "https://x.com/ahmedfahim21_",
      description:
        "A lecture companion: pause any NPTEL lecture, ask in your own language, and get quizzes, flashcards, and concept maps.",
      tags: ["Education", "Flashcards"],
      video: "/community-showcase/learnify.mp4",
    },
  ],
};

const DAY = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: "UTC" });
const MONTH_DAY = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** "Nov 9 – 15" within a month, "Nov 28 – Dec 4" across two. */
export function formatFeaturedWindow(from: string, until: string): string {
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${until}T00:00:00Z`);
  const sameMonth =
    start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear();
  return `${MONTH_DAY.format(start)} – ${sameMonth ? DAY.format(end) : MONTH_DAY.format(end)}`;
}
