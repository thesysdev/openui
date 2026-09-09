import { Button } from "@/components/button";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  FeatureGridSection,
  type GridFeature,
} from "../sections/FeatureGridSection/FeatureGridSection";
import styles from "./FeaturesSection.module.css";

const SUPPORTING_FEATURES: GridFeature[] = [
  {
    icon: "devices",
    title: "Production grade rendering",
    description:
      "Render with production-tested, responsive components built to behave consistently across browsers, devices, and screen sizes.",
  },
  {
    icon: "interaction",
    title: "Stateful experiences",
    description:
      "Preserve conversation context, actions, user input, and interface state across multi-step experiences.",
  },
  {
    icon: "signal",
    title: "Observability",
    description:
      "Understand how models and rendered interfaces behave in production from a single operational view.",
  },
  {
    icon: "shield",
    title: "Secure by default",
    description:
      "Protect production workloads with enterprise-grade security, compliance, and data controls.",
  },
];

function FeatureCopy({
  title,
  headline,
  description,
  docsHref,
  ctaText = "Read docs",
}: {
  title: string;
  headline: ReactNode;
  description: ReactNode;
  docsHref?: string;
  ctaText?: string;
}) {
  return (
    <div className={styles.content}>
      <div className={styles.headingGroup}>
        <h2 className={styles.primaryHeading}>{title}</h2>
        <p className={styles.secondaryHeading}>{headline}</p>
      </div>
      <div className={styles.bodyGroup}>
        <p className={styles.body}>{description}</p>
        {docsHref ? <Button href={docsHref} text={ctaText} variant="tertiary" /> : null}
      </div>
    </div>
  );
}

export function CloudFeatureCard({
  image,
  imageDark,
  imageAlt,
  title,
  headline,
  description,
  docsHref,
  ctaText,
  imageFirst = true,
  unoptimized = false,
}: {
  image?: string;
  imageDark?: string;
  imageAlt?: string;
  title: string;
  headline: ReactNode;
  description: ReactNode;
  docsHref?: string;
  ctaText?: string;
  imageFirst?: boolean;
  unoptimized?: boolean;
}) {
  const artwork =
    image && imageDark ? (
      <>
        <Image
          className={`${styles.featureImage} ${styles.featureImageLight}`}
          src={image}
          alt={imageAlt ?? ""}
          width={720}
          height={400}
          unoptimized={unoptimized}
        />
        <Image
          className={`${styles.featureImage} ${styles.featureImageDark}`}
          src={imageDark}
          alt=""
          aria-hidden="true"
          width={720}
          height={400}
          unoptimized={unoptimized}
        />
      </>
    ) : (
      <div
        className={`${styles.featureImage} ${styles.featureImagePlaceholder}`}
        aria-hidden="true"
      />
    );

  const copy = (
    <FeatureCopy
      title={title}
      headline={headline}
      description={description}
      docsHref={docsHref}
      ctaText={ctaText}
    />
  );

  return (
    <article className={styles.card}>
      {imageFirst ? artwork : copy}
      {imageFirst ? copy : artwork}
    </article>
  );
}

export function FeaturesSection() {
  return (
    <>
      <section className={styles.section} aria-label="OpenUI Cloud features">
        <CloudFeatureCard
          image="/openui-cloud/validation.svg"
          imageDark="/openui-cloud/validation-dark.svg"
          imageAlt="OpenUI Cloud validating and correcting model output"
          title="Reliability"
          headline="Broken model output shouldn’t become broken UI"
          description="Every response is validated against your component library and corrected in the streaming path, not as a retry your user waits through."
          docsHref="https://www.openui.com/docs/openui-cloud/production-readiness"
        />

        <CloudFeatureCard
          image="/openui-cloud/llm-gateway.svg"
          imageDark="/openui-cloud/llm-gateway-dark.svg"
          imageAlt="OpenUI Cloud routing requests across model providers"
          title="Managed model access"
          headline={
            <>
              Every model.
              <br />
              One API.
            </>
          }
          description="Access leading models across providers through a single API. OpenUI Cloud handles fallbacks when a model or provider becomes unavailable."
          docsHref="https://www.openui.com/docs/openui-cloud/production-readiness"
          imageFirst={false}
        />

        <CloudFeatureCard
          image="/openui-cloud/reports&presentation.png?v=20260723-1444"
          imageDark="/openui-cloud/reports&presentations-dark.png"
          imageAlt="OpenUI Cloud reports and presentation artifacts"
          title="Live & Static Artifacts"
          headline="Generate more than chat responses"
          description="Turn model output into complete, polished artifacts, from interactive dashboards and reports to polished & editable presentations & reports."
          docsHref="https://www.openui.com/docs/openui-cloud/build/slides"
          unoptimized
        />
      </section>

      <div className={styles.supportingFeatures}>
        <FeatureGridSection
          features={SUPPORTING_FEATURES}
          showHeader={false}
          showCompat={false}
          showTopSeparator
          showBottomSeparator={false}
          desktopColumns={4}
        />
      </div>
    </>
  );
}
