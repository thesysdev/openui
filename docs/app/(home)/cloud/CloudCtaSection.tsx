import { ArrowUpRight } from "lucide-react";
import { BevelButton } from "../components/Button/BevelButton";
import styles from "./CloudCtaSection.module.css";

interface CtaAction {
  label: string;
  href: string;
  external?: boolean;
}

export function CloudCtaSection({
  title = "Turn your OpenUI application into a production-grade experience.",
  primary = { label: "Get API key", href: "https://console.thesys.dev/keys", external: true },
  secondary = { label: "Book a demo", href: "https://zcal.co/t/thesys/demo", external: true },
}: {
  title?: string;
  primary?: CtaAction;
  secondary?: CtaAction;
} = {}) {
  return (
    <section className={styles.section} aria-labelledby="cloud-cta-title">
      <div className={styles.inner}>
        <h2 id="cloud-cta-title" className={styles.title}>
          {title}
        </h2>
        <div className={styles.actions}>
          <BevelButton
            href={primary.href}
            external={primary.external}
            variant="primary"
            label={primary.label}
            badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
          />
          <BevelButton
            href={secondary.href}
            external={secondary.external}
            variant="secondary"
            label={secondary.label}
            badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
          />
        </div>
      </div>
      <div className={styles.separator} aria-hidden="true" />
    </section>
  );
}
