import { GatewayPlans } from "./GatewayPlans";
import styles from "./sections.module.css";

export function PricingSection() {
  return (
    <div className={styles.pricingBand}>
      <section
        className={`${styles.section} ${styles.pricingSection}`}
        aria-labelledby="gateway-pricing"
      >
        <div className={styles.sectionLockup}>
          <div>
            <h2 id="gateway-pricing" className={styles.heading}>
              Built to scale
              <br />
              with your usage
            </h2>
          </div>
          <p className={styles.lead}>
            Plans start free. Each response uses one API call plus LLM tokens at provider rates,
            with corrections included.
          </p>
        </div>
        <div className={styles.diagram}>
          <GatewayPlans detailed />
        </div>
        {/* Restore the shared <LogoStrip variant="cloud" /> here after Rabi confirms
            which Gateway customer logos are approved for public use. */}
      </section>
    </div>
  );
}
