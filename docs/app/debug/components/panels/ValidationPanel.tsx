"use client";

import { Tag } from "@openuidev/react-ui";
import { groupByCode } from "@paste/lib/groupErrors";
import type { ValidationOutcome } from "@paste/lib/parse";
import type { OpenUIError } from "@paste/lib/versions/types";
import styles from "@paste/paste.module.css";
import { CheckCircle2, Lightbulb } from "lucide-react";

function hintFor(enriched: OpenUIError[] | null, code: string, path: string, component: string) {
  return enriched?.find((e) => e.code === code && e.path === path && e.component === component)
    ?.hint;
}

export function ValidationPanel({ outcome }: { outcome: ValidationOutcome }) {
  const { result, enriched, fatal } = outcome;

  if (fatal) {
    return (
      <div className={styles.panelScroll}>
        <div className={styles.fatalCard}>
          <strong>Parser threw</strong>
          <pre>{fatal}</pre>
          <p>This can happen on old lang-core versions with a different API surface.</p>
        </div>
      </div>
    );
  }
  if (!result) return <div className={styles.panelEmpty}>Add some OpenUI Lang to validate it.</div>;

  const { meta } = result;
  const groups = groupByCode(meta.errors);

  return (
    <div className={styles.panelScroll}>
      <div className={styles.metaStrip}>
        <Tag size="sm" variant="neutral" text={`Statements: ${meta.statementCount}`} />
        <Tag
          size="sm"
          variant={meta.incomplete ? "warning" : "success"}
          text={meta.incomplete ? "Incomplete" : "Complete"}
        />
        <Tag
          size="sm"
          variant={result.root ? "success" : "warning"}
          text={`Root: ${result.root ? result.root.typeName : "none"}`}
        />
        {meta.unresolved.map((u) => (
          <Tag key={u} size="sm" variant="warning" text={`unresolved: ${u}`} />
        ))}
        {meta.orphaned.map((o) => (
          <Tag key={o} size="sm" variant="neutral" text={`orphaned: ${o}`} />
        ))}
      </div>

      {meta.errors.length === 0 ? (
        <div className={styles.allClear}>
          <CheckCircle2 size={16} /> No validation errors
        </div>
      ) : (
        [...groups.entries()].map(([code, errors]) => (
          <section key={code} className={styles.errorGroup}>
            <h3>
              <code>{code}</code> <span className={styles.count}>({errors.length})</span>
            </h3>
            <ul>
              {errors.map((e, i) => {
                const hint = hintFor(enriched, e.code, e.path, e.component);
                return (
                  <li key={`${e.path}-${i}`} className={styles.errorRow}>
                    <div className={styles.errHead}>
                      <code className={styles.errComponent}>{e.component}</code>
                      <code className={styles.errPath}>{e.path}</code>
                      {e.statementId && <Tag size="sm" variant="neutral" text={e.statementId} />}
                    </div>
                    <p className={styles.errMessage}>{e.message}</p>
                    {hint && (
                      <p className={styles.errHint}>
                        <Lightbulb size={13} className="err-hint-icon" /> {hint}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
