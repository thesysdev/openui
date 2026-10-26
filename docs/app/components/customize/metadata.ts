import type { PageMetadataInput } from "@/lib/page-metadata";

export default {
  pathname: "/components/customize",
  // The /components layout sets a plain title, which drops the root "| OpenUI" template.
  title: { absolute: "Customize the OpenUI theme | OpenUI" },
  description:
    "A step-by-step guide to restyling the OpenUI Design System so generated UI matches your brand's colors, type and shapes.",
  openGraph: { title: "Customize the OpenUI theme" },
} satisfies PageMetadataInput;
