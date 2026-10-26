import type { PageMetadataInput } from "@/lib/page-metadata";

export default {
  pathname: "/components/blocks",
  // The /components layout sets a plain title, which drops the root "| OpenUI" template.
  title: { absolute: "Generative UI blocks | OpenUI" },
  description:
    "Blocks are the building units of OpenUI: attribute lists, callouts, tabs, tables, charts and more, made for agents to compose.",
  openGraph: { title: "Generative UI blocks" },
} satisfies PageMetadataInput;
