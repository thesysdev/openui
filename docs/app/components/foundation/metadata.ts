import type { PageMetadataInput } from "@/lib/page-metadata";

export default {
  pathname: "/components/foundation",
  // The /components layout sets a plain title, which drops the root "| OpenUI" template.
  title: { absolute: "Design foundations | OpenUI" },
  description:
    "OpenUI design tokens for colors, spacing, typography, radius, shadows and motion, all exposed as CSS custom properties.",
  openGraph: { title: "Design foundations" },
} satisfies PageMetadataInput;
