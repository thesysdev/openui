import { blog } from "@/lib/source";
import { ArrowUpRight, ImageIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageHero, PageHeroAccent } from "../(home)/components/PageHero/PageHero";
import { Footer } from "../(home)/sections/Footer/Footer";

type BlogCardData = {
  href: string;
  title: string;
  description?: string;
  author: string;
  date: string | Date;
  featured: boolean;
  external: boolean;
  tag?: string;
  image?: string;
};

// Community / external posts that don't live in the local content source.
const COMMUNITY_CARDS: BlogCardData[] = [
  {
    href: "https://azukiazusa.dev/blog/openui-framework-for-generative-ui/",
    title: "Generative UI のためのフレームワーク OpenUI",
    author: "azukiazusa1",
    date: "2026-05-16",
    featured: false,
    external: true,
    tag: "Community",
    image: "/images/blog/community-japan.png",
  },
  {
    href: "https://note.com/quick_pipit7468/n/n89d6125725ca",
    title: "AIの回答が「画面」で返ってくる — Generative UIの3つのアプローチ",
    author: "Komugi",
    date: "2026-07-08",
    featured: false,
    external: true,
    tag: "Community",
    image: "/images/blog/community-note.jpg",
  },
  {
    href: "https://zenn.dev/sc30gsw/articles/d7320f1247b785",
    title: "Generative UIにJSONは最適なのか？ OpenUIという選択肢",
    author: "kaito",
    date: "2026-06-26",
    featured: false,
    external: true,
    tag: "Community",
    image: "/images/blog/community-zenn.jpg",
  },
  {
    href: "https://ai-heartland.com/tool/openui-generative-ui/",
    title: "OpenUI徹底解説 — LLMがUIを生成するオープン標準OSS",
    author: "AI Heartland",
    date: "2026-06-25",
    featured: false,
    external: true,
    tag: "Community",
    image: "/images/blog/community-ai-heartland.jpg",
  },
  {
    href: "https://blog.oodle.ai/how-we-taught-our-ai-to-draw/",
    title: "How we taught our AI to draw",
    author: "Gaurav Maheshwari",
    date: "2026-06-12",
    featured: false,
    external: true,
    tag: "Community",
    image: "/images/blog/community-oodle.jpg",
  },
];

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Matches the project card title: heading tokens for size/tracking/leading, plus a
// fixed 500 weight (font-medium) so the title stays medium on mobile like desktop
// instead of dropping to the token's 400.
const TITLE_CLASS =
  "text-[length:var(--home-heading-size)] font-[family-name:var(--home-font-display)] font-medium leading-[var(--home-heading-leading)] tracking-[var(--home-heading-tracking)] text-[color:var(--openui-text-neutral-primary)]";

const CARD_CLASS =
  "group flex flex-col overflow-hidden rounded-[var(--openui-radius-4xl)] border border-[var(--home-hairline)] bg-[var(--openui-foreground)] p-2 no-underline shadow-[var(--home-card-lift)]";

function TagChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-[1.625rem] shrink-0 items-center rounded-lg bg-[var(--openui-foreground)] px-2 font-[family-name:var(--home-font-mono)] text-[length:var(--home-label-size)] font-medium uppercase tracking-wide text-[color:var(--openui-text-neutral-secondary)] shadow-[var(--openui-shadow-s)]">
      {children}
    </span>
  );
}

function Byline({ author, date }: { author: string; date: string | Date }) {
  return (
    <div className="mt-auto flex items-center gap-2 pt-5 text-[length:var(--home-body-size)] font-[family-name:var(--home-font-text)] text-[color:var(--openui-text-neutral-secondary)] max-md:flex-col max-md:items-start max-md:gap-1 max-md:pt-4 max-md:text-[0.75rem]">
      <span className="font-medium text-[color:var(--openui-text-neutral-primary)]">{author}</span>
      <span aria-hidden="true" className="max-md:hidden">
        ·
      </span>
      <time>{formatDate(date)}</time>
    </div>
  );
}

function ImagePlaceholder({ size = "small" }: { size?: "small" | "large" }) {
  return (
    <ImageIcon
      aria-hidden="true"
      strokeWidth={1.5}
      className={`${
        size === "large" ? "h-10 w-10" : "h-8 w-8"
      } text-[color:var(--openui-text-neutral-secondary)] opacity-40`}
    />
  );
}

