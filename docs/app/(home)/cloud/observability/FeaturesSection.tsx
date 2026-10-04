import Image from "next/image";
import type { ReactNode } from "react";
import { FadedDither } from "../../components/FadedDither/FadedDither";
import { SectionHeader } from "../../components/SectionHeader/SectionHeader";
import styles from "./FeaturesSection.module.css";

/* No docs to point at yet, so the copy column ends at the body text. Cloud's
   version closes with a "Read docs" button; add it back per feature once each
   has somewhere to go. */
function FeatureCopy({
  title,
  headline,
  description,
}: {
  title: string;
  headline: ReactNode;
  description: string;
}) {
  return (
    <div className={styles.content}>
      <div className={styles.headingGroup}>
        <h2 className={styles.primaryHeading}>{title}</h2>
        <p className={styles.secondaryHeading}>{headline}</p>
      </div>
      <div className={styles.bodyGroup}>
        <p className={styles.body}>{description}</p>
      </div>
    </div>
  );
}

/* High-density Figma exports, losslessly compressed as WebP. Intrinsic dimensions
   reserve space while the responsive slots keep the UI's focal content visible. */
function FeatureShot({ shot, alt }: { shot?: string; alt: string }) {
  /* PLACEHOLDER — a step whose art has not been made yet. Dashed rather than a
     filled panel so it reads as missing rather than as a design choice, and
     sized to the same 720x400 slot so the layout does not move when the real
     pair lands. */
  if (!shot) {
    return (
      <div className={styles.shotPlaceholder} aria-hidden="true">
        <p className={styles.shotPlaceholderLabel}>{alt}</p>
      </div>
    );
  }

  const focalClass =
    shot === "session-replay"
      ? styles.featureImageSessionReplay
      : shot.startsWith("triage")
        ? styles.featureImageTriage
        : shot.startsWith("evals")
          ? styles.featureImageEvals
          : "";
  const imageHeight = shot === "session-replay" ? 1804 : 1600;

  return (
    /* Shader behind, artwork on top, the same three-layer stage the home page's
       product bands use. The shots carry a transparent margin, so the texture
       reads around them. band="light" because these cards sit straight on the
       page, which is white on a light theme and black on a dark one. */
    <div className={styles.shot}>
      <FadedDither band="light" className={styles.shotShader} />
      <span className={styles.featureImageWide}>
        <Image
          className={`${styles.featureImage} ${styles.featureImageLight} ${focalClass}`.trim()}
          src={`/openui-observability/${shot}-light.webp`}
          alt={alt}
          width={2880}
          height={imageHeight}
          quality={95}
          unoptimized
          sizes="720px"
        />
        <Image
          className={`${styles.featureImage} ${styles.featureImageDark} ${focalClass}`.trim()}
          src={`/openui-observability/${shot}-dark.webp`}
          alt=""
          aria-hidden="true"
          width={2880}
          height={imageHeight}
          quality={95}
          unoptimized
          sizes="720px"
        />
      </span>
      <span className={styles.featureImageCompact}>
        <Image
          className={`${styles.featureImage} ${styles.featureImageLight}`}
          src={`/openui-observability/${shot}-mobile-light.webp`}
          alt={alt}
          width={720}
          height={600}
          quality={95}
          unoptimized
          sizes="calc(100vw - 32px)"
        />
        <Image
          className={`${styles.featureImage} ${styles.featureImageDark}`}
          src={`/openui-observability/${shot}-mobile-dark.webp`}
          alt=""
          aria-hidden="true"
          width={720}
          height={600}
          quality={95}
          unoptimized
          sizes="calc(100vw - 32px)"
        />
      </span>
    </div>
  );
}

type Feature = {
  title: string;
  headline: ReactNode;
  description: string;
  /* Basename under /public/openui-observability/, which the light and dark
     files hang off. Omitted while a step's art is still to be made. */
  shot?: string;
};

/* One loop, in order: see it, find the ones worth seeing, mark what is wrong,
   stop it recurring, then decide what to build next. Read as steps rather than
   capabilities, so each one hands to the next.

   Timeline is folded into step one, since following the journey is part of
   seeing what the user saw rather than a separate screen. Insights used to be
   folded into Triage on the same reasoning, but the two answer different
   questions: Triage is which session to open, Insights is what recurs across
   all of them, so it closes the loop instead of sitting inside step two. */
const FEATURES: Feature[] = [
  {
    title: "Session replay",
    shot: "session-replay",
    headline: (
      <>
        Understand every
        <br />
        user session
      </>
    ),
    description: "Replay the exact interface, responses, and interactions each user experienced.",
  },
  {
    title: "Triage",
    shot: "triage-figma",
    headline: (
      <>
        Discover sessions
        <br />
        worth investigating
      </>
    ),
    description:
      "Surface failed journeys, unmet needs, and high-impact issues to understand where users struggle.",
  },
  {
    title: "Annotations",
    shot: "annotations",
    headline: (
      <>
        Turn bad responses
        <br />
        into feedback
      </>
    ),
    description: "Mark the broken response, add context, and share the session with your team.",
  },
  {
    title: "Evals",
    shot: "evals-figma",
    headline: (
      <>
        Prevent the same
        <br />
        issue twice
      </>
    ),
    description: "Turn production failures into evals that catch regressions before release.",
  },
  {
    title: "Insights",
    shot: "insights",
    headline: (
      <>
        Discover what to
        <br />
        build next
      </>
    ),
    description: "Aggregate demand across every session to see which needs recur and how often.",
  },
];

export function FeaturesSection() {
  return (
    <section className={styles.section} aria-labelledby="observability-features">
      <header className={styles.header}>
        <SectionHeader
          titleId="observability-features"
          title="Product analytics for AI agents"
          subtitle="that goes beyond traces"
          caption={
            <>
              Connect each response to what users saw, <br className={styles.captionBreak} />
              what they did, and whether it met their needs.
            </>
          }
        />
      </header>
      <div className={styles.featureList}>
        {FEATURES.map((feature, index) => (
          /* Alternating sides, as on Cloud: art leads the odd cards, copy the
             even ones, so the page does not read as one column. */
          <article key={feature.title} className={styles.card}>
            {index % 2 === 0 ? (
              <>
                <FeatureShot shot={feature.shot} alt={`${feature.title} in OpenUI Observability`} />
                <FeatureCopy {...feature} />
              </>
            ) : (
              <>
                <FeatureCopy {...feature} />
                <FeatureShot shot={feature.shot} alt={`${feature.title} in OpenUI Observability`} />
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
