"use client";

import Tooltip from "@design-system/components/Tooltip/Tooltip";
import PreviewCode from "@design-system/components/preview/PreviewCode";
import PreviewSection from "@design-system/components/preview/PreviewSection";
import PreviewThemeToggle from "@design-system/components/preview/PreviewThemeToggle";
import type { HeadingLevel, SwatchInput, SwatchRow, ThemeMode } from "@design-system/types";
import { useMemo, useState } from "react";
import styles from "./PreviewLayout.module.css";

const getDefaultLabel = (tokenName = ""): string =>
  tokenName
    .replace(/^--/, "")
    .replace(/^(openui|text|interactive|border)-/, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

interface PreviewSwatchesSectionProps {
  id?: string;
  title: string;
  description?: string;
  headingLevel?: HeadingLevel;
  tokens?: SwatchInput[];
  rows?: SwatchRow[];
  code?: string;
  variant?: "grid" | "semantic-card";
  initialTheme?: ThemeMode;
  previewLabel?: string;
  showThemeToggle?: boolean;
}

export default function PreviewSwatchesSection({
  id,
  title,
  description,
  headingLevel,
  tokens,
  rows,
  code,
  variant = "grid",
  initialTheme = "dark",
  previewLabel = "Preview",
  showThemeToggle = true,
}: PreviewSwatchesSectionProps) {
  const [previewTheme, setPreviewTheme] = useState<ThemeMode>(initialTheme);

  const normalizedRows = useMemo((): SwatchRow[] => {
    if (rows?.length) return rows;
    if (tokens?.length) return [{ id: "default", tokens }];
    return [];
  }, [rows, tokens]);

  return (
    <PreviewSection id={id} title={title} description={description} headingLevel={headingLevel}>
      <div className={styles.previewHeader}>
        <h3 className={styles.previewTitle}>{previewLabel}</h3>
        {showThemeToggle ? (
          <PreviewThemeToggle value={previewTheme} onChange={setPreviewTheme} />
        ) : null}
      </div>

      <div className={styles.previewShell} data-preview-theme={previewTheme}>
        <div className={styles.previewFrame}>
          <div className={styles.previewSwatchRows}>
            {normalizedRows.map((row, rowIndex) => (
              <div key={row.id ?? row.title ?? rowIndex} className={styles.previewSwatchRow}>
                {row.title ? <h4 className={styles.foundationRowTitle}>{row.title}</h4> : null}
                {row.description ? (
                  <p className={styles.sectionDescription}>{row.description}</p>
                ) : null}
                <div className={styles.previewGrid}>
                  {(row.tokens ?? []).map((swatch) => {
                    const tokenName = typeof swatch === "string" ? swatch : swatch.token;
                    const tokenLabel =
                      typeof swatch === "string" ? getDefaultLabel(tokenName) : swatch.label;
                    const tokenValue = typeof swatch === "string" ? undefined : swatch.value;
                    const toneClassName =
                      typeof swatch === "string"
                        ? styles.semanticCardToneDark
                        : swatch.tone === "light"
                          ? styles.semanticCardToneLight
                          : styles.semanticCardToneDark;

                    return (
                      <Tooltip key={tokenName} content={tokenName}>
                        {variant === "semantic-card" ? (
                          <article
                            className={`${styles.previewItem} ${styles.semanticCard} ${toneClassName}`}
                            style={{ backgroundColor: `var(${tokenName})` }}
                            aria-label={tokenName}
                          >
                            <code className={styles.semanticCardValue}>
                              {tokenValue ?? "var(...)"}
                            </code>
                            <p className={styles.semanticCardLabel}>
                              {tokenLabel ?? getDefaultLabel(tokenName)}
                            </p>
                          </article>
                        ) : (
                          <div
                            className={styles.previewItem}
                            style={{ backgroundColor: `var(${tokenName})` }}
                            aria-label={tokenName}
                          />
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PreviewCode code={code} themeMode={previewTheme} />
    </PreviewSection>
  );
}
