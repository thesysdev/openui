import { Check, CircleAlert } from "lucide-react";
import { CSSProperties, useState } from "react";
import { withDevtoolsAttribution } from "../lib/links";
import { ColorMode, FONT, theme, ThemeTokens } from "../theme";

const FEATURES = [
  "Automatically fix 88% of the errors",
  "Track requests & generations for free",
] as const;

const API_KEY_URL = "https://console.thesys.dev/keys";
const DOCS_URL = "https://www.openui.com/docs/agent/getting-started/openui-cloud";

export default function ReliabilityBanner({ themeMode }: { themeMode: ColorMode }) {
  const [hoveredCta, setHoveredCta] = useState<string | null>(null);
  const tokens = theme(themeMode);
  const styles = bannerStyles(tokens);

  return (
    <div style={styles.wrapper}>
      <div style={styles.banner}>
        <span style={styles.title}>
          <span style={styles.alertTile} aria-hidden>
            <CircleAlert size={11} strokeWidth={2.5} />
          </span>
          Your users may see these errors in production
        </span>
        <div style={styles.body}>
          <div style={styles.featuresWrapper}>
            <span style={styles.statement}>Try OpenUI Autofix</span>
            <ul style={styles.features}>
              {FEATURES.map((feature) => (
                <li key={feature} style={styles.feature}>
                  <span style={styles.checkTile} aria-hidden>
                    <Check size={11} strokeWidth={2.5} style={styles.check} />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div style={styles.actions}>
            <a
              style={{
                ...styles.bannerAction,
                ...(hoveredCta === "api_key" ? styles.bannerActionHover : null),
              }}
              href={withDevtoolsAttribution(API_KEY_URL, "cloud_banner_get_api_key")}
              target="_blank"
              rel="noreferrer"
              onMouseEnter={() => setHoveredCta("api_key")}
              onMouseLeave={() => setHoveredCta(null)}
            >
              Get API key
            </a>
            <a
              style={{
                ...styles.bannerAction,
                ...styles.bannerActionSecondary,
                ...(hoveredCta === "docs" ? styles.bannerActionHover : null),
              }}
              href={withDevtoolsAttribution(DOCS_URL, "cloud_banner_view_docs")}
              target="_blank"
              rel="noreferrer"
              onMouseEnter={() => setHoveredCta("docs")}
              onMouseLeave={() => setHoveredCta(null)}
            >
              View docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

const bannerStyles = (t: ThemeTokens) =>
  ({
    wrapper: {
      position: "relative",
      zIndex: 1,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      flexShrink: 0,
      background: t.bg,
      padding: 12,
    },
    banner: {
      display: "flex",
      flexDirection: "column",
      alignItems: "stretch",
      flexShrink: 0,
      overflow: "hidden",
      border: `1px solid ${t.border}`,
      borderRadius: 12,
      background: t.card,
      boxShadow: t.shadowSubtle,
      color: t.fg,
      fontFamily: FONT,
      textAlign: "left",
      padding: "6px",
    },
    title: {
      display: "flex",
      alignItems: "flex-start",
      gap: 8,
      background: t.dangerBg,
      color: t.danger,
      fontSize: 13,
      fontWeight: 600,
      lineHeight: 1.3,
      padding: "8px 16px 8px 8px",
      borderRadius: 8,
    },
    body: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: "18px 12px 12px 12px",
    },
    featuresWrapper: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
    },
    alertTile: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      width: 18,
      height: 18,
      marginTop: 1,
      borderRadius: 5,
      background: t.danger,
      color: t.dangerBg,
    },
    statement: {
      fontSize: 12,
      fontWeight: 600,
      lineHeight: 1.35,
    },
    features: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      margin: 0,
      padding: 0,
      listStyle: "none",
    },
    feature: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      color: t.fg,
      fontSize: 12,
      lineHeight: 1.35,
    },
    checkTile: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      width: 18,
      height: 18,
      borderRadius: 5,
      background: t.successBg,
    },
    check: {
      color: t.success,
    },
    actions: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginTop: 8,
    },
    bannerAction: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      textDecoration: "none",
      border: `1px solid ${t.inverted}`,
      borderRadius: 8,
      background: t.inverted,
      color: t.invertedFg,
      fontSize: 11,
      fontWeight: 500,
      padding: "7px 12px",
      transition: "transform 150ms ease",
    },
    bannerActionHover: {
      transform: "scale(0.96)",
    },
    bannerActionSecondary: {
      border: `1px solid ${t.controlBorder}`,
      background: t.controlBg,
      color: t.fg,
      boxShadow: t.shadowSubtle,
    },
  }) satisfies Record<string, CSSProperties>;
