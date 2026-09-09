/* Icons come from the ssr entry so this stays a server component; the type
   comes from the main entry, which is the only one that exports it. A
   type-only import is erased at build, so it pulls in no client code. */
import type { Icon } from "@phosphor-icons/react";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { BevelButton } from "../../components/Button/BevelButton";
import styles from "./ProductSection.module.css";

export type ProductCard = {
  Icon: Icon;
  title: string;
  description: string;
};

/** Shared OpenUI wordmark and outlined product-name chip. */
export function ProductLabel({
  name,
  tag,
  className,
}: {
  name: string;
  tag?: string;
  className?: string;
}) {
  return (
    <p className={`${styles.eyebrow} ${className ?? ""}`.trim()}>
      {name}
      {tag ? (
        <>
          {" "}
          <span className={styles.eyebrowTag}>{tag}</span>
        </>
      ) : null}
    </p>
  );
}

export type ProductSectionProps = {
  /* Product name, and an optional chip beside it: "OpenUI Lang" + "Open
     Source". Omit the tag for a band that needs no qualifier. */
  name: string;
  tag?: string;
  headline: ReactNode;
  description: string;
  /* Optional: a band with nothing to try yet shows only the docs link. */
  primaryCta?: { label: string; href: string; external?: true };
  secondaryCta: { label: string; href: string; external?: true };
  /* "light" sits on the page background and follows the site theme. "dark" sits
     on the black Cloud band, which is black on either theme, so its buttons use
     the theme-independent variants instead of the adaptive ones. */
  tone?: "light" | "dark";
  /* Basename under /public, which -light and -dark hang off. Until the artwork
     exists the stage renders its brief instead, at the same aspect ratio, so
     dropping the images in later changes nothing about the layout. */
  shot?: string;
  /* A code-native illustration can replace the image pair while retaining the
     same stage, spacing and responsive behaviour. */
  art?: ReactNode;
  /* Let artwork that already includes its own frame crop directly to the
     section bounds instead of nesting it inside the shared inset stage. */
  fullBleedArt?: boolean;
  /* Optional artwork-specific ratios. Desktop exports can stay canonical;
     mobile uses a controlled center crop instead of squeezing the frame. */
  stageAspectRatio?: string;
  stageMobileAspectRatio?: string;
  cards: ProductCard[];
};

/* One product band: a split lockup, two calls to action, a wide visual, then
   the capabilities as a row of cards.
 *
 * Deliberately one component rather than three copies. Lang, Gateway and
 * Observability differ only in copy and tone, and a shared shape is what makes
 * them read as three of the same thing rather than three separate pitches.
 */
export function ProductSection({
  name,
  tag,
  headline,
  description,
  primaryCta,
  secondaryCta,
  tone = "light",
  shot,
  art,
  fullBleedArt = false,
  stageAspectRatio,
  stageMobileAspectRatio,
  cards,
}: ProductSectionProps) {
  const primaryVariant = tone === "dark" ? "light" : "primary";
  const secondaryVariant = tone === "dark" ? "dark" : "secondary";

  return (
    <section className={`${styles.product} ${tone === "dark" ? styles.onDark : ""}`.trim()}>
      <div className={styles.lockup}>
        <div className={styles.lead}>
          <ProductLabel name={name} tag={tag} />
          <h3 className={styles.headline}>{headline}</h3>
          <div className={styles.ctas}>
            {primaryCta && (
              <BevelButton
                className={styles.primaryCta}
                variant={primaryVariant}
                href={primaryCta.href}
                label={primaryCta.label}
                external={primaryCta.external}
                badge={
                  primaryCta.external ? (
                    <ArrowUpRight size={16} weight="bold" />
                  ) : (
                    <ArrowRight size={16} weight="bold" />
                  )
                }
              />
            )}
            <BevelButton
              className={styles.secondaryCta}
              variant={secondaryVariant}
              href={secondaryCta.href}
              label={secondaryCta.label}
              external={secondaryCta.external}
              badge={
                secondaryCta.external ? (
                  <ArrowUpRight size={16} weight="bold" />
                ) : (
                  <ArrowRight size={16} weight="bold" />
                )
              }
            />
          </div>
        </div>
        {/* Opposite the headline on desktop, beneath it on a phone: the same
            split the page hero uses. */}
        <p className={styles.description}>{description}</p>
      </div>

      <div
        className={`${styles.stage} ${fullBleedArt ? styles.stageFullBleed : ""}`.trim()}
        style={
          {
            "--product-stage-aspect": stageAspectRatio,
            "--product-stage-mobile-aspect": stageMobileAspectRatio,
          } as CSSProperties
        }
      >
        {art ??
          (shot ? (
            <>
              <Image
                className={`${styles.stageImage} ${styles.stageLight}`}
                src={`${shot}-light.webp`}
                alt=""
                aria-hidden="true"
                width={1280}
                height={720}
                loading="lazy"
              />
              <Image
                className={`${styles.stageImage} ${styles.stageDark}`}
                src={`${shot}-dark.webp`}
                alt=""
                aria-hidden="true"
                width={1280}
                height={720}
                loading="lazy"
              />
            </>
          ) : null)}
      </div>

      {cards.length > 0 && (
        <div className={styles.cards}>
          {cards.map(({ Icon: CardIcon, title, description: cardCopy }) => (
            <div className={styles.card} key={title}>
              <span className={styles.cardIcon} aria-hidden="true">
                <CardIcon size={20} weight="light" />
              </span>
              <div className={styles.cardCopy}>
                <h4 className={styles.cardTitle}>{title}</h4>
                <p className={styles.cardDescription}>{cardCopy}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
