import Image from "next/image";
import type { CSSProperties } from "react";
import styles from "./LogoStrip.module.css";

type Logo = {
  src: string;
  alt: string;
  href?: string;
  /* Optical size applied to layout dimensions, not a visual-only transform. */
  scale?: number;
  /* Horizontal artwork bounds within the original 160 × 48 SVG canvas. */
  bounds?: readonly [number, number];
  /* Backed by Y Combinator: shows the orange YC badge beside the mark. */
  yc?: boolean;
};

const HOME_LOGOS: Logo[] = [
  {
    src: "/logos/walt-disney.svg",
    bounds: [10, 150],
    scale: 0.78,
    alt: "The Walt Disney Company",
    href: "https://thewaltdisneycompany.com/",
  },
  {
    src: "/logos/walmart.svg",
    bounds: [20, 140],
    scale: 0.94,
    alt: "Walmart",
    href: "https://www.walmart.com/",
  },
  { src: "/logos/oodle.svg", bounds: [25, 134], alt: "Oodle AI", href: "https://www.oodle.ai/" },
  {
    src: "/logos/ebay.svg",
    bounds: [42, 118],
    scale: 0.94,
    alt: "eBay",
    href: "https://www.ebay.com/",
  },
  {
    src: "/logos/accenture.svg",
    bounds: [23, 137],
    scale: 0.9,
    alt: "Accenture",
    href: "https://www.accenture.com/",
  },
  {
    src: "/logos/palo-alto-networks.svg",
    bounds: [10, 150],
    scale: 0.92,
    alt: "Palo Alto Networks",
    href: "https://www.paloaltonetworks.com/",
  },
  {
    src: "/logos/standard-metrics.svg",
    bounds: [7, 155],
    alt: "Standard Metrics",
    href: "https://standardmetrics.io/",
  },
  {
    src: "/logos/softbank.svg",
    bounds: [10, 150],
    scale: 0.9,
    alt: "SoftBank",
    href: "https://group.softbank/en",
  },
  {
    src: "/logos/experian.svg",
    bounds: [30, 130],
    alt: "Experian",
    href: "https://www.experian.com/",
  },
  {
    src: "/logos/entelligence.svg",
    bounds: [7, 152],
    alt: "Entelligence AI",
    href: "https://entelligence.ai/",
  },
  {
    src: "/logos/charles-schwab.svg",
    bounds: [50, 110],
    scale: 1.06,
    alt: "Charles Schwab",
    href: "https://www.schwab.com/",
  },
  {
    src: "/logos/payflow.svg",
    bounds: [13, 147],
    scale: 0.95,
    alt: "Payflow",
    href: "https://payflow.es/",
    yc: true,
  },
  {
    src: "/logos/zillow.svg",
    bounds: [20, 140],
    scale: 0.84,
    alt: "Zillow",
    href: "https://www.zillow.com/",
  },
  {
    src: "/logos/andfacts.svg",
    bounds: [44, 117],
    alt: "&facts",
    href: "https://www.andfacts.com/",
  },
  {
    src: "/logos/td-ameritrade.svg",
    bounds: [13, 147],
    scale: 0.88,
    alt: "TD Ameritrade",
    href: "https://www.tdameritrade.com/",
  },
  {
    src: "/logos/paytm.svg",
    bounds: [35, 125],
    scale: 0.76,
    alt: "Paytm",
    href: "https://paytm.com/",
  },
  {
    src: "/logos/gaia.svg",
    bounds: [30, 125],
    scale: 0.92,
    alt: "GAIA",
    href: "https://heygaia.io/",
  },
  {
    src: "/logos/aia.svg",
    bounds: [46, 114],
    scale: 0.78,
    alt: "AIA Singapore",
    href: "https://www.aia.com.sg/",
  },
  {
    src: "/logos/prox.svg",
    bounds: [36, 124],
    alt: "Prox",
    href: "https://useprox.com/",
    yc: true,
  },
  {
    src: "/logos/rasa.svg",
    bounds: [43, 117],
    scale: 0.84,
    alt: "Rasa",
    href: "https://rasa.com/",
  },
  {
    src: "/logos/productboard.svg",
    bounds: [7, 146],
    alt: "Productboard",
    href: "https://productboard.com/",
  },
];

