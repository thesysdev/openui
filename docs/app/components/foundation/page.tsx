import styles from "./page.module.css";

export default function FoundationPage() {
  return (
    <div className={styles.introPage}>
      <h1 className={styles.title}>Foundation</h1>
      <p className={styles.description}>
        The foundation layer defines the core visual language of OpenUI. These tokens &mdash;
        colors, spacing, typography, radius, and shadows &mdash; ensure every component shares a
        consistent look and feel across themes and modes.
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Design tokens</h2>
        <p className={styles.sectionBody}>
          Every value in the system is expressed as a CSS custom property. This means you can
          override any token at any scope &mdash; globally, per section, or per component &mdash;
          without touching component code.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Theming</h2>
        <p className={styles.sectionBody}>
          OpenUI ships with light and dark modes built in. Switch modes or layer your own palette by
          reassigning the token values in the Theme Builder.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Explore</h2>
        <p className={styles.sectionBody}>
          Use the sidebar to browse each token category. Every page includes live previews so you
          can see exactly how tokens render in context.
        </p>
      </section>
    </div>
  );
}
