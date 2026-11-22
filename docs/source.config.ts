import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { defineCollections, defineConfig, defineDocs } from "fumadocs-mdx/config";
import lastModified from "fumadocs-mdx/plugins/last-modified";
import { z } from "zod";

const docsPageSchema = pageSchema.extend({
  // Search title for <title>; the H1 and sidebar keep `title`.
  seoTitle: z.string().optional(),
  customHeader: z.boolean().optional().default(false),
  // Hides the previous/next page links at the bottom of the page.
  hideFooter: z.boolean().optional().default(false),
  // Hides the left sidebar. Pages that keep their TOC widen to the `full` page width.
  sidebar: z.boolean().optional().default(true),
  // Hides Copy Markdown and Open, for pages whose Markdown is mostly component tags.
  pageActions: z.boolean().optional().default(true),
});

// You can customise Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: docsPageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export const blogPosts = defineCollections({
  type: "doc",
  dir: "content/blog",
  schema: pageSchema.extend({
    // Search title for <title>; the H1 keeps `title`.
    seoTitle: z.string().optional(),
    author: z.string(),
    date: z.string().date().or(z.date()),
    featured: z.boolean().optional(),
    // Rendered after the post and emitted as FAQPage JSON-LD. Answers are
    // paragraphs that may use inline code and [links](/path).
    faq: z.array(z.object({ question: z.string(), answer: z.array(z.string()).min(1) })).optional(),
    /** Social preview image in `public/`, used instead of the cropped cover. */
    ogImage: z.string().optional(),
  }),
});

export default defineConfig({
  plugins: [lastModified()],
});
