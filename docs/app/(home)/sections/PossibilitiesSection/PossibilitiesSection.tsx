"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { SectionHeader } from "../../components/SectionHeader/SectionHeader";
import styles from "./PossibilitiesSection.module.css";

const bottomTraysLightImg = "/homepage/tray-light.png";
const bottomTraysDarkImg = "/homepage/tray-dark.png";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

type CardImageSet = {
  title: string;
  lightImage: string;
  darkImage: string;
  href?: string;
};

const MOBILE_CAROUSEL_COPIES = 3;
const MOBILE_SCROLL_SPEED = 0.7;

const CARDS: readonly CardImageSet[] = [
  {
    title: "Conversational Apps",
    lightImage: "/homepage/conversational-apps-light.png",
    darkImage: "/homepage/conversational-apps-dark.png",
    href: "/docs/agent/getting-started/quickstart",
  },
  {
    title: "Dashboards & Web-apps",
    lightImage: "/homepage/dashboard-light.png",
    darkImage: "/homepage/dashboard-dark.png",
  },
  {
    title: "Mobile Apps",
    lightImage: "/homepage/mobile-light.png",
    darkImage: "/homepage/mobile-dark.png",
    href: "https://github.com/thesysdev/openui/tree/main/examples/app-frameworks/react-native",
  },
  {
    title: "Bottom trays",
    lightImage: bottomTraysLightImg,
    darkImage: bottomTraysDarkImg,
  },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type CardProps = {
  title: string;
  titlePrefix?: string;
  image?: string;
  lightImage?: string;
  darkImage?: string;
  href?: string;
};

function Card({ title, titlePrefix, image, lightImage, darkImage, href }: CardProps) {
  const artwork =
    lightImage && darkImage ? (
      <>
        <img
          src={lightImage}
          alt={`${title} illustration`}
          className={`${styles.cardImage} ${styles.cardImageLight}`}
          draggable={false}
        />
        <img
          src={darkImage}
          alt=""
          aria-hidden="true"
          className={`${styles.cardImage} ${styles.cardImageDark}`}
          draggable={false}
        />
      </>
    ) : image ? (
      <img
        src={image}
        alt={`${title} illustration`}
        className={styles.cardImage}
        draggable={false}
      />
    ) : (
      <div className={`${styles.cardImage} ${styles.cardImagePlaceholder}`} aria-hidden="true" />
    );

  const content = (
    <>
      <div className={styles.cardInner}>
        <div className={styles.cardMedia}>{artwork}</div>
        <div className={styles.cardBody}>
          <p className={styles.cardTitle}>
            {titlePrefix && <span className={styles.cardTitlePrefix}>{titlePrefix}</span>}
            {title}
          </p>
        </div>
      </div>
      <div className={styles.cardOverlay} />
    </>
  );

  if (!href) {
    return <div className={styles.card}>{content}</div>;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open ${title} example on GitHub`}
      className={`${styles.card} ${styles.cardLink}`}
    >
      {content}
    </a>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const DEFAULT_CARDS: CardProps[] = CARDS.map((card) => ({
  title: card.title,
  image: card.lightImage,
  href: card.href,
}));

export function PossibilitiesSection({
  title = "Endless possibilities. Built in realtime.",
  tagline,
  cards = DEFAULT_CARDS,
}: {
  title?: ReactNode;
  tagline?: ReactNode;
  cards?: CardProps[];
} = {}) {
  const mobileTrackRef = useRef<HTMLDivElement>(null);

  const mobileCards = Array.from({ length: MOBILE_CAROUSEL_COPIES }, (_, copyIndex) =>
    cards.map((card, cardIndex) => ({
      ...card,
      key: `${card.title}-${cardIndex}-${copyIndex}`,
    })),
  ).flat();

  useEffect(() => {
    const track = mobileTrackRef.current;
    if (!track) return;

    // Respect reduced-motion: leave the carousel static (no marquee) for users
    // who asked the OS to reduce motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frameId = 0;
    let offset = 0;
    // Cache the loop width (one copy's worth) and recompute only on resize, rather
    // than reading scrollWidth (which forces a layout reflow) on every frame.
    let loopWidth = track.scrollWidth / MOBILE_CAROUSEL_COPIES;
    const measure = () => {
      loopWidth = track.scrollWidth / MOBILE_CAROUSEL_COPIES;
    };

    const tick = () => {
      if (loopWidth > 0) {
        offset -= MOBILE_SCROLL_SPEED;
        if (offset <= -loopWidth) {
          offset += loopWidth;
        }

        track.style.transform = `translateX(${offset}px)`;
      }

      frameId = window.requestAnimationFrame(tick);
    };

    window.addEventListener("resize", measure);
    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", measure);
      track.style.transform = "";
    };
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.headerContainer}>
        <div className={styles.header}>
          <SectionHeader title={title}>
            {tagline && <p className={styles.subtitle}>{tagline}</p>}
          </SectionHeader>
        </div>
      </div>

      <div className={styles.cardsContainer}>
        <div className={styles.mobileCarouselViewport}>
          <div ref={mobileTrackRef} className={styles.mobileCarouselTrack}>
            {mobileCards.map((card) => (
              <Card
                key={card.key}
                title={card.title}
                titlePrefix={card.titlePrefix}
                image={card.image}
                lightImage={card.lightImage}
                darkImage={card.darkImage}
                href={card.href}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
