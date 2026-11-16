import { LLMCopyButton, ViewOptions } from "@/components/ai/page-actions";
import { JsonLd } from "@/components/seo/JsonLd";
import { gitConfig } from "@/lib/layout.shared";
import { docsOgImage } from "@/lib/og/content";
import { ogImageUrl } from "@/lib/og/images";
import { withOgImage } from "@/lib/page-metadata";
import { BASE_URL, source } from "@/lib/source";
import { getMDXComponents, MdxLink } from "@/mdx-components";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";

type DocsSourcePage = NonNullable<ReturnType<typeof source.getPage>>;

/** Renders a docs content page. Shared by `/docs` and the top-level sections like `/cookbooks`. */
export function DocsPageView({ page }: { page: DocsSourcePage }) {
  const MDX = page.data.body;
  const showToc = page.slugs[0] !== "demos";

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
      footer={{ enabled: !page.data.hideFooter }}
      tableOfContent={{ style: "clerk", enabled: showToc }}
      tableOfContentPopover={{ style: "clerk", enabled: showToc }}
      // Without a sidebar there is room for the `full` page width next to the TOC (see global.css).
      data-no-sidebar={!page.data.sidebar || undefined}
    >
      <JsonLd data={docsStructuredData(page)} />
      {!page.data.customHeader && (
        <>
          <DocsTitle>{page.data.title}</DocsTitle>
          <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
          {page.data.pageActions && (
            <div className="flex flex-row gap-2 items-center border-b pb-6">
              <LLMCopyButton markdownUrl={`${page.url}.mdx`} />
              <ViewOptions
                markdownUrl={page.url}
                githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/docs/content/docs/${page.path}`}
              />
            </div>
          )}
        </>
      )}
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page, MdxLink),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export function getDocsPageMetadata(page: DocsSourcePage): Metadata {
  const image = docsOgImage(page);
  const description = image.card.template === "card" ? image.card.description : undefined;
  return withOgImage({ ...docsMetadata(page), description }, image, { description });
}

/* TechArticle structured data: gives Google the page's last-modified date and publisher. */
function docsStructuredData(page: DocsSourcePage) {
  const url = `${BASE_URL}${page.url}`;
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": `${url}#article`,
    headline: page.data.title,
    description: page.data.description,
    image: `${BASE_URL}${ogImageUrl(docsOgImage(page))}`,
    ...(page.data.lastModified && {
      dateModified: new Date(page.data.lastModified).toISOString(),
    }),
    publisher: {
      "@type": "Organization",
      "@id": "https://www.thesys.dev/#organization",
      name: "Thesys",
      url: "https://www.thesys.dev",
    },
    mainEntityOfPage: url,
    url,
  };
}

function docsMetadata(page: DocsSourcePage): Metadata {
  return {
    title: page.data.seoTitle ?? page.data.title,
    description: page.data.description,
    alternates: {
      canonical: page.url,
    },
  };
}
