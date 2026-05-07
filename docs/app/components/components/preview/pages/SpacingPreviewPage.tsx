"use client";

import { FoundationTable, PreviewPage, PreviewSection } from "@components/components/preview";
import tableStyles from "@components/components/preview/FoundationTokenTable.module.css";
import { useEffect, useState } from "react";

function formatSpacingLabel(token: string) {
  const raw = token.replace("--openui-space-", "");
  if (raw === "000") return "0";
  return raw.toUpperCase();
}

const SPACING_TOKENS = [
  "--openui-space-000",
  "--openui-space-3xs",
  "--openui-space-2xs",
  "--openui-space-xs",
  "--openui-space-s",
  "--openui-space-s-m",
  "--openui-space-m",
  "--openui-space-m-l",
  "--openui-space-l",
  "--openui-space-xl",
  "--openui-space-2xl",
  "--openui-space-3xl",
];

export default function SpacingPreviewPage() {
  const [tokenValues, setTokenValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const computedStyles = getComputedStyle(document.body);
    const map: Record<string, string> = {};
    SPACING_TOKENS.forEach((token) => {
      map[token] = computedStyles.getPropertyValue(token).trim() || "0px";
    });
    queueMicrotask(() => setTokenValues(map));
  }, []);

  const spacingItems = SPACING_TOKENS.map((token) => ({
    token,
    value: tokenValues[token] ?? "...",
  }));

  return (
    <PreviewPage>
      <PreviewSection
        title="Spacing"
        headingLevel="h1"
        description="Spacing tokens are used for consistent gaps, padding, and layout rhythm across the system."
      >
        <FoundationTable
          columns={[
            { key: "name", label: "Name" },
            { key: "value", label: "Variable value" },
            { key: "className", label: "Class name" },
          ]}
        >
          {spacingItems.map((item) => (
            <tr key={item.token} className={tableStyles.foundationTableBodyRow}>
              <td className={tableStyles.foundationTableCell}>
                <span>{formatSpacingLabel(item.token)}</span>
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
          Spacing components preview coming soon.
        </div>
      </PreviewSection>
    </PreviewPage>
  );
}
