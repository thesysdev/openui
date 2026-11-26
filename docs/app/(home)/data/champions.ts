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
  /** One or two sentences on what they work on in OpenUI. */
  bio: string;
  links: ChampionLink[];
}

export const CHAMPIONS: Champion[] = [
  {
    name: "Shinobu Hayashi",
    handle: "Shinyaigeek",
    photo: "/champions/shinyaigeek.webp",
    bio: "Web developer focused on reliable web. Hardened the OpenUI monorepo's toolchain with pnpm catalogs and supply-chain checks, and fixed streaming behavior in react-ui components like Tabs and Accordion.",
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
    bio: "Design engineer. Brought tool providers and markdown rendering to the Vue bindings, made the CLI and package builds work on Windows, and fixed the parser's handling of markdown inside strings.",
    links: [{ label: "GitHub", href: "https://github.com/shogun444" }],
  },
];
