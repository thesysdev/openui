import styles from "./CloudCtaSection.module.css";
import { EarlyAccessForm } from "./EarlyAccessForm";

export function CloudCtaSection() {
  return (
    <section className={styles.section} aria-labelledby="cloud-cta-title">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h2 id="cloud-cta-title" className={styles.title}>
            See your agent through your users’ eyes
          </h2>
          <p className={styles.note}>See what works, what’s missing, and what to build next.</p>
        </div>
        {/* The same capture as the hero, so the page opens and closes on the
            one action. */}
        <div className={styles.actions}>
          <h3 className={styles.formTitle}>Join waitlist</h3>
          <EarlyAccessForm />
          <p className={styles.accessNote}>
            <strong>Free during early access.</strong>{" "}
            <a className={styles.pricingLink} href="/pricing">
              View pricing
            </a>
          </p>
        </div>
      </div>
      <div className={styles.separator} aria-hidden="true" />
    </section>
  );
}
