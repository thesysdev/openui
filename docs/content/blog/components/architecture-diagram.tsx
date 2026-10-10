"use client";

import { useState } from "react";
import styles from "./intelligent-ui-demo.module.css";

const MODES = {
  render: {
    label: "First render",
    note: "The model writes DIL, the server compiles it, and the client runs the program and draws native components.",
  },
  interaction: {
    label: "Interaction",
    note: "User events go back to the worker as callbacks. State updates and UI operations stay in the client, with no model call.",
  },
} as const;

type Mode = keyof typeof MODES;

export function ArchitectureDiagram() {
  const [mode, setMode] = useState<Mode>("render");
  const render = mode === "render";

  return (
    <figure
      className={`${styles.card} not-prose`}
      aria-label="ChatGPT Intelligent UI architecture: the model writes DIL, the backend server compiles it into JavaScript and JSON, a sandboxed runtime in the client runs the program, and the native renderer draws the result. User events return to the runtime as callbacks without a model call."
    >
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Architecture</p>
          <p className={styles.title}>Inside ChatGPT Intelligent UI</p>
          <p className={styles.subtitle}>Model-generated, server-compiled, client-executed.</p>
        </div>
        <div className={styles.segmented} role="group" aria-label="Show path for">
          {(Object.keys(MODES) as Mode[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={mode === key}
              onClick={() => setMode(key)}
            >
              {MODES[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.arch} data-mode={mode}>
        <section className={styles.zone} data-on={render}>
          <span className={styles.zoneLabel}>Model</span>
          <div className={styles.archCard}>
            <span className={styles.archTitle}>Inference format</span>
            <pre className={styles.archCode}>
              <span className={styles.dim}>## </span>Team plan{"\n"}
              <span className={styles["tok-tag"]}>&lt;slider</span> …{" "}
              <span className={styles["tok-tag"]}>/&gt;</span>
              {"\n"}DIL.<span className={styles["tok-attr"]}>useState</span>(8)
            </pre>
            <span className={styles.archNote}>DIL: Markdown · JSX · JS</span>
          </div>
        </section>

        <Connector label="DIL" on={render} />

        <section className={styles.zone} data-on={render}>
          <span className={styles.zoneLabel}>Backend server</span>
          <div className={styles.archCard}>
            <span className={styles.archTitle}>Server-side compilation</span>
            <ul className={styles.archList}>
              <li>Repairs partial output</li>
              <li>Validates properties</li>
              <li>Moves text to constants</li>
            </ul>
            <span className={styles.chips}>
              <span className={styles.chip}>JS program</span>
              <span className={styles.chip}>JSON data</span>
            </span>
          </div>
        </section>

        <Connector label="JS + JSON" on={render} />

        <section className={styles.zone} data-on="true" data-wide="true">
          <span className={styles.zoneLabel}>
            User client <span className={styles.zoneMeta}>ChatGPT web</span>
          </span>
          <div className={styles.client}>
            <div className={styles.archCard}>
              <span className={styles.archTitle}>Client runtime</span>
              <span className={styles.archNote}>Sandboxed iframe + Web Worker</span>
              <code className={styles.archState}>seats = {render ? 8 : 9}</code>
              <ul className={styles.archList}>
                <li>Runs the program</li>
                <li>Keeps state, diffs the tree</li>
              </ul>
            </div>

            <Connector label="UI operations" on />

            <div className={styles.archCard}>
              <span className={styles.archTitle}>Rendering</span>
              <span className={styles.archNote}>ChatGPT&apos;s native components</span>
              <span className={styles.miniWidget}>
                <span className={styles.miniTitle}>Team plan estimate</span>
                <span className={styles.miniPrice}>
                  {render ? "$232" : "$261"}
                  <span>/mo</span>
                </span>
                <span className={styles.miniTrack}>
                  <span style={{ width: render ? "14%" : "16%" }} />
                </span>
              </span>
            </div>

            <div className={styles.loop} data-on={!render} aria-hidden="true">
              <span className={styles.loopLabel}>User events → callbacks</span>
            </div>
          </div>
        </section>

        <section className={styles.catalog}>
          <span className={styles.catalogTitle}>Design system and catalog</span>
          <span className={styles.catalogNote}>Components, properties, and design tokens</span>
          <span className={styles.catalogUses}>
            <span data-on={render}>The model chooses from it</span>
            <span data-on={render}>The compiler validates against it</span>
            <span data-on="true">The renderer draws with it</span>
          </span>
        </section>
      </div>

      <p className={styles.archFooter} aria-live="polite">
        <span className={styles.archFooterDot} />
        {MODES[mode].note}
      </p>
    </figure>
  );
}

function Connector({ label, on }: { label: string; on: boolean }) {
  return (
    <div className={styles.archConnector} data-on={on} aria-hidden="true">
      <span className={styles.archConnectorLabel}>{label}</span>
      <span className={styles.archConnectorLine} />
    </div>
  );
}
