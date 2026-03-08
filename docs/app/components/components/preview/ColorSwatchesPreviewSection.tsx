"use client";

import Tooltip from "@components/components/Tooltip/Tooltip";
import PreviewCode from "@components/components/preview/PreviewCode";
import PreviewSection from "@components/components/preview/PreviewSection";
import type { HeadingLevel, SwatchRow } from "@components/types";
import { useEffect, useState } from "react";
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
  const [tokenValues, setTokenValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const computedStyles = getComputedStyle(document.body);
    const values: Record<string, string> = {};
    rows.forEach((row) => {
      (row.tokens ?? []).forEach((swatch) => {
        const tokenName = typeof swatch === "string" ? swatch : swatch.token;
        values[tokenName] = computedStyles.getPropertyValue(tokenName).trim() || "var(...)";
      });
    });
    setTokenValues(values);
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
        {code ? <PreviewCode code={code} /> : null}
      </div>
    </PreviewSection>
  );
}
