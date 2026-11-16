"use client";

import buttonStyles from "@/app/(home)/components/Button/Button.module.css";
import { BUILD_CTA_ENABLED, captureGalleryEvent } from "@/lib/demo-gallery-analytics";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { RunLocally } from "./run-locally";
import styles from "./showcase.module.css";

export type CardLinkItem = { label: string; href: string; external?: boolean; demoId?: string };

/** A card with a light/dark screenshot, used for featured projects and demos. */
export type ShowcaseItem = {
  name: string;
  tagline: string;
  description: string;
  image?: { light: string; dark: string };
  links: CardLinkItem[];
  demoId?: string;
  templateRepo?: string;
};

/** A text-only card, used for community projects, chat conversations, and tools. */
export type LinkCardItem = {
  name: string;
  description: string;
  tag?: string;
  featured?: boolean;
  links: CardLinkItem[];
};

/* The link a whole card opens: the demo or website when there is one, else the
   first link (usually GitHub). */
function primaryIndex(links: CardLinkItem[]) {
  const site = links.findIndex(
    (link) => !/github/i.test(link.label) && !/github\.com/.test(link.href),
  );
  return site >= 0 ? site : 0;
}

export function CardLink({
  label,
  href,
  external,
  stretched = false,
  demoId,
}: CardLinkItem & { stretched?: boolean }) {
  // A stretched link's hit area covers the whole card (see .cardStretch).
  const sourceLink = href.startsWith("https://github.com/");
  const baseClass =
    demoId && !sourceLink
      ? `${styles.demoAction} ${buttonStyles.pillBase} ${buttonStyles.pillSecondary}`
      : styles.cardLink;
  const className = stretched ? `${baseClass} ${styles.cardStretch}` : baseClass;
  const onClick = () => {
    if (demoId)
      captureGalleryEvent(
        "demo:cta_clicked",
        demoId,
        href.includes("github.com") ? "source" : "demo",
      );
  };
  if (external) {
    return (
      <a
        className={className}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
      >
        {label}
        {!demoId && <ArrowUpRight aria-hidden className={styles.cardLinkIcon} />}
      </a>
    );
  }

  return (
    <Link className={className} href={href} onClick={onClick}>
      {label}
    </Link>
  );
}

export function ShowcaseGrid({
  items,
  clickable = false,
}: {
  items: ShowcaseItem[];
  /* Make the whole card open its main link, not just the link text. */
  clickable?: boolean;
}) {
  return (
    <div className={styles.featuredGrid}>
      {items.map((item) => (
        <article
          key={item.name}
          className={`${styles.featuredCard} ${item.demoId ? styles.demoCard : ""} ${clickable ? styles.cardClickable : ""}`.trim()}
        >
          {item.image && (
            <div className={styles.featuredMedia}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.imageLight}
                src={item.image.light}
                alt={item.name}
                loading="lazy"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.imageDark}
                src={item.image.dark}
                alt={item.name}
                loading="lazy"
              />
            </div>
          )}
          <div className={styles.featuredBody}>
            {!item.demoId && <span className={styles.eyebrow}>{item.tagline}</span>}
            <h3 className={styles.cardTitle}>{item.name}</h3>
            <p className={styles.cardDescription}>{item.description}</p>
            <div className={styles.cardLinks}>
              {item.links.map((link, i) => (
                <CardLink
                  key={link.label}
                  {...link}
                  demoId={item.demoId}
                  stretched={clickable && i === primaryIndex(item.links)}
                />
              ))}
              {item.templateRepo &&
                (BUILD_CTA_ENABLED ? (
                  <RunLocally
                    title={item.name}
                    name={`repo:${item.templateRepo}`}
                    label="Use template"
                    demoId={item.demoId}
                  />
                ) : (
                  <CardLink
                    label="Source"
                    href={`https://github.com/${item.templateRepo}`}
                    external
                    demoId={item.demoId}
                  />
                ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

/** A card's tags in one row; empty entries are skipped and "Featured" is highlighted. */
export function CardTags({
  tags,
  className,
}: {
  tags: (string | null | undefined)[];
  className?: string;
}) {
  const shown = tags.filter((tag): tag is string => Boolean(tag));
  if (shown.length === 0) return null;
  return (
    <span className={`${styles.tags} ${className ?? ""}`.trim()}>
      {shown.map((tag) => (
        <span
          key={tag}
          className={`${styles.tag} ${tag === "Featured" ? styles.featuredTag : ""}`.trim()}
        >
          {tag}
        </span>
      ))}
    </span>
  );
}

export function LinkCardGrid({
  items,
  clickable = false,
}: {
  items: LinkCardItem[];
  /* Make the whole card open its main link, not just the link text. */
  clickable?: boolean;
}) {
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <article
          key={item.name}
          className={`${styles.card} ${clickable ? styles.cardClickable : ""}`.trim()}
        >
          <div className={styles.cardHeader}>
            <h4 className={styles.cardTitle}>{item.name}</h4>
            <CardTags tags={[item.featured ? "Featured" : null, item.tag]} />
          </div>
          <p className={styles.cardDescription}>{item.description}</p>
          <div className={styles.cardLinks}>
            {item.links.map((link, i) => (
              <CardLink
                key={link.label}
                {...link}
                stretched={clickable && i === primaryIndex(item.links)}
              />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
