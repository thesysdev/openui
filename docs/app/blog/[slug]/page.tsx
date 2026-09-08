import { GitHubButton } from "@/app/(home)/components/GitHubButton/GitHubButton";
import { Footer } from "@/app/(home)/sections/Footer/Footer";
import { blog } from "@/lib/source";
import { getMDXComponents } from "@/mdx-components";
import { TOCProvider, TOCScrollArea } from "fumadocs-ui/components/toc";
import { TOCItem, TOCItems } from "fumadocs-ui/components/toc/default";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export default async function BlogPostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const page = blog.getPage([params.slug]);

  if (!page) notFound();
  const Mdx = page.data.body;

  return (
    <TOCProvider toc={page.data.toc}>
      {/* Blend from the menu bar's surface color into a gray band, then back into the
          footer's surface — matching the home content band (light: foreground->background->foreground;
          dark: black -> neutral-950 -> black, so the edges meet the black menu + footer). */}
      <div className="min-h-screen bg-[linear-gradient(to_bottom,var(--openui-foreground),var(--openui-background)_10rem,var(--openui-background)_calc(100%_-_10rem),var(--openui-foreground))] [[data-theme=dark]_&]:bg-[linear-gradient(to_bottom,#000,var(--swatch-neutral-950)_28rem,var(--swatch-neutral-950)_calc(100%_-_28rem),#000)]">
        <main className="mx-auto flex w-full max-w-[var(--home-container-wide)] gap-4 px-4 pt-16 pb-40 lg:gap-28 lg:pr-8 min-[1249px]:pl-0 min-[1024px]:max-[1248px]:pl-8">
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24">
              <p className="mb-3 text-sm font-medium text-fd-foreground">On this page</p>
              <TOCScrollArea className="max-h-[calc(100vh-8rem)]">
                <TOCItems>
                  {page.data.toc.map((item) => (
                    <TOCItem key={item.url} item={item} />
                  ))}
                </TOCItems>
              </TOCScrollArea>
            </div>
          </aside>

          <div className="min-w-0 w-full max-w-[50rem] flex-1">
            <h1 className="mb-2 text-[length:var(--home-title-size)] font-[family-name:var(--home-font-display)] font-medium leading-[var(--home-title-leading)] tracking-[var(--home-title-tracking)] text-[color:var(--openui-text-neutral-primary)]">
              {page.data.title}
            </h1>
            <p className="mb-4 text-[length:var(--home-lead-size)] font-[family-name:var(--home-font-text)] leading-[var(--home-lead-leading)] text-[color:var(--openui-text-neutral-secondary)]">
              {page.data.description}
            </p>
            <div className="flex items-center gap-3 border-b border-[color:var(--home-hairline)] pb-6 text-[length:var(--home-body-size)] font-[family-name:var(--home-font-text)] text-[color:var(--openui-text-neutral-tertiary)]">
              <span>{page.data.author}</span>
              <span>&middot;</span>
              <time>{new Date(page.data.date).toDateString()}</time>
            </div>
            <article className="prose mt-8 min-w-0">
              <Mdx components={getMDXComponents()} />
            </article>
            <div className="mt-12 border-t border-[color:var(--home-hairline)] pt-8">
              <GitHubButton variant="desktopGlow" />
            </div>
          </div>
        </main>
      </div>
      <Footer />
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
    alternates: {
      canonical: page.url,
    },
  };
}

export function generateStaticParams(): { slug: string }[] {
  return blog.getPages().map((page) => ({
    slug: page.slugs[0],
  }));
}
