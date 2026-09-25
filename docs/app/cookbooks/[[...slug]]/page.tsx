import { DocsPageView, getDocsPageMetadata } from "@/components/docs-page";
import { source } from "@/lib/source";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

function getPage(slug: string[] = []) {
  return source.getPage(["cookbooks", ...slug]);
}

export default async function Page(props: PageProps<"/cookbooks/[[...slug]]">) {
  const page = getPage((await props.params).slug);
  if (!page) notFound();

  return <DocsPageView page={page} />;
}

export async function generateStaticParams() {
  return source
    .generateParams()
    .filter((params) => params.slug[0] === "cookbooks")
    .map((params) => ({ slug: params.slug.slice(1) }));
}

export async function generateMetadata(
  props: PageProps<"/cookbooks/[[...slug]]">,
): Promise<Metadata> {
  const page = getPage((await props.params).slug);
  if (!page) notFound();

  return getDocsPageMetadata(page);
}
