import Image from "next/image";
import styles from "./LogoStrip.module.css";

type Logo = {
  src: string;
  alt: string;
  href?: string;
};

const HOME_LOGOS: Logo[] = [
  { src: "/logos/oodle.svg", alt: "Oodle AI", href: "https://www.oodle.ai/" },
  {
    src: "/logos/standard-metrics.svg",
    alt: "Standard Metrics",
    href: "https://standardmetrics.io/",
  },
  { src: "/logos/entelligence.svg", alt: "Entelligence AI", href: "https://entelligence.ai/" },
  { src: "/logos/andfacts.svg", alt: "&facts", href: "https://www.andfacts.com/" },
  { src: "/logos/gaia.svg", alt: "GAIA", href: "https://heygaia.io/" },
  { src: "/logos/prox.svg", alt: "Prox", href: "https://useprox.com/" },
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

export function LogoStrip({
  variant = "home",
  title,
}: {
  variant?: "home" | "cloud";
  title?: string;
}) {
  const logos = variant === "cloud" ? CLOUD_LOGOS : HOME_LOGOS;

  return (
    <section className={styles.section} aria-label="Customers using OpenUI">
      {title ? <h3 className={styles.title}>{title}</h3> : null}
      <div className={styles.inner}>
        <div className={styles.marquee}>
          <div className={styles.track}>
            {Array.from({ length: SETS }, (_, set) =>
              logos.map((logo) => {
                const image = (
                  <Image
                    className={styles.logo}
                    src={logo.src}
                    alt={set === 0 ? logo.alt : ""}
                    width={160}
                    height={48}
                    loading="lazy"
                  />
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
      </div>
    </section>
  );
}
