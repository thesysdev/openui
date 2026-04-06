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
  iconBadgeClassName?: string;
  iconPlacementClassName?: string;
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
    iconBadgeClassName: styles.iconBadgeOpenUi,
    iconViewBox: "",
    iconPath: "",
    iconFill: "black",
    isMascot: true,
  },
  {
    name: "ShadCN",
    iconBadgeClassName: styles.iconBadgeShadcn,
    iconPlacementClassName: styles.iconPlacementShadcn,
    iconViewBox: "0 0 24 24",
    iconPath: svgPaths.p46a4800,
    iconFill: "white",
    clipId: "clip_shadcn",
    clipSize: "24",
  },
  {
    name: "Material Design system",
    mobileName: "Material Design system Guidelines",
    iconBadgeClassName: styles.iconBadgeMaterial,
    iconPlacementClassName: styles.iconPlacementMaterial,
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
        <div className={`${styles.iconBadge} ${lib.iconBadgeClassName ?? ""}`.trim()}>
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
            <div className={`${styles.iconPlacement} ${lib.iconPlacementClassName ?? ""}`.trim()}>
              {iconContent}
            </div>
          )}
        </div>

        {/* Name */}
        <span className={styles.name}>{displayName}</span>
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
