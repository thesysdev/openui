import { ArrowUpRight, ChartLineUp, DownloadSimple } from "@phosphor-icons/react/dist/ssr";

import styles from "./model-release-cards.module.css";

export function ModelReleaseCards() {
  return (
    <section className={styles.grid} aria-label="OUI-1 release resources">
      <a
        className={`${styles.card} ${styles.primary}`}
        href="https://huggingface.co/thesysdev/OUI-1"
        target="_blank"
        rel="noreferrer noopener"
      >
        <div className={styles.topline}>
          <span className={styles.eyebrow}>
            <span className={styles.dot} aria-hidden="true" />
            Model release
          </span>
          <span className={styles.external} aria-hidden="true">
            <ArrowUpRight size={16} weight="bold" />
          </span>
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>Get OUI-1</h3>
          <p className={styles.description}>Download the open-weight model from Hugging Face.</p>
          <span className={styles.meta}>26B parameters · 4B active · FP8</span>
          <span className={styles.cta}>
            <DownloadSimple size={16} weight="bold" aria-hidden="true" />
            View model weights
          </span>
        </div>
      </a>

      <a
        className={`${styles.card} ${styles.secondary}`}
        href="https://github.com/thesysdev/Generative-ui-bench"
        target="_blank"
        rel="noreferrer noopener"
      >
        <div className={styles.topline}>
          <span className={styles.eyebrow}>
            <span className={styles.dot} aria-hidden="true" />
            Open evaluation
          </span>
          <span className={styles.external} aria-hidden="true">
            <ArrowUpRight size={16} weight="bold" />
          </span>
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>Explore the benchmark</h3>
          <p className={styles.description}>
            Review the scoring code and raw generations on GitHub.
          </p>
          <span className={styles.meta}>71.7% Generative UI Benchmark</span>
          <span className={styles.cta}>
            <ChartLineUp size={16} weight="bold" aria-hidden="true" />
            View benchmark
          </span>
        </div>
      </a>
    </section>
  );
}
