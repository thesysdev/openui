/* ssr entry: this section is a server component. */
import { Button } from "@/components/button";
import { Gift } from "@phosphor-icons/react/dist/ssr";
import styles from "./CloudCtaSection.module.css";
import { EarlyAccessForm } from "./EarlyAccessForm";

export function CloudCtaSection() {
  return (
    <section className={styles.section} aria-labelledby="cloud-cta-title">
      <div className={styles.inner}>
        <div className={styles.copy}>
          {/* Above the title rather than under the field: the offer is the
              reason to read the line below it, not a footnote to the form. */}
          <p className={styles.offer}>
            <Gift aria-hidden="true" className={styles.offerIcon} size={15} weight="bold" />
            Free during early access.
          </p>
          <h2 id="cloud-cta-title" className={styles.title}>
            See your agent through your users’ eyes
          </h2>
        </div>
        {/* The same capture as the hero, so the page opens and closes on the
            one action. */}
        <div className={styles.actions}>
          <EarlyAccessForm />
          {/* The same tertiary button the trust section uses for its own link. */}
          <Button href="/pricing" text="View pricing" variant="tertiary" />
        </div>
      </div>
    </section>
  );
}
