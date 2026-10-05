import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import styles from "./showcase.module.css";

export type CardLinkItem = { label: string; href: string; external?: boolean };

/** A card with a light/dark screenshot, used for featured projects and demos. */
export type ShowcaseItem = {
  name: string;
  tagline: string;
  description: string;
  image: { light: string; dark: string };
  links: CardLinkItem[];
};

/** A text-only card, used for community projects, chat conversations, and tools. */
export type LinkCardItem = {
  name: string;
  description: string;
  tag?: string;
  links: CardLinkItem[];
};

export function CardLink({ label, href, external }: CardLinkItem) {
  if (external) {
    return (
      <a className={styles.cardLink} href={href} target="_blank" rel="noopener noreferrer">
        {label}
        <ArrowUpRight aria-hidden className={styles.cardLinkIcon} />
      </a>
    );
  }

  return (
    <Link className={styles.cardLink} href={href}>
      {label}
    </Link>
  );
}

export function ShowcaseGrid({ items }: { items: ShowcaseItem[] }) {
  return (
    <div className={styles.featuredGrid}>
      {items.map((item) => (
        <article key={item.name} className={styles.featuredCard}>
          <div className={styles.featuredMedia}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.imageLight} src={item.image.light} alt="" loading="lazy" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.imageDark} src={item.image.dark} alt="" loading="lazy" />
          </div>
          <div className={styles.featuredBody}>
            <span className={styles.eyebrow}>{item.tagline}</span>
            <h3 className={styles.cardTitle}>{item.name}</h3>
            <p className={styles.cardDescription}>{item.description}</p>
            <div className={styles.cardLinks}>
              {item.links.map((link) => (
                <CardLink key={link.label} {...link} />
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function LinkCardGrid({ items }: { items: LinkCardItem[] }) {
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <article key={item.name} className={styles.card}>
          <div className={styles.cardHeader}>
            <h4 className={styles.cardTitle}>{item.name}</h4>
            {item.tag ? <span className={styles.tag}>{item.tag}</span> : null}
          </div>
          <p className={styles.cardDescription}>{item.description}</p>
          <div className={styles.cardLinks}>
            {item.links.map((link) => (
              <CardLink key={link.label} {...link} />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
