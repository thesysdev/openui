"use client";

import { FoundationTable, PreviewPage, PreviewSection } from "@components/components/preview";
import tableStyles from "@components/components/preview/FoundationTokenTable.module.css";
import { useEffect, useState } from "react";

function formatRadiusLabel(token: string) {
  const rawLabel = token.replace("--openui-radius-", "");
  if (/^[a-z]+$/.test(rawLabel)) {
    return `${rawLabel.charAt(0).toUpperCase()}${rawLabel.slice(1)}`;
  }
  return rawLabel.toUpperCase();
}

const RADIUS_TOKENS = [
  "--openui-radius-none",
  "--openui-radius-3xs",
  "--openui-radius-2xs",
  "--openui-radius-xs",
  "--openui-radius-s",
  "--openui-radius-m",
  "--openui-radius-l",
  "--openui-radius-xl",
  "--openui-radius-2xl",
  "--openui-radius-3xl",
  "--openui-radius-4xl",
  "--openui-radius-5xl",
  "--openui-radius-6xl",
  "--openui-radius-7xl",
  "--openui-radius-8xl",
  "--openui-radius-9xl",
  "--openui-radius-full",
];

export default function RadiusPreviewPage() {
  const [tokenValues, setTokenValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const computedStyles = getComputedStyle(document.body);
    const map: Record<string, string> = {};
    RADIUS_TOKENS.forEach((token) => {
      map[token] = computedStyles.getPropertyValue(token).trim() || "0";
    });
    setTokenValues(map);
  }, []);

  const radiusItems = RADIUS_TOKENS.map((token) => ({
    token,
    value: tokenValues[token] ?? "...",
  }));

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
      </PreviewSection>
    </PreviewPage>
  );
}
