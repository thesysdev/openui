/**
 * The community showcase on the homepage: the projects featured for one
 * rotation. To rotate, replace `projects` and move the two dates forward.
 *
 * PLACEHOLDER PICKS: these five are taken from ADOPTERS.md so the section has
 * real content to preview, and the recordings are stand-in footage already in
 * /public, not recordings of these projects. Swap both before launch.
 */

export interface ShowcaseProject {
  name: string;
  /** The project site the row links to. */
  href: string;
  /** Who built it. */
  maker: string;
  /** One or two sentences on what it does with OpenUI. */
  description: string;
  tags: string[];
  /** Screen recording under /public: muted, short (5 to 20s), 16:10 or wider. */
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
      name: "GAIA",
      href: "https://heygaia.io",
      maker: "Aryan Randeriya",
      description:
        "A proactive personal AI assistant. Its backend LLM writes OpenUI Lang, so cards, lists, and other interactive components render inline in the conversation instead of plain text.",
      tags: ["Assistant", "OpenUI Lang", "React"],
      video: "/agent-interface/Fixpanel.mp4",
    },
    {
      name: "Oodle",
      href: "https://www.oodle.ai/",
      maker: "Gaurav Maheshwari",
      description:
        "Streaming, composable observability UI: metrics, logs, traces, and incident timelines drawn by the assistant.",
      tags: ["Observability", "Charts"],
      video: "/agent-interface/Linea.mp4",
    },
    {
      name: "prox",
      href: "https://useprox.com/",
      maker: "Gregory Makodzeba",
      description:
        "Turns manuals and product data into cited, interactive answers like troubleshooters, selectors, and calculators.",
      tags: ["Support", "Forms"],
      video: "/agent-interface/Play.mp4",
    },
    {
      name: "Learnify",
      href: "https://learnify.ahmedfahim.dev",
      maker: "Ahmed Fahim",
      description:
        "A lecture companion: pause any NPTEL lecture, ask in your own language, and get quizzes, flashcards, and notes.",
      tags: ["Education", "Quizzes"],
      video: "/agent-interface/hostpog.mp4",
    },
    {
      name: "Bub",
      href: "https://bub.build/",
      maker: "Chojan Shang",
      description:
        "A tiny plugin-based agent runtime whose AG-UI plugin streams replies into an OpenUI chat frontend.",
      tags: ["Agent runtime", "AG-UI"],
      video: "/agent-interface/tendesk.mp4",
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
