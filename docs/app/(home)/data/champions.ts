/**
 * OpenUI Champions: community members who help shape OpenUI through code,
 * feedback, and content. Shown on /champions. Headshots live in
 * /public/champions as square webp images.
 */

export interface ChampionLink {
  label: "GitHub" | "X" | "LinkedIn" | "Website";
  href: string;
}

export interface Champion {
  name: string;
  /** GitHub handle, shown under the name. */
  handle: string;
  photo: string;
  location?: string;
  /** One short line on what they did in OpenUI. */
  bio: string;
  links: ChampionLink[];
}

export const CHAMPIONS: Champion[] = [
  {
    name: "Shinobu Hayashi",
    handle: "Shinyaigeek",
    photo: "/champions/shinyaigeek.webp",
    bio: "Hardened the monorepo toolchain and fixed streaming in react-ui.",
    links: [
      { label: "GitHub", href: "https://github.com/Shinyaigeek" },
      { label: "X", href: "https://x.com/Shinyaigeek" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/shinyaigeek/" },
    ],
  },
  {
    name: "Sayandip Roy",
    handle: "shogun444",
    photo: "/champions/shogun444.webp",
    bio: "Brought tool providers and markdown to the Vue bindings.",
    links: [{ label: "GitHub", href: "https://github.com/shogun444" }],
  },
];
