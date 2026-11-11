import { FaqList } from "@/app/(home)/sections/FaqSection/FaqSection";
import { BASE_URL } from "@/lib/site-url";
import Link from "next/link";
import type { ReactNode } from "react";

export type BlogFaqItem = {
  question: string;
  /* One entry per paragraph. */
  answer: string[];
};

/* Inline code and [text](href) links: all an FAQ answer needs. */
const INLINE = /`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;

function renderInline(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const [whole, code, label, href] = match;
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(
      code !== undefined ? (
        <code key={match.index}>{code}</code>
      ) : (
        <Link key={match.index} href={href}>
          {label}
        </Link>
      ),
    );
    last = match.index + whole.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/* The same words without the markup, for the structured data. */
function toPlainText(text: string): string {
  return text.replace(INLINE, (_whole, code?: string, label?: string) => code ?? label ?? "");
}

/* Closing FAQ for a blog post, from the post's `faq` frontmatter. Renders the
 * questions and the matching FAQPage JSON-LD from the one array, so the two
 * can't drift apart. */
export function BlogFaq({ faqs, url }: { faqs: BlogFaqItem[]; url: string }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${BASE_URL}${url}#faq`,
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer.map(toPlainText).join(" ") },
    })),
  };

  return (
    <>
      <h2 id="faq">FAQ</h2>
      <FaqList
        faqs={faqs.map(({ question, answer }) => ({
          question,
          answer: answer.map(renderInline),
        }))}
        name="blog-faq"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
        }}
      />
    </>
  );
}
