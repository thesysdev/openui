"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { OpenUILogo, ThesysLogo, type LogoVariant } from "./brand-logo";
import styles from "./site-header.module.css";

function joinClasses(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function SiteHeaderBrand({ variant = "light" }: { variant?: LogoVariant }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={styles.brand}>
      <ThesysLogo isHovered={isHovered} onHoverChange={setIsHovered} variant={variant} />
      <span aria-hidden="true" className={styles.brandDivider} />
      <OpenUILogo variant={variant} />
    </div>
  );
}

type SiteHeaderFrameProps = {
  variant: "home" | "docs";
  bordered?: boolean;
  borderColor: string;
  dividerColor: string;
  brandVariant?: LogoVariant;
  leading?: ReactNode;
  center?: ReactNode;
  end?: ReactNode;
  mobileEnd?: ReactNode;
  bottom?: ReactNode;
};

export function SiteHeaderFrame({
  variant,
  bordered = false,
  borderColor,
  dividerColor,
  brandVariant = "light",
  leading,
  center,
  end,
  mobileEnd,
  bottom,
}: SiteHeaderFrameProps) {
  return (
    <div
      className={joinClasses(
        styles.surface,
        variant === "home" ? styles.homeSurface : styles.docsSurface,
        bordered && styles.bordered,
      )}
      style={
        {
          "--site-header-border-color": borderColor,
          "--site-header-divider-color": dividerColor,
        } as CSSProperties
      }
    >
      <div className={styles.frame}>
        <div className={styles.row}>
          <div className={styles.start}>
            {leading ? <div className={styles.leading}>{leading}</div> : null}
            <SiteHeaderBrand variant={brandVariant} />
          </div>
          {center ? <div className={styles.center}>{center}</div> : null}
          <div className={styles.right}>
            {end ? <div className={styles.end}>{end}</div> : null}
            {mobileEnd ? <div className={styles.mobileEnd}>{mobileEnd}</div> : null}
          </div>
        </div>
      </div>
      {bottom ? (
        <div className={styles.bottom}>
          <div className={styles.bottomInner}>{bottom}</div>
        </div>
      ) : null}
    </div>
  );
}
