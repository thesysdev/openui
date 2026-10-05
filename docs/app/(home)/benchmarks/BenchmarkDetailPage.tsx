import { Footer } from "@/app/(home)/sections/Footer/Footer";
import type { ReactNode } from "react";
import { PillLink } from "../components/Button/Button";

type DetailLink = {
  href: string;
  label: string;
  external?: boolean;
};

export function BenchmarkDetailPage({
  eyebrow,
  title,
  description,
  sections,
  sibling,
  downloads,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: ReadonlyArray<{ id: string; label: string }>;
  sibling: DetailLink;
  downloads: ReadonlyArray<DetailLink>;
  children: ReactNode;
}) {
  return (
    <>
      <div className="min-h-screen bg-[linear-gradient(to_bottom,var(--openui-foreground),var(--openui-background)_10rem,var(--openui-background)_calc(100%_-_10rem),var(--openui-foreground))] [[data-theme=dark]_&]:bg-[linear-gradient(to_bottom,#000,var(--swatch-neutral-950)_28rem,var(--swatch-neutral-950)_calc(100%_-_28rem),#000)]">
        <main className="mx-auto flex w-full max-w-[var(--home-container-wide)] gap-4 px-4 pt-16 pb-40 lg:gap-28 lg:pr-8 min-[1249px]:pl-0 min-[1024px]:max-[1248px]:pl-8">
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24">
              <p className="mb-3 text-sm font-medium text-fd-foreground">On this page</p>
              <ul className="space-y-2 text-sm text-[color:var(--openui-text-neutral-tertiary)]">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.id}`}>{section.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <p className="mb-3 text-sm font-medium text-[color:var(--openui-text-neutral-secondary)]">
              {eyebrow}
            </p>
            <h1 className="mb-3 max-w-4xl text-[length:var(--home-title-size)] font-[family-name:var(--home-font-display)] font-medium leading-[var(--home-title-leading)] tracking-[var(--home-title-tracking)] text-[color:var(--openui-text-neutral-primary)]">
              {title}
            </h1>
            <p className="mb-5 max-w-3xl text-[length:var(--home-lead-size)] font-[family-name:var(--home-font-text)] leading-[var(--home-lead-leading)] text-[color:var(--openui-text-neutral-secondary)]">
              {description}
            </p>
            <nav
              aria-label="Benchmark pages"
              className="-ml-3 flex flex-wrap items-center gap-1 border-b border-[color:var(--home-hairline)] pb-6"
            >
              <PillLink href="/benchmarks" variant="ghost">
                Benchmark overview
              </PillLink>
              <PillLink href={sibling.href} variant="ghost" external={sibling.external}>
                {sibling.label}
              </PillLink>
              <PillLink href="/benchmarks/methodology" variant="ghost">
                Methodology
              </PillLink>
            </nav>

            <article className="prose mt-8 min-w-0 max-w-none">{children}</article>

            <section
              id="downloads"
              aria-labelledby="downloads-heading"
              className="mt-12 border-t border-[color:var(--home-hairline)] pt-8"
            >
              <h2 id="downloads-heading" className="mb-4 text-xl font-medium">
                Data for agents and analysis
              </h2>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {downloads.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="underline decoration-[color:var(--home-hairline)] underline-offset-4"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
