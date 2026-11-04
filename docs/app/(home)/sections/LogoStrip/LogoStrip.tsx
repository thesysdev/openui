import Image from "next/image";
import styles from "./LogoStrip.module.css";

type Logo = {
  src: string;
  alt: string;
  href?: string;
  /* Backed by Y Combinator: shows the orange YC badge beside the mark. */
  yc?: boolean;
  /* How far to pull the badge in, in px, when the mark sits narrower than its
     160px box and the badge would otherwise float away from it. */
  ycInset?: number;
};

const HOME_LOGOS: Logo[] = [
  {
    src: "/logos/walt-disney.svg",
    alt: "The Walt Disney Company",
    href: "https://thewaltdisneycompany.com/",
  },
  { src: "/logos/walmart.svg", alt: "Walmart", href: "https://www.walmart.com/" },
  { src: "/logos/oodle.svg", alt: "Oodle AI", href: "https://www.oodle.ai/" },
  { src: "/logos/ebay.svg", alt: "eBay", href: "https://www.ebay.com/" },
  { src: "/logos/accenture.svg", alt: "Accenture", href: "https://www.accenture.com/" },
  {
    src: "/logos/palo-alto-networks.svg",
    alt: "Palo Alto Networks",
    href: "https://www.paloaltonetworks.com/",
  },
  {
    src: "/logos/standard-metrics.svg",
    alt: "Standard Metrics",
    href: "https://standardmetrics.io/",
  },
  { src: "/logos/softbank.svg", alt: "SoftBank", href: "https://group.softbank/en" },
  { src: "/logos/experian.svg", alt: "Experian", href: "https://www.experian.com/" },
  { src: "/logos/entelligence.svg", alt: "Entelligence AI", href: "https://entelligence.ai/" },
  { src: "/logos/charles-schwab.svg", alt: "Charles Schwab", href: "https://www.schwab.com/" },
  { src: "/logos/payflow.svg", alt: "Payflow", href: "https://payflow.es/", yc: true },
  { src: "/logos/zillow.svg", alt: "Zillow", href: "https://www.zillow.com/" },
  { src: "/logos/andfacts.svg", alt: "&facts", href: "https://www.andfacts.com/" },
  { src: "/logos/td-ameritrade.svg", alt: "TD Ameritrade", href: "https://www.tdameritrade.com/" },
  { src: "/logos/paytm.svg", alt: "Paytm", href: "https://paytm.com/" },
  { src: "/logos/gaia.svg", alt: "GAIA", href: "https://heygaia.io/" },
  { src: "/logos/aia.svg", alt: "AIA Singapore", href: "https://www.aia.com.sg/" },
  { src: "/logos/prox.svg", alt: "Prox", href: "https://useprox.com/", yc: true, ycInset: 22 },
  { src: "/logos/rasa.svg", alt: "Rasa", href: "https://rasa.com/" },
  { src: "/logos/productboard.svg", alt: "Productboard", href: "https://productboard.com/" },
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
  /* Home splits its list across two rows that drift in opposite directions,
     the second shifted half a logo so the marks sit staggered like a
     honeycomb. Alternating picks keep big brands and startups mixed in both. */
  const rows =
    variant === "cloud"
      ? [logos]
      : [logos.filter((_, i) => i % 2 === 0), logos.filter((_, i) => i % 2 === 1)];

  return (
    <section className={styles.section} aria-label="Customers using OpenUI">
      {title ? <h3 className={styles.title}>{title}</h3> : null}
      <div className={styles.inner}>
        {rows.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className={`${styles.marquee} ${rowIndex % 2 ? styles.offsetRow : ""}`}
          >
            <div
              className={styles.track}
              style={{ animationDuration: `${row.length * SECONDS_PER_LOGO}s` }}
            >
              {Array.from({ length: SETS }, (_, set) =>
                row.map((logo) => {
                  const image = (
                    <>
                      <Image
                        className={styles.logo}
                        src={logo.src}
                        alt={logo.alt}
                        aria-hidden={set === 0 ? undefined : true}
                        width={160}
                        height={48}
                        loading="lazy"
                      />
                      {logo.yc ? (
                        <span
                          className={styles.yc}
                          style={logo.ycInset ? { marginLeft: -12 - logo.ycInset } : undefined}
                          title="Backed by Y Combinator"
                        >
                          <svg viewBox="0 0 16 16" aria-hidden="true">
                            <rect width="16" height="16" rx="3" fill="#F26522" />
                            <path
                              d="M7.1 9.1 4.6 4.4h1.5l1.9 3.7 1.9-3.7h1.5L8.9 9.1v2.5H7.1z"
                              fill="#fff"
                            />
                          </svg>
                        </span>
                      ) : null}
                    </>
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
