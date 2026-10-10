"use client";

import { useState } from "react";
import styles from "./intelligent-ui-demo.module.css";

const PRICE = 29;
const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;

export function SliderInteraction() {
  // Start on the example from the text: the slider has just moved from 8 to 9.
  const [seats, setSeats] = useState(9);
  const [previous, setPrevious] = useState(8);
  const [interactions, setInteractions] = useState(0);

  const onChange = (next: number) => {
    if (next === seats) return;
    setPrevious(seats);
    setSeats(next);
    setInteractions((n) => n + 1);
  };

  const price = seats * PRICE;

  return (
    <figure
      className={`${styles.card} not-prose`}
      aria-label="Interactive illustration: moving the slider sends a callback to the sandboxed worker, which updates state and sends UI operations back to the page. No model call is made."
    >
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Local interaction</p>
          <p className={styles.title}>What happens when you move the slider</p>
          <p className={styles.subtitle}>
            Drag it. The worker updates state and sends back operations, without calling the model.
          </p>
        </div>
      </div>

      <div className={styles.flow}>
        <section className={styles.stage}>
          <div className={styles.stageHead}>
            <span className={styles.stageLabel}>ChatGPT page</span>
            <span className={styles.badge}>Native renderer</span>
          </div>
          <div className={styles.widget}>
            <span className={styles.widgetTitle}>Team plan estimate</span>
            <span className={styles.widgetPrice}>
              <span key={price} className={styles.flash}>
                {fmt(price)}
              </span>
              <span className={styles.widgetUnit}>/mo</span>
            </span>
            <label className={styles.widgetSeats} htmlFor="seat-slider">
              {seats} {seats === 1 ? "seat" : "seats"}
            </label>
            <input
              id="seat-slider"
              className={styles.range}
              type="range"
              min={1}
              max={50}
              value={seats}
              onChange={(e) => onChange(Number(e.target.value))}
              style={{ "--fill": `${((seats - 1) / 49) * 100}%` } as React.CSSProperties}
            />
          </div>
        </section>

        <div className={styles.wires} aria-hidden="true">
          <div className={styles.wire} data-dir="out">
            <span className={styles.wireLabel}>
              callback <span className={styles.mono}>fn#1({seats})</span>
            </span>
            <span className={styles.wireLine}>
              <span key={`out-${interactions}`} className={styles.pulse} />
            </span>
          </div>
          <div className={styles.wire} data-dir="back">
            <span className={styles.wireLine}>
              <span key={`back-${interactions}`} className={styles.pulse} />
            </span>
            <span className={styles.wireLabel}>UI operations</span>
          </div>
        </div>

        <section className={styles.stage}>
          <div className={styles.stageHead}>
            <span className={styles.stageLabel}>Sandboxed worker</span>
            <span className={styles.badge}>Runs the program</span>
          </div>
          <div className={styles.worker} key={interactions}>
            <div className={styles.workerBlock}>
              <span className={styles.workerHeading}>State</span>
              <code className={styles.workerLine}>
                <span className={styles["tok-tag"]}>setSeats</span>({seats})
              </code>
              <code className={styles.workerLine}>
                seats <span className={styles.dim}>{previous} →</span> {seats}
              </code>
              <code className={styles.workerLine}>
                price <span className={styles.dim}>{seats} × $29 =</span> {fmt(price)}
              </code>
            </div>
            <div className={styles.workerBlock}>
              <span className={styles.workerHeading}>Then</span>
              <span className={styles.workerText}>Re-renders the component</span>
              <span className={styles.workerText}>Compares the new tree with the previous one</span>
              <span className={styles.workerText}>
                Returns the differences as update operations
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className={styles.counters}>
        <span>
          Interactions <strong>{interactions}</strong>
        </span>
        <span>
          Model calls <strong data-tone="accent">0</strong>
        </span>
      </div>
    </figure>
  );
}
