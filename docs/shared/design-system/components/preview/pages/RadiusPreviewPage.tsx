// @ts-nocheck
"use client";

import {
  FoundationTable,
  PreviewCode,
  PreviewPage,
  PreviewSection,
} from "@design-system/components/preview";
import tableStyles from "@design-system/components/preview/FoundationTokenTable.module.css";
import { useMemo } from "react";

function formatRadiusLabel(token) {
  const rawLabel = token.replace("--radius-", "");
  if (/^[a-z]+$/.test(rawLabel)) {
    return `${rawLabel.charAt(0).toUpperCase()}${rawLabel.slice(1)}`;
  }
  return rawLabel.toUpperCase();
}

export default function RadiusPreviewPage() {
  const radiusTokens = useMemo(
    () => [
      "--radius-none",
      "--radius-3xs",
      "--radius-2xs",
      "--radius-xs",
      "--radius-s",
      "--radius-m",
      "--radius-l",
      "--radius-xl",
      "--radius-2xl",
      "--radius-3xl",
      "--radius-4xl",
      "--radius-5xl",
      "--radius-6xl",
      "--radius-7xl",
      "--radius-8xl",
      "--radius-9xl",
      "--radius-full",
    ],
    [],
  );

  const tokenValues = useMemo(() => {
    if (typeof window === "undefined") return {};

    const computedStyles = getComputedStyle(document.documentElement);
    const map = {};
    radiusTokens.forEach((token) => {
      map[token] = computedStyles.getPropertyValue(token).trim() || "0";
    });
    return map;
  }, [radiusTokens]);

  const radiusCode = `:root {
  --radius-none: 0;
  --radius-xs: 4px;
  --radius-s: 6px;
  --radius-m: 8px;
  --radius-l: 10px;
  --radius-xl: 12px;
  --radius-full: 9999px;
}`;

  const radiusItems = useMemo(
    () => radiusTokens.map((token) => ({ token, value: tokenValues[token] ?? "..." })),
    [radiusTokens, tokenValues],
  );

  return (
    <PreviewPage>
      <PreviewSection
        title="Radius"
        headingLevel="h1"
        description="Radius tokens define corner curvature for inputs, cards, popovers, chips, and avatars."
      >
        <FoundationTable
          columns={[
            { key: "name", label: "Name" },
            { key: "value", label: "Variable value" },
            { key: "className", label: "Class name" },
          ]}
        >
          {radiusItems.map((item) => (
            <tr key={item.token} className={tableStyles.foundationTableBodyRow}>
              <td className={tableStyles.foundationTableCell}>
                <span>{formatRadiusLabel(item.token)}</span>
              </td>
              <td className={tableStyles.foundationTableCell}>
                <code className={tableStyles.foundationTokenName}>{item.value ?? "..."}</code>
              </td>
              <td className={tableStyles.foundationTableCell}>
                <code className={tableStyles.foundationTokenName}>{item.token}</code>
              </td>
            </tr>
          ))}
        </FoundationTable>
        <div className={tableStyles.foundationComponentsPlaceholder}>
          Radius components preview coming soon.
        </div>
        <PreviewCode code={radiusCode} />
      </PreviewSection>
    </PreviewPage>
  );
}
