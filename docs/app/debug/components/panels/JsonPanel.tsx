"use client";

import { Button } from "@openuidev/react-ui";
import type { ParseResult } from "@paste/lib/versions/types";
import styles from "@paste/paste.module.css";
import { useMemo, useState } from "react";

const COLLAPSE_BYTES = 200 * 1024;

export function JsonPanel({ result }: { result: ParseResult | null }) {
  const [forceExpand, setForceExpand] = useState(false);
  const json = useMemo(() => {
    if (!result) return null;
    try {
      return JSON.stringify(
        result,
        (_k, v) => (typeof v === "function" ? `[function]` : v === undefined ? null : v),
        2,
      );
    } catch (err) {
      return `/* could not stringify: ${err instanceof Error ? err.message : String(err)} */`;
    }
  }, [result]);

  if (!json) return <div className={styles.panelEmpty}>No parse result yet.</div>;
  if (json.length > COLLAPSE_BYTES && !forceExpand) {
    return (
      <div className={styles.panelScroll}>
        <p>
          Result is {(json.length / 1024).toFixed(0)} KB.{" "}
          <Button variant="secondary" size="extra-small" onClick={() => setForceExpand(true)}>
            Expand anyway
          </Button>
        </p>
      </div>
    );
  }
  return (
    <div className={styles.panelScroll}>
      <pre className={styles.treeJson}>{json}</pre>
    </div>
  );
}
