import type { PageMetadataInput } from "@/lib/page-metadata";

export default {
  pathname: "/components/theme-builder",
  // The /components layout sets a plain title, which drops the root "| OpenUI" template.
  title: { absolute: "Generative UI theme builder | OpenUI" },
  description:
    "Pick colors, fonts and radii and preview them live on real OpenUI blocks, then copy the theme into your app.",
  openGraph: { title: "Generative UI theme builder" },
} satisfies PageMetadataInput;
