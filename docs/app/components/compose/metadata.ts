import type { PageMetadataInput } from "@/lib/page-metadata";

export default {
  pathname: "/components/compose",
  // The /components layout sets a plain title, which drops the root "| OpenUI" template.
  title: { absolute: "Control generative UI with prompts | OpenUI" },
  description:
    "Compare prompt variants side by side to steer how agents compose OpenUI blocks: formatting, specificity and behavior.",
  openGraph: { title: "Control generative UI with prompts" },
} satisfies PageMetadataInput;
