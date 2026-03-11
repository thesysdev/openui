"use client";

import Tooltip from "@design-system/components/Tooltip/Tooltip";
import PreviewCode from "@design-system/components/preview/PreviewCode";
import PreviewSection from "@design-system/components/preview/PreviewSection";
import type { HeadingLevel, SwatchRow } from "@design-system/types";
import { useMemo } from "react";
import styles from "./PreviewLayout.module.css";

const getSwatchStep = (tokenName = ""): string => {
  const step = tokenName.replace(/^--swatch-[a-z]+-?/, "");
  return step || "base";
};

interface ColorSwatchesPreviewSectionProps {
  id?: string;
  title: string;
  description?: string;
  headingLevel?: HeadingLevel;
  rows: SwatchRow[];
  code?: string;
}

export default function ColorSwatchesPreviewSection({
  id,
  title,
  description,
  headingLevel,
  rows = [],
  code,
}: ColorSwatchesPreviewSectionProps) {
  const tokenValues = useMemo(() => {
    if (typeof window === "undefined") return {} as Record<string, string>;

    const computedStyles = getComputedStyle(document.documentElement);
    const declaredValues: Record<string, string> = {};

    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        Array.from(sheet.cssRules ?? []).forEach((rule) => {
          const styleRule = rule as CSSStyleRule;
          if (
            !styleRule.style ||
            !styleRule.selectorText ||
            !styleRule.selectorText.includes(":root")
          )
            return;
          Array.from(styleRule.style).forEach((name) => {
            if (!name.startsWith("--swatch-")) return;
            declaredValues[name] = styleRule.style.getPropertyValue(name).trim();
          });
        });
      } catch {
        // Ignore cross-origin or unreadable stylesheets.
      }
    });

    const values: Record<string, string> = {};

    rows.forEach((row) => {
      (row.tokens ?? []).forEach((swatch) => {
        const tokenName = typeof swatch === "string" ? swatch : swatch.token;
        const declaredValue = declaredValues[tokenName];
        values[tokenName] =
          declaredValue || computedStyles.getPropertyValue(tokenName).trim() || "var(...)";
      });
    });

    return values;
  }, [rows]);

  return (
    <PreviewSection id={id} title={title} description={description} headingLevel={headingLevel}>
      <div className={styles.colorSwatchSectionContent}>
        <div className={styles.colorSwatchRows}>
          {rows.map((row, rowIndex) => (
            <div key={row.id ?? row.title ?? rowIndex} className={styles.colorSwatchRow}>
              <div className={styles.colorSwatchRowLine}>
                {row.title ? <h4 className={styles.foundationRowTitle}>{row.title}</h4> : null}
                <div className={styles.colorSwatchTrack}>
                  {(row.tokens ?? []).map((swatch) => {
                    const tokenName = typeof swatch === "string" ? swatch : swatch.token;
                    const swatchStep = getSwatchStep(tokenName);
                    const swatchValue =
                      typeof swatch === "string"
                        ? (tokenValues[tokenName] ?? "var(...)")
                        : swatch.value;
                    const tooltipContent = `${swatchStep} · ${swatchValue}`;

                    return (
                      <Tooltip key={tokenName} content={tooltipContent}>
                        <span
                          className={styles.colorSwatchDot}
                          style={{ backgroundColor: `var(${tokenName})` }}
                          aria-label={tokenName}
                        />
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
              {row.description ? (
                <p className={styles.sectionDescription}>{row.description}</p>
              ) : null}
            </div>
          ))}
        </div>
        <PreviewCode code={code} />
      </div>
    </PreviewSection>
  );
}
