import { PillLink } from "@/app/(home)/components/Button/Button";
import { blog } from "@/lib/source";
import { getMDXComponents } from "@/mdx-components";
import { TOCItems } from "fumadocs-ui/components/toc/default";
import { TOCProvider, TOCScrollArea } from "fumadocs-ui/components/toc/index";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

function BlogGithubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.46c.53.1.72-.23.72-.51v-1.8c-2.92.64-3.53-1.24-3.53-1.24-.48-1.22-1.17-1.55-1.17-1.55-.95-.66.07-.65.07-.65 1.06.07 1.62 1.08 1.62 1.08.93 1.6 2.45 1.14 3.05.87.09-.68.36-1.14.66-1.4-2.33-.27-4.77-1.16-4.77-5.18 0-1.14.4-2.07 1.08-2.8-.11-.26-.47-1.35.1-2.81 0 0 .88-.28 2.89 1.07a10.08 10.08 0 0 1 5.27 0c2-1.35 2.88-1.07 2.88-1.07.58 1.46.22 2.55.11 2.81.68.73 1.08 1.66 1.08 2.8 0 4.03-2.45 4.91-4.79 5.17.38.33.71.97.71 1.96v2.91c0 .28.19.62.73.51A10.5 10.5 0 0 0 12 1.5Z" />
    </svg>
  );
}

export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const page = blog.getPage([params.slug]);

  if (!page) notFound();
  const Mdx = page.data.body;

  return (
    <TOCProvider toc={page.data.toc}>
      <main className="mx-auto flex w-full max-w-[1200px] gap-4 px-4 pt-16 pb-40 lg:gap-28 lg:pr-8 min-[1249px]:pl-0 min-[1024px]:max-[1248px]:pl-8">
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
          <div className="mt-12 border-t pt-8">
            <PillLink
              href="https://github.com/thesysdev/openui"
              external
              className="inline-flex h-12 items-center gap-2 rounded-full bg-black px-5 text-[15px] font-medium text-white no-underline transition-colors duration-200 hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/85"
            >
              <BlogGithubIcon />
              <span>Star us on GitHub</span>
            </PillLink>
          </div>
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
