/* ssr entry: this is a server component now that the grid's accordion is gone. */
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { BevelButton } from "../../components/Button/BevelButton";
import { SectionHeader } from "../../components/SectionHeader/SectionHeader";
import { ProductLabel, ProductSection } from "../ProductSection/ProductSection";
import { GATEWAY_PRODUCT } from "../ProductSection/products";
import styles from "./CloudSection.module.css";

export const CLOUD_SECTION_ID = "openui-cloud";

export function CloudSection() {
  return (
    <section id={CLOUD_SECTION_ID} className={styles.section} aria-labelledby="openui-cloud-title">
      <div className={styles.inner}>
        <div className={styles.contact}>
          <ProductLabel name="OpenUI" tag="Cloud" />
          <div className={styles.contactHeading}>
            <SectionHeader
              titleId="openui-cloud-title"
              title="Production reliability"
              subtitle="and user insights"
              tone="dark"
            />
          </div>
        </div>

        {/* Wrapped rather than spaced by the bands themselves: .header and
            .contact already supply the outer margins, so only the gap between
            the two needs stating, and ProductSection stays free of layout it
            would carry into every other place it is used. */}
        <div className={styles.products}>
          <ProductSection {...GATEWAY_PRODUCT} />
        </div>

        <div id="openui-observability-card" className={styles.observabilityBand}>
          <div className={styles.observabilityCopy}>
            <div className={styles.observabilityLead}>
              <ProductLabel
                name="OpenUI"
                tag="Observability"
                className={styles.observabilityEyebrow}
              />
              <h3 className={styles.observabilityTitle}>
                User analytics
                <br />
                for AI agents
              </h3>
              <BevelButton
                className={styles.observabilityCta}
                variant="primary"
                href="/cloud/observability"
                label="Join waitlist"
                badge={<ArrowRight size={16} weight="bold" />}
              />
            </div>
            <p className={styles.observabilityDescription}>
              See where users drop off, what they struggle with, and what they ask for. Know what to
              fix and what to build next.
            </p>
          </div>
          <div
            className={styles.observabilityStage}
            role="img"
            aria-label="OpenUI Observability session replay showing the exact generated interface and user interactions"
          >
            <Image
              className={`${styles.observabilityImage} ${styles.observabilityImageLight}`}
              src="/openui-observability/session-replay-light.webp"
              alt=""
              aria-hidden="true"
              width={2880}
              height={1804}
              quality={95}
              unoptimized
              sizes="(max-width: 1023px) calc(100vw - 80px), 520px"
            />
            <Image
              className={`${styles.observabilityImage} ${styles.observabilityImageDark}`}
              src="/openui-observability/session-replay-dark.webp"
              alt=""
              aria-hidden="true"
              width={2880}
              height={1804}
              quality={95}
              unoptimized
              sizes="(max-width: 1023px) calc(100vw - 80px), 520px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
