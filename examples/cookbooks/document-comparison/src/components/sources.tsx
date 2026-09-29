import { defineComponent } from "@openuidev/react-lang";
import {
  CardSourceProvider,
  CardSourceSchema,
  Sources as SourceStrip,
  type CardSource,
} from "@openuidev/react-ui";
import { z } from "zod/v4";

// One card per page: the strip keys cards by URL, and two criteria can share a page.
function onePerPage(items: CardSource[]) {
  const pages = new Map<string, CardSource>();
  items.forEach((item, index) => {
    const key = item.url || String(index);
    const seen = pages.get(key);
    pages.set(
      key,
      seen ? { ...seen, title: [seen.title, item.title].filter(Boolean).join(" ") } : item,
    );
  });
  return [...pages.values()];
}

// Reuses the Sources strip from React UI: one card per quoted page, opening the report there.
export const Sources = defineComponent({
  name: "Sources",
  props: z.object({ items: z.array(CardSourceSchema) }),
  description:
    "A strip of source cards. Each item is { title, sourceName, url }: title is the quote, sourceName names the document and page, and url opens the page.",
  component: ({ props }) => (
    <CardSourceProvider sources={onePerPage(props.items ?? [])}>
      <SourceStrip />
    </CardSourceProvider>
  ),
});
