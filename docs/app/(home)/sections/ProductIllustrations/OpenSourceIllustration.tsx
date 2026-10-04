import Image from "next/image";
import styles from "./OpenSourceIllustration.module.css";

/** Final homepage Open Source artwork from the paired Figma frames. */
export function OpenSourceIllustration({ theme }: { theme?: "light" | "dark" } = {}) {
  return (
    <div
      className={`${styles.art} ${theme === "light" ? styles.artLight : ""} ${theme === "dark" ? styles.artDark : ""}`.trim()}
      role="img"
      aria-label="OpenUI Lang code generating a trip-planning interface"
    >
      <Image
        className={`${styles.image} ${styles.imageLight}`}
        src="/openui-illustrations/home-open-source-light.webp"
        alt=""
        aria-hidden="true"
        fill
        quality={95}
        unoptimized
        sizes="(max-width: 767px) calc(100vw - 32px), 1200px"
      />
      <Image
        className={`${styles.image} ${styles.imageDark}`}
        src="/openui-illustrations/home-open-source-dark.webp"
        alt=""
        aria-hidden="true"
        fill
        quality={95}
        unoptimized
        sizes="(max-width: 767px) calc(100vw - 32px), 1200px"
      />
    </div>
  );
}
