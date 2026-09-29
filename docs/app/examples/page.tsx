import { DocsPageView, getDocsPageMetadata } from "@/components/docs-page";
import { source } from "@/lib/source";
import { notFound } from "next/navigation";

const page = source.getPage(["examples"]);

export default function Page() {
  if (!page) notFound();

  return <DocsPageView page={page} />;
}

export const metadata = page ? getDocsPageMetadata(page) : {};
