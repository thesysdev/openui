"use client";

import { useEffect, useRef, type ReactNode } from "react";
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
const MOBILE_SCROLL_SPEED = 0.35;

const CARDS: readonly CardImageSet[] = [
  {
    title: "Conversational Apps",
    lightImage: "/homepage/conversational-apps-light.png",
    darkImage: "/homepage/conversational-apps-dark.png",
    href: "https://github.com/thesysdev/openui/tree/main/examples/openui-chat",
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
    href: "https://github.com/thesysdev/openui/tree/main/examples/openui-react-native",
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

type CardProps = { title: string; image?: string; href?: string };

function Card({ title, image, href }: CardProps) {
  const content = (
    <>
      <div className={styles.cardInner}>
        {image ? (
          <img
            src={image}
            alt={`${title} illustration`}
            className={styles.cardImage}
            draggable={false}
          />
        ) : (
          <div
            className={`${styles.cardImage} ${styles.cardImagePlaceholder}`}
            aria-hidden="true"
          />
        )}
        <div className={styles.cardBody}>
          <p className={styles.cardTitle}>{title}</p>
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

    const mobileMediaQuery = window.matchMedia("(max-width: 1023px)");
    let frameId = 0;
    let offset = 0;

    const resetTrack = () => {
      offset = 0;
      track.style.transform = "translateX(0px)";
    };

    const tick = () => {
      if (mobileMediaQuery.matches) {
        const loopWidth = track.scrollWidth / MOBILE_CAROUSEL_COPIES;

        if (loopWidth > 0) {
          offset -= MOBILE_SCROLL_SPEED;
          if (offset <= -loopWidth) {
            offset += loopWidth;
          }

          track.style.transform = `translateX(${offset}px)`;
        }
      } else if (offset !== 0) {
        resetTrack();
      }

      frameId = window.requestAnimationFrame(tick);
    };

    const handleViewportChange = () => {
      resetTrack();
    };

    mobileMediaQuery.addEventListener("change", handleViewportChange);
    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
      mobileMediaQuery.removeEventListener("change", handleViewportChange);
      track.style.transform = "";
    };
  }, []);

  return (
    <section className={styles.section}>
      <div className={styles.headerContainer}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          {tagline && <p className={styles.subtitle}>{tagline}</p>}
        </div>
      </div>

      <div className={styles.cardsContainer}>
        <div className={styles.mobileCarouselViewport}>
          <div ref={mobileTrackRef} className={styles.mobileCarouselTrack}>
            {mobileCards.map((card) => (
              <Card key={card.key} title={card.title} image={card.image} href={card.href} />
            ))}
          </div>
        </div>

        <div className={styles.cardsGrid}>
          {cards.map((card, index) => (
            <Card
              key={`${card.title}-${index}`}
              title={card.title}
              image={card.image}
              href={card.href}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
