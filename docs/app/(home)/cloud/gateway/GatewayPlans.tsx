"use client";

import { ArrowUpRight, Check } from "lucide-react";
import { useId, useState } from "react";
import { BevelButton } from "../../components/Button/BevelButton";
import { GATEWAY_PLANS } from "./gateway-plans";
import details from "./GatewayPlans.module.css";
import styles from "./sections.module.css";

const STRIP = ["Free models", "Zero data retention"];
const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);

function FeatureLabel({ feature }: { feature: string }) {
  const usage = feature.match(/^(3K|25K|500K)(.*)$/);

  if (!usage) return feature;

  return (
    <>
      <strong className={details.featureMetric}>{usage[1]}</strong>
      {usage[2]}
    </>
  );
}

/** Same plans, billing control, and card styling on both pricing surfaces. */
export function GatewayPlans({ detailed = false }: { detailed?: boolean }) {
  const [annualBilling, setAnnualBilling] = useState(true);
  const id = useId();

  return (
    <div className={detailed ? details.detailed : undefined}>
      <div className={styles.pricingToolbar}>
        <div className={styles.pricingControls}>
          <button
            className={styles.billingToggle}
            type="button"
            role="switch"
            aria-label="Annual billing"
            aria-checked={annualBilling}
            onClick={() => setAnnualBilling((current) => !current)}
          >
            <span className={styles.billingTrack} aria-hidden="true" />
            <span>Annual billing</span>
          </button>
          <span className={styles.billingSaving}>Save up to 20%</span>
        </div>
        <ul className={styles.priceStrip}>
          {STRIP.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className={styles.pricingPanel}>
        <p className={styles.pricingCaption} aria-live="polite">
          Gateway plans.{" "}
          {annualBilling
            ? "Annual billing selected; prices shown per month."
            : "Monthly billing selected."}
        </p>
        <div className={`${styles.planGrid} ${detailed ? details.grid : ""}`}>
          {GATEWAY_PLANS.map((plan) => {
            const price = annualBilling ? plan.annualMonthly : plan.monthly;
            return (
              <article
                className={`${styles.planCard} ${detailed ? details.card : ""} ${
                  plan.recommended ? details.recommended : ""
                }`}
                key={plan.name}
                aria-labelledby={`${id}-${plan.name}`}
              >
                <div className={`${styles.planHeader} ${detailed ? details.header : ""}`}>
                  <h3
                    id={`${id}-${plan.name}`}
                    className={`${styles.planName} ${detailed ? details.name : ""}`}
                  >
                    {plan.name}
                  </h3>
                  <span className={`${styles.planPrice} ${detailed ? details.price : ""}`}>
                    {price === null ? "Custom" : price === 0 ? "$0" : `${formatPrice(price)}/mo`}
                  </span>
                  {price !== null && price > 0 ? (
                    <span className={detailed ? details.cadence : styles.pricingCaption}>
                      {annualBilling ? `${formatPrice(price * 12)} annually` : "Billed monthly"}
                    </span>
                  ) : detailed ? (
                    <span className={details.cadence} aria-hidden="true">
                      &nbsp;
                    </span>
                  ) : null}
                </div>
                {detailed ? (
                  <>
                    <ul className={details.features}>
                      <li className={details.featureIntro}>
                        <span>{plan.name === "Free" ? "Includes" : plan.features[0]}</span>
                      </li>
                      {plan.features.slice(plan.name === "Free" ? 0 : 1).map((feature) => (
                        <li key={feature}>
                          <Check size={14} strokeWidth={1.05} aria-hidden="true" />
                          <span>
                            <FeatureLabel feature={feature} />
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className={details.action}>
                      <BevelButton
                        className={details.cta}
                        href={plan.href}
                        external
                        variant={plan.recommended ? "primary" : "secondary"}
                        label={plan.cta}
                        badge={<ArrowUpRight size={16} strokeWidth={2.25} />}
                      />
                    </div>
                  </>
                ) : (
                  <dl className={styles.planFeatures}>
                    <div>
                      <dt>API calls/month</dt>
                      <dd>{plan.calls}</dd>
                    </div>
                    <div>
                      <dt>Overage</dt>
                      <dd>{plan.overage}</dd>
                    </div>
                    <div>
                      <dt>Includes</dt>
                      <dd>{plan.note}</dd>
                    </div>
                  </dl>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
