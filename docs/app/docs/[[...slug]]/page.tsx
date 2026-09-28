import { DocsPageView, getDocsPageMetadata } from "@/components/docs-page";
import { isTopLevelSection, source } from "@/lib/source";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

// Sections like cookbooks live at their own top-level path, so /docs does not serve them.
function getPage(slug: string[] | undefined) {
  return isTopLevelSection(slug) ? undefined : source.getPage(slug);
}

export default async function Page(props: PageProps<"/docs/[[...slug]]">) {
  const page = getPage((await props.params).slug);
  if (!page) notFound();

  return <DocsPageView page={page} />;
}

export async function generateStaticParams() {
  return source.generateParams().filter((params) => !isTopLevelSection(params.slug));
}

export async function generateMetadata(props: PageProps<"/docs/[[...slug]]">): Promise<Metadata> {
  const page = getPage((await props.params).slug);
  if (!page) notFound();

  return getDocsPageMetadata(page);
}
