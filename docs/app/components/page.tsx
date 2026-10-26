import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <h1 className={styles.heroTitle}>
          OpenUI <span className={styles.heroTitleLight}>Design System</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Purpose made for Generative UI.
          <br />
          Built to be scaleable.
          <br />
          Designed with precision and craft.
        </p>
        <div className={`${styles.placeholder} ${styles.heroImage}`}>Image placeholder</div>
      </section>

      <section className={styles.yellowSection}>
        <h2 className={styles.yellowHeading}>So why another design system?</h2>
        <div className={styles.yellowColumns}>
          <p className={styles.yellowBody}>
            The caf&eacute; on the corner never seemed busy, yet it was never empty either. People
            drifted in like thoughts you couldn&rsquo;t quite finish&mdash;quiet students with open
            laptops, retirees lingering over tiny cups of coffee, a courier who always arrived at
            precisely 10:17. Outside, traffic pulsed in uneven waves, but inside the air felt
            suspended, as if time had agreed to slow down just enough for everyone to catch their
            breath.
          </p>
          <p className={styles.yellowBody}>
            The caf&eacute; on the corner never seemed busy, yet it was never empty either. People
            drifted in like thoughts you couldn&rsquo;t quite finish&mdash;quiet students with open
            laptops, retirees lingering over tiny cups of coffee.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How to use it?</h2>
        <div className={`${styles.placeholder} ${styles.codePreview}`}>Code block preview</div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Dig deeper</h2>
        <div className={styles.cardGrid}>
          <Link href="/components/customize" className={`${styles.placeholder} ${styles.card}`}>
            Customize
          </Link>
          <Link href="/components/compose" className={`${styles.placeholder} ${styles.card}`}>
            Compose
          </Link>
          <Link href="/components/blocks" className={`${styles.placeholder} ${styles.card}`}>
            Blocks
          </Link>
          <Link href="/components/foundation" className={`${styles.placeholder} ${styles.card}`}>
            Foundation
          </Link>
          <Link href="/components/theme-builder" className={`${styles.placeholder} ${styles.card}`}>
            Theme Builder
          </Link>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
        <div className={`${styles.placeholder} ${styles.faqAccordion}`}>Accordion</div>
      </section>

      <div className={styles.footer} />
    </main>
  );
}
