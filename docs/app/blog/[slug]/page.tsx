import { blog } from "@/lib/source";
import { getMDXComponents } from "@/mdx-components";
import { TOCItems } from "fumadocs-ui/components/toc/default";
import { TOCProvider, TOCScrollArea } from "fumadocs-ui/components/toc/index";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const page = blog.getPage([params.slug]);

  if (!page) notFound();
  const Mdx = page.data.body;

  return (
    <TOCProvider toc={page.data.toc}>
      <main className="mx-auto flex w-full max-w-[1200px] gap-10 px-4 py-12 md:px-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24">
            <p className="mb-3 text-sm font-medium text-fd-foreground">On this page</p>
            <TOCScrollArea className="max-h-[calc(100vh-8rem)]">
              <TOCItems />
            </TOCScrollArea>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <h1 className="mb-2 text-3xl font-bold">{page.data.title}</h1>
          <p className="mb-4 text-fd-muted-foreground">{page.data.description}</p>
          <div className="flex items-center gap-3 border-b pb-6 text-sm text-fd-muted-foreground">
            <span>{page.data.author}</span>
            <span>&middot;</span>
            <time>{new Date(page.data.date).toDateString()}</time>
          </div>
          <article className="prose mt-8 min-w-0">
            <Mdx components={getMDXComponents()} />
          </article>
        </div>
      </main>
    </TOCProvider>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = blog.getPage([params.slug]);

  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}

export function generateStaticParams(): { slug: string }[] {
  return blog.getPages().map((page) => ({
    slug: page.slugs[0],
  }));
}
