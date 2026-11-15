/**
 * The community showcase on the homepage: the projects featured for one
 * rotation. To rotate, replace `projects`.
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
  /** Demo clip under /public: muted, short (5 to 20s), 16:10 or wider. */
  video: string;
  /** Optional still shown before the recording loads. */
  poster?: string;
}

export interface ShowcaseRotation {
  /** Exactly five, in rank order. The first plays first. */
  projects: ShowcaseProject[];
}

export const COMMUNITY_SHOWCASE: ShowcaseRotation = {
  projects: [
    {
      name: "Curio",
      href: "https://curio-landing-phi.vercel.app",
      maker: "Jose Estevez",
      makerHref: "https://x.com/JoseEstevez520",
      description:
        "A reading companion: answers render as generative UI, and clicking any highlighted term opens an explanation right where you are reading.",
      video: "/community-showcase/curio.mp4",
    },
    {
      name: "Windshift",
      href: "https://windshift.sh",
      maker: "Stefan Ernst",
      makerHref: "https://github.com/stefan-ernst",
      description:
        "A self-hosted work management platform. Describe a dashboard widget and it is generated as OpenUI Lang and rendered with @openuidev/svelte-lang.",
      video: "/community-showcase/windshift.mp4",
    },
    {
      name: "AI Native Dashboard",
      href: "https://github.com/jaibhasin/AI-Native-Dashboard",
      maker: "Jai Bhasin",
      makerHref: "https://x.com/bhasin_jai_",
      description:
        "An infinite canvas: describe what you are planning and OpenUI fills it with a dashboard of movable, resizable widgets.",
      video: "/community-showcase/ai-native-dashboard.mp4",
    },
    {
      name: "OpenUI Sports",
      href: "https://naivesolution.dev/projects/openui-sports",
      maker: "Michael Kolkov",
      makerHref: "https://x.com/michaelkolkov",
      description:
        "A registry of soccer, NBA, and NFL components that a model fills in with OpenUI Lang: match cards, standings, leaderboards, and charts.",
      video: "/community-showcase/openui-sports.mp4",
    },
    {
      name: "Learnify",
      href: "https://learnify.ahmedfahim.dev",
      maker: "Ahmed Fahim",
      makerHref: "https://x.com/ahmedfahim21_",
      description:
        "A lecture companion: pause any NPTEL lecture, ask in your own language, and get quizzes, flashcards, and concept maps.",
      video: "/community-showcase/learnify.mp4",
    },
  ],
};
