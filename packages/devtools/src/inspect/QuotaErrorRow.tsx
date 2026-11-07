import { type ObservabilityEvent } from "@openuidev/observability";
import { CreditCard, KeyRound } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { withDevtoolsAttribution } from "../lib/links";
import { FONT, useStyles, type ThemeTokens } from "../theme";
import { LevelIcon } from "./LevelIcon";

export interface QuotaErrorInfo {
  title: string;
  message: string;
  showPurchaseCta: boolean;
  showByokCta: boolean;
}

const QUOTA_ERROR_MESSAGES: Record<string, QuotaErrorInfo> = {
  ERR_BILLING_THRESHOLD_EXCEEDED: {
    title: "Add credits to keep going",
    message:
      "Looks like this workspace is out of OpenUI Cloud credits. Purchase credits, or bring your own OpenAI, Anthropic, or Google key (BYOK) at no extra cost, then try your request again. This notice is only shown in development.",
    showPurchaseCta: true,
    showByokCta: true,
  },
  ERR_QUOTA_EXCEEDED: {
    title: "Rate limit reached",
    message:
      "This workspace has hit a rate limit, usually from sending requests too quickly, or exceeding the per-model token/request limit for the current plan. Wait a moment and try again. This notice is only shown in development.",
    showPurchaseCta: false,
    showByokCta: false,
  },
};

export function getQuotaError(event: ObservabilityEvent): QuotaErrorInfo | undefined {
  if (event.level !== "error") return undefined;
  const error = asRecord(event.detail)["error"];
  const type = asString(asRecord(error)["type"]);
  return type ? QUOTA_ERROR_MESSAGES[type] : undefined;
}

/** Billing/rate-limit list entry — the highlighted card a known 429 code renders as. */
export function QuotaErrorRow({ info }: { info: QuotaErrorInfo }) {
  const styles = useStyles(quotaRowStyles);
  const [hoveredCta, setHoveredCta] = useState<string | null>(null);

  return (
    <div style={styles.row}>
      <div style={styles.creditsNote}>
        <div style={styles.creditsHeader}>
          <LevelIcon level="warning" />
          <div style={styles.creditsTitle}>{info.title}</div>
        </div>
        <p style={styles.creditsMessage}>{info.message}</p>
      </div>
      {info.showPurchaseCta || info.showByokCta ? (
        <div style={styles.actions}>
          {info.showPurchaseCta ? (
            <button
              type="button"
              style={{
                ...styles.action,
                ...(hoveredCta === "purchase" ? styles.actionHover : null),
              }}
              onMouseEnter={() => setHoveredCta("purchase")}
              onMouseLeave={() => setHoveredCta(null)}
              onClick={() =>
                window.open(
                  withDevtoolsAttribution(
                    "https://console.thesys.dev/billing",
                    "quota_error_purchase_credits",
                    "cloud",
                  ),
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              <CreditCard size={13} />
              Purchase Credits
            </button>
          ) : null}
          {info.showByokCta ? (
            <button
              type="button"
              style={{
                ...styles.action,
                ...styles.actionSecondary,
                ...(hoveredCta === "byok" ? styles.actionHover : null),
              }}
              onMouseEnter={() => setHoveredCta("byok")}
              onMouseLeave={() => setHoveredCta(null)}
              onClick={() =>
                window.open(
                  withDevtoolsAttribution(
                    "https://console.thesys.dev/byok",
                    "quota_error_byok",
                    "cloud",
                  ),
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              <KeyRound size={13} />
              Add your own key
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function asRecord(detail: unknown): Record<string, unknown> {
  return typeof detail === "object" && detail !== null ? (detail as Record<string, unknown>) : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function quotaRowStyles(t: ThemeTokens) {
  return {
    row: {
      border: `1px solid ${t.border}`,
      borderRadius: 12,
      padding: 12,
      display: "flex",
      flexDirection: "column",
      gap: 6,
      background: t.card,
    },
    // The card matches every other row; the chip and title colour carry the
    // billing/rate-limit signal.
    creditsNote: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
    },
    creditsHeader: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      minWidth: 0,
    },
    // Identical to the `kind` title on every other row; the chip alone carries
    // the billing/rate-limit signal.
    creditsTitle: {
      fontSize: 12,
      fontWeight: 600,
      color: t.fg,
    },
    creditsMessage: {
      margin: 0,
      fontSize: 12,
      lineHeight: 1.55,
      color: t.fgSecondary,
    },
    actions: {
      display: "flex",
      gap: 8,
      marginTop: 10,
    },
    action: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      border: "none",
      borderRadius: 8,
      background: t.inverted,
      color: t.invertedFg,
      padding: "6px 12px",
      fontFamily: FONT,
      fontSize: 12,
      fontWeight: 500,
      cursor: "pointer",
      transition: "transform 150ms ease",
    },
    actionHover: {
      transform: "scale(0.96)",
    },
    actionSecondary: {
      background: t.controlBg,
      color: t.fg,
      border: `1px solid ${t.controlBorder}`,
      boxShadow: t.shadowSubtle,
    },
  } satisfies Record<string, CSSProperties>;
}