const CLOUD_LOGOS: Logo[] = [
  { src: "/logos/entelligence.svg", alt: "Entelligence" },
  { src: "/logos/pointlabs.svg", alt: "Pointlabs" },
  { src: "/logos/wisdom.svg", alt: "Wisdom" },
  { src: "/logos/mili.svg", alt: "Mili" },
  { src: "/logos/ficell-labs.svg", alt: "Ficell Labs" },
];

/* The track holds SETS copies of the logo list and animates by -50%, so the
   second half must mirror the first exactly for a seamless loop. */
const SETS = 4;

/* Seconds one logo takes to cross, so the strip keeps the same pace however
   many logos it holds. */
const SECONDS_PER_LOGO = 9;

export function LogoStrip({
  variant = "home",
  title,
}: {
  variant?: "home" | "cloud";
  title?: string;
}) {
  const logos = variant === "cloud" ? CLOUD_LOGOS : HOME_LOGOS;
  /* Home splits its list across two rows that drift the same way, the second
     shifted half a logo so the marks sit staggered like a honeycomb.
     Alternating picks keep big brands and startups mixed in both. */
  const rows =
    variant === "cloud"
      ? [logos]
      : [logos.filter((_, i) => i % 2 === 0), logos.filter((_, i) => i % 2 === 1)];

  return (
    <section
      className={`${styles.section} ${variant === "home" ? styles.opticalStrip : ""}`}
      aria-label="Customers using OpenUI"
    >
      {title ? <h3 className={styles.title}>{title}</h3> : null}
      <div className={styles.inner}>
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`${styles.marquee} ${rowIndex % 2 ? styles.offsetRow : ""}`}
          >
            <div
              className={styles.track}
              // The second row runs a touch slower, so the rows drift apart
              // instead of moving in lockstep.
              style={{
                animationDuration: `${row.length * SECONDS_PER_LOGO * (rowIndex % 2 ? 1.12 : 1)}s`,
              }}
            >
              {Array.from({ length: SETS }, (_, set) =>
                row.map((logo) => {
                  const image = (
                    <span
                      className={styles.mark}
                      style={
                        {
                          "--logo-scale": logo.scale ?? 1,
                          "--artwork-width":
                            ((logo.bounds?.[1] ?? 160) - (logo.bounds?.[0] ?? 0)) / 48,
                          "--artwork-left": (logo.bounds?.[0] ?? 0) / 48,
                        } as CSSProperties
                      }
                    >
                      <span className={styles.artwork}>
                        <Image
                          className={styles.logo}
                          src={logo.src}
                          alt={logo.alt}
                          aria-hidden={set === 0 ? undefined : true}
                          width={160}
                          height={48}
                          loading="lazy"
                        />
                      </span>
                      {logo.yc ? (
                        <span className={styles.yc} title="Backed by Y Combinator">
                          <svg viewBox="0 0 16 16" aria-hidden="true">
                            <rect width="16" height="16" rx="3" fill="#F26522" />
                            <path
                              d="M7.1 9.1 4.6 4.4h1.5l1.9 3.7 1.9-3.7h1.5L8.9 9.1v2.5H7.1z"
                              fill="#fff"
                            />
                          </svg>
                        </span>
                      ) : null}
                    </span>
                  );

                  return logo.href ? (
                    <a
                      key={`${set}-${logo.src}`}
                      className={styles.card}
                      href={logo.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-hidden={set > 0 || undefined}
                      tabIndex={set > 0 ? -1 : undefined}
                    >
                      {image}
                    </a>
                  ) : (
                    <span
                      key={`${set}-${logo.src}`}
                      className={styles.card}
                      aria-hidden={set > 0 || undefined}
                    >
                      {image}
                    </span>
                  );
                }),
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
