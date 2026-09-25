import { LLMCopyButton, ViewOptions } from "@/components/ai/page-actions";
import { gitConfig } from "@/lib/layout.shared";
import { getPageImage, source } from "@/lib/source";
import { getMDXComponents } from "@/mdx-components";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";

type DocsSourcePage = NonNullable<ReturnType<typeof source.getPage>>;

/** Renders a docs content page. Shared by `/docs` and the top-level sections like `/cookbooks`. */
export function DocsPageView({ page }: { page: DocsSourcePage }) {
  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      {!page.data.customHeader && (
        <>
          <DocsTitle>{page.data.title}</DocsTitle>
          <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
          <div className="flex flex-row gap-2 items-center border-b pb-6">
            <LLMCopyButton markdownUrl={`${page.url}.mdx`} />
            <ViewOptions
              markdownUrl={page.url}
              githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/docs/content/docs/${page.path}`}
            />
          </div>
        </>
      )}
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export function getDocsPageMetadata(page: DocsSourcePage): Metadata {
  return {
    title: page.data.title,
    description: page.data.description,
    alternates: {
      canonical: page.url,
    },
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
