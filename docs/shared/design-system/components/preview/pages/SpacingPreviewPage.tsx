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

function formatSpacingLabel(token) {
  const raw = token.replace("--space-", "");
  if (raw === "000") return "0";
  return raw.toUpperCase();
}

export default function SpacingPreviewPage() {
  const spacingTokens = useMemo(
    () => [
      "--space-000",
      "--space-3xs",
      "--space-2xs",
      "--space-xs",
      "--space-s",
      "--space-s-m",
      "--space-m",
      "--space-m-l",
      "--space-l",
      "--space-xl",
      "--space-2xl",
      "--space-3xl",
    ],
    [],
  );

  const tokenValues = useMemo(() => {
    if (typeof window === "undefined") return {};

    const computedStyles = getComputedStyle(document.documentElement);
    const map = {};
    spacingTokens.forEach((token) => {
      map[token] = computedStyles.getPropertyValue(token).trim() || "0px";
    });
    return map;
  }, [spacingTokens]);

  const spacingCode = `:root {
  --space-000: 0;
  --space-3xs: 2px;
  --space-2xs: 4px;
  --space-xs: 6px;
  --space-s: 8px;
  --space-s-m: 10px;
  --space-m: 12px;
  --space-m-l: 16px;
  --space-l: 18px;
  --space-xl: 24px;
  --space-2xl: 36px;
  --space-3xl: 48px;
}`;

  const spacingItems = useMemo(
    () => spacingTokens.map((token) => ({ token, value: tokenValues[token] ?? "..." })),
    [spacingTokens, tokenValues],
  );

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
        <PreviewCode code={spacingCode} />
      </PreviewSection>
    </PreviewPage>
  );
}