// Featured: full width, image on one side (desktop), description shown.
function FeaturedCard({ card }: { card: BlogCardData }) {
  return (
    <Link href={card.href} className={`${CARD_CLASS} md:min-h-[24rem] md:flex-row`}>
      <div className="relative flex h-44 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--openui-highlight)] md:h-auto md:w-1/2">
        {card.image ? (
          <img
            src={card.image}
            alt={card.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <ImagePlaceholder size="large" />
        )}
        {card.tag && (
          <span className="absolute left-4 top-4">
            <TagChip>{card.tag}</TagChip>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 md:p-8">
        <h2 className={TITLE_CLASS}>{card.title}</h2>
        {card.description && (
          <p className="mt-3 line-clamp-4 max-w-[42rem] text-[length:var(--home-body-size)] font-[family-name:var(--home-font-text)] leading-[1.65] text-[color:var(--openui-text-neutral-secondary)]">
            {card.description}
          </p>
        )}
        <Byline author={card.author} date={card.date} />
      </div>
    </Link>
  );
}

// Regular: image on top, no description.
function RegularCard({ card }: { card: BlogCardData }) {
  const externalProps = card.external ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <Link
      href={card.href}
      {...externalProps}
      className={`${CARD_CLASS} min-h-[15rem] max-md:min-h-0`}
    >
      <div className="relative flex h-44 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[var(--openui-highlight)] md:h-60">
        {card.image ? (
          <img
            src={card.image}
            alt={card.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <ImagePlaceholder />
        )}
        {card.tag && (
          <span className="absolute left-4 top-4">
            <TagChip>{card.tag}</TagChip>
          </span>
        )}
        {card.external && (
          <span className="absolute right-4 top-4 inline-flex h-[1.625rem] w-[1.625rem] items-center justify-center rounded-lg bg-[var(--openui-foreground)] text-[color:var(--openui-text-neutral-secondary)] shadow-[var(--openui-shadow-s)]">
            <ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h2 className={TITLE_CLASS}>{card.title}</h2>
        <Byline author={card.author} date={card.date} />
      </div>
    </Link>
  );
}

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Articles on Generative UI from the OpenUI team: OpenUI Lang, agent interfaces, benchmarks, and building apps that respond with UI.",
};

export default function BlogIndex() {
  const localCards: BlogCardData[] = blog.getPages().map((post) => {
    const slug = post.url.split("/").filter(Boolean).pop();
    return {
      href: post.url,
      title: post.data.title,
      description: post.data.description,
      author: post.data.author,
      date: post.data.date,
      featured: Boolean(post.data.featured),
      external: false,
      tag: post.data.featured ? "Featured" : undefined,
      image: slug ? `/images/blog/${slug}.png` : undefined,
    };
  });

  const byDateDesc = (a: BlogCardData, b: BlogCardData) =>
    new Date(b.date).getTime() - new Date(a.date).getTime();

  const sortedLocal = [...localCards].sort(byDateDesc);
  const featuredCards = sortedLocal.filter((card) => card.featured);
  const regularCards = sortedLocal.filter((card) => !card.featured);
  const communityCards = [...COMMUNITY_CARDS].sort(byDateDesc);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--openui-foreground)] [[data-theme=dark]_&]:bg-black">
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-[var(--home-container-max)] px-4 md:px-8">
          <PageHero
            title={
              <>
                OpenUI <PageHeroAccent>Library</PageHeroAccent>
              </>
            }
            subtitle="Product updates, deep dives, and notes on building generative UI with OpenUI."
            smallSubtitle
          />
        </div>

        <section className="bg-[linear-gradient(to_bottom,var(--openui-foreground),var(--openui-background)_10rem,var(--openui-background)_calc(100%_-_10rem),var(--openui-foreground))] [[data-theme=dark]_&]:bg-[linear-gradient(to_bottom,#000,var(--swatch-neutral-950)_28rem,var(--swatch-neutral-950)_calc(100%_-_28rem),#000)]">
          <div className="mx-auto w-full max-w-[var(--home-container-max)] px-4 py-24 max-md:pt-8 md:px-8">
            <div className="flex flex-col gap-5">
              {featuredCards.map((card) => (
                <FeaturedCard key={card.href} card={card} />
              ))}
              <div className="grid grid-cols-1 gap-5 auto-rows-fr md:grid-cols-2">
                {regularCards.map((card) => (
                  <RegularCard key={card.href} card={card} />
                ))}
              </div>
            </div>

            <h2 className={`${TITLE_CLASS} mt-20 mb-6 max-md:mt-12`}>From the community</h2>
            <div className="grid grid-cols-1 gap-5 auto-rows-fr md:grid-cols-2">
              {communityCards.map((card) => (
                <RegularCard key={card.href} card={card} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
