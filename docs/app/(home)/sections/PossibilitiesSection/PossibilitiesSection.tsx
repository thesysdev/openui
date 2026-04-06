"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";
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
};

const MOBILE_CAROUSEL_COPIES = 3;
const MOBILE_SCROLL_SPEED = 0.35;

const CARDS = [
  {
    title: "Conversational Apps",
    lightImage: "/homepage/conversational-apps-light.png",
    darkImage: "/homepage/conversational-apps-dark.png",
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
  },
  {
    title: "Bottom trays",
    lightImage: bottomTraysLightImg,
    darkImage: bottomTraysDarkImg,
  },
] as const satisfies readonly CardImageSet[];

const MOBILE_CAROUSEL_CARDS = Array.from({ length: MOBILE_CAROUSEL_COPIES }, (_, copyIndex) =>
  CARDS.map((card) => ({
    ...card,
    key: `${card.title}-${copyIndex}`,
  })),
).flat();

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Card({ title, image }: { title: string; image: string }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardInner}>
        <img
          src={image}
          alt={`${title} illustration`}
          className={styles.cardImage}
          draggable={false}
        />
        <div className={styles.cardBody}>
          <p className={styles.cardTitle}>{title}</p>
        </div>
      </div>
      <div className={styles.cardOverlay} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PossibilitiesSection() {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";
  const mobileTrackRef = useRef<HTMLDivElement>(null);

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
          <h2 className={styles.title}>Endless possibilities. Built in realtime.</h2>
        </div>
      </div>

      <div className={styles.cardsContainer}>
        <div className={styles.mobileCarouselViewport}>
          <div ref={mobileTrackRef} className={styles.mobileCarouselTrack}>
            {MOBILE_CAROUSEL_CARDS.map((card) => (
              <Card
                key={card.key}
                title={card.title}
                image={theme === "dark" ? card.darkImage : card.lightImage}
              />
            ))}
          </div>
        </div>

        <div className={styles.cardsGrid}>
          {CARDS.map((card) => (
            <Card
              key={card.title}
              title={card.title}
              image={theme === "dark" ? card.darkImage : card.lightImage}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
