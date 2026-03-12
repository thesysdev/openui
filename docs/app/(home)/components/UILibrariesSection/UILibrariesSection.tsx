import type { CSSProperties } from "react";
import mascotSvgPaths from "@/imports/svg-10waxq0xyc";
import svgPaths from "@/imports/svg-urruvoh2be";
import styles from "./UILibrariesSection.module.css";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface UILibrary {
  name: string;
  /** Desktop-only name override (optional) */
  desktopName?: string;
  /** Mobile-only name override (optional) */
  mobileName?: string;
  iconBackground: string;
  iconSize?: { mobile: number; desktop: number };
  iconPosition?: { mobile: { left: number; top: number }; desktop: { left: number; top: number } };
  iconViewBox: string;
  iconPath: string;
  iconFill: string;
  clipId?: string;
  clipSize?: string;
  isMascot?: boolean;
}

const LIBRARIES: UILibrary[] = [
  {
    name: "OpenUI Design system",
    iconBackground: "rgb(0 0 0 / 8%)",
    iconViewBox: "",
    iconPath: "",
    iconFill: "black",
    isMascot: true,
  },
  {
    name: "ShadCN",
    iconBackground: "#000000",
    iconSize: { mobile: 16, desktop: 24 },
    iconPosition: { mobile: { left: 8, top: 8 }, desktop: { left: 12, top: 12 } },
    iconViewBox: "0 0 24 24",
    iconPath: svgPaths.p46a4800,
    iconFill: "white",
    clipId: "clip_shadcn",
    clipSize: "24",
  },
  {
    name: "Material Design system",
    mobileName: "Material Design system Guidelines",
    iconBackground: "#a485ff",
    iconSize: { mobile: 20, desktop: 30 },
    iconPosition: { mobile: { left: 6, top: 6 }, desktop: { left: 9, top: 9 } },
    iconViewBox: "0 0 30 30",
    iconPath: svgPaths.p3a7bdd80,
    iconFill: "white",
    clipId: "clip_material",
    clipSize: "30",
  },
];

// ---------------------------------------------------------------------------
// Library card
// ---------------------------------------------------------------------------

function LibraryCard({ lib }: { lib: UILibrary }) {
  const iconStyle =
    lib.iconSize && lib.iconPosition
      ? ({
          "--icon-mobile-left": `${lib.iconPosition.mobile.left}px`,
          "--icon-mobile-top": `${lib.iconPosition.mobile.top}px`,
          "--icon-mobile-size": `${lib.iconSize.mobile}px`,
          "--icon-desktop-left": `${lib.iconPosition.desktop.left}px`,
          "--icon-desktop-top": `${lib.iconPosition.desktop.top}px`,
          "--icon-desktop-size": `${lib.iconSize.desktop}px`,
        } as CSSProperties)
      : undefined;

  const displayName = lib.mobileName ? (
    <>
      <span className={styles.mobileOnly}>{lib.mobileName}</span>
      <span className={styles.desktopOnly}>{lib.desktopName ?? lib.name}</span>
    </>
  ) : (
    lib.name
  );

  const iconContent = lib.clipId ? (
    <svg className={styles.iconSvg} fill="none" viewBox={lib.iconViewBox}>
      <g clipPath={`url(#${lib.clipId})`}>
        <path d={lib.iconPath} fill={lib.iconFill} />
      </g>
      <defs>
        <clipPath id={lib.clipId}>
          <rect fill="white" height={lib.clipSize} width={lib.clipSize} />
        </clipPath>
      </defs>
    </svg>
  ) : (
    <svg className={styles.iconSvg} fill="none" viewBox={lib.iconViewBox}>
      <path d={lib.iconPath} fill={lib.iconFill} />
    </svg>
  );

  return (
    <div className={styles.card}>
      <div className={styles.cardContent}>
        {/* Icon */}
        <div
          className={styles.iconBadge}
          style={{ backgroundColor: lib.iconBackground }}
        >
          {lib.isMascot ? (
            <div className={styles.mascotCenter}>
              <div className={styles.mascotFrame}>
                <div className={styles.mascotSvgWrap}>
                  <svg
                    className={styles.mascotSvg}
                    fill="none"
                    preserveAspectRatio="xMidYMid meet"
                    viewBox="0 0 37.6937 30.558"
                  >
                    <path
                      d={mascotSvgPaths.p581fa00}
                      fill="black"
                      stroke="black"
                      strokeWidth="0.346875"
                    />
                    <path d={mascotSvgPaths.p3ea20780} fill="black" />
                    <path
                      d={mascotSvgPaths.pf52e280}
                      fill="black"
                      stroke="black"
                      strokeWidth="0.346875"
                    />
                    <path
                      d={mascotSvgPaths.pa685a00}
                      fill="black"
                      stroke="black"
                      strokeWidth="0.346875"
                    />
                    <path d={mascotSvgPaths.p371d6000} fill="black" />
                    <path d={mascotSvgPaths.p1cace000} fill="black" />
                    <path
                      d={mascotSvgPaths.p1d3dca00}
                      fill="black"
                      stroke="black"
                      strokeWidth="0.346875"
                    />
                    <path
                      d={mascotSvgPaths.p11103600}
                      fill="black"
                      stroke="black"
                      strokeWidth="0.346875"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.iconPlacement} style={iconStyle}>
              {iconContent}
            </div>
          )}
        </div>

        {/* Name */}
        <span className={styles.name}>
          {displayName}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function UILibrariesSection() {
  return (
    <div className={styles.section}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            <span className={styles.mobileOnly}>
              Works with any UI library.
              <br />
              Including yours.
            </span>
            <span className={styles.desktopOnly}>Works with any UI library. Including yours.</span>
          </h2>
        </div>

        {/* Library cards */}
        <div className={styles.cardGrid}>
          {LIBRARIES.map((lib) => (
            <LibraryCard key={lib.name} lib={lib} />
          ))}
        </div>
      </div>
    </div>
  );
}
