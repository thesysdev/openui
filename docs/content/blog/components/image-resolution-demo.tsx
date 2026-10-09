"use client";

import { useEffect, useState } from "react";
import styles from "./intelligent-ui-demo.module.css";
import { PauseIcon, PlayIcon, usePlayback, useReducedMotion } from "./playback";

const STEPS = [
  { label: "The model writes an AsyncImage tag", duration: 2600 },
  { label: "The server runs an image search", duration: 1900 },
  { label: "The result is patched into the response", duration: 1300 },
  { label: "ChatGPT draws the image", duration: 3400 },
];

const CODE: { text: string; kind?: "tag" | "attr" | "str" }[] = [
  { text: "<AsyncImage", kind: "tag" },
  { text: "\n  " },
  { text: "query", kind: "attr" },
  { text: "=" },
  {
    text: '"slow roasted rosemary garlic lamb shoulder browned golden roast in baking tray"',
    kind: "str",
  },
  { text: "\n  " },
  { text: "aspectRatio", kind: "attr" },
  { text: "=" },
  { text: '"5:4"', kind: "str" },
  { text: "\n  " },
  { text: "maxWidth", kind: "attr" },
  { text: "=" },
  { text: '"152px"', kind: "str" },
  { text: "\n" },
  { text: "/>", kind: "tag" },
];
const CODE_LENGTH = CODE.reduce((n, part) => n + part.text.length, 0);
// Character offset at which each part starts.
const CODE_OFFSETS = CODE.map((_, i) => CODE.slice(0, i).reduce((n, p) => n + p.text.length, 0));

const CHECKS = ["Tag complete", "Image search", "URLs checked", "Result patched in"];

function checkState(step: number, index: number) {
  // Which server checks are done / in progress at each step.
  const done = [0, 1, 3, 4][step];
  if (index < done) return "done";
  if (index === done && (step === 1 || step === 2)) return "active";
  return "pending";
}

const TYPE_MS = STEPS[0].duration - 400;

// Types the tag out from scratch each time it mounts.
function TypingCode() {
  const [chars, setChars] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const timer = window.setInterval(() => {
      const progress = (performance.now() - start) / TYPE_MS;
      setChars(Math.min(CODE_LENGTH, Math.round(progress * CODE_LENGTH)));
    }, 30);
    return () => window.clearInterval(timer);
  }, []);
  return <Code chars={chars} typing={chars < CODE_LENGTH} />;
}

function Code({ chars, typing }: { chars: number; typing: boolean }) {
  return (
    <pre className={styles.code} aria-label="AsyncImage tag written by the model">
      {CODE.map((part, i) => {
        const text = part.text.slice(0, Math.max(0, chars - CODE_OFFSETS[i]));
        if (!text) return null;
        return (
          <span key={i} className={part.kind ? styles[`tok-${part.kind}`] : undefined}>
            {text}
          </span>
        );
      })}
      {typing && <span className={styles.caret} aria-hidden="true" />}
    </pre>
  );
}

const Check = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M2.5 6.5l2.2 2.2 4.8-5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function ImageResolutionDemo() {
  const reducedMotion = useReducedMotion();
  const { ref, step, playing, setPlaying, goTo } = usePlayback(STEPS, reducedMotion);
  const tagComplete = step > 0;
  const loading = step === 1 || step === 2;

  return (
    <figure
      ref={ref}
      className={`${styles.card} not-prose`}
      aria-label="Illustration: the model writes an AsyncImage tag, the server searches for an image and patches it into the response, and ChatGPT renders it."
    >
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Server-defined component</p>
          <p className={styles.title}>How an AsyncImage becomes a picture</p>
        </div>
        <button
          type="button"
          className={styles.control}
          onClick={() => setPlaying(!playing)}
          aria-label={playing ? "Pause animation" : "Play animation"}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
          {playing ? "Pause" : "Play"}
        </button>
      </div>

      <div className={styles.pipeline}>
        <section className={styles.stage} data-active={step === 0}>
          <div className={styles.stageHead}>
            <span className={styles.stageLabel}>Model</span>
            <span className={styles.badge} data-tone={tagComplete ? "accent" : undefined}>
              {tagComplete ? "Tag complete" : "Streaming…"}
            </span>
          </div>
          {step > 0 ? (
            <Code chars={CODE_LENGTH} typing={false} />
          ) : playing ? (
            <TypingCode />
          ) : (
            // Paused mid-stream: show a partly written tag.
            <Code chars={Math.round(CODE_LENGTH * 0.62)} typing />
          )}
        </section>

        <div className={styles.connector} data-active={step >= 1} aria-hidden="true" />

        <section className={styles.stage} data-active={step === 1 || step === 2}>
          <div className={styles.stageHead}>
            <span className={styles.stageLabel}>Backend server</span>
            <span className={styles.badge} data-tone={step === 3 ? "accent" : undefined}>
              {step === 0 ? "Waiting" : step === 3 ? "A second or two" : "Searching…"}
            </span>
          </div>
          <ul className={styles.checks}>
            {CHECKS.map((label, i) => {
              const state = checkState(step, i);
              return (
                <li key={label} className={styles.check} data-state={state}>
                  <span className={styles.dot}>{state === "done" && <Check />}</span>
                  {label}
                </li>
              );
            })}
          </ul>
        </section>

        <div className={styles.connector} data-active={step >= 2} aria-hidden="true" />

        <section className={styles.stage} data-active={step === 3}>
          <div className={styles.stageHead}>
            <span className={styles.stageLabel}>ChatGPT</span>
            <span className={styles.badge} data-tone={step === 3 ? "accent" : undefined}>
              {step === 0 ? "Not drawn yet" : loading ? "Loading" : "Rendered"}
            </span>
          </div>
          <div className={styles.message}>
            <div className={styles.skeletonLine} style={{ width: "92%" }} />
            <div className={styles.dish} data-visible={step > 0}>
              <div className={styles.thumb} data-loading={loading}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/blog/intelligent-ui/lamb-roast.png"
                  width={154}
                  height={124}
                  alt="Slow-roasted lamb shoulder with potatoes and herbs"
                  data-visible={step === 3}
                />
              </div>
              <div className={styles.dishText}>
                <span className={styles.dishKicker}>The menu</span>
                <span className={styles.dishName}>Slow-roasted lamb</span>
                <span className={styles.dishNote}>Rosemary, garlic &amp; lemon</span>
              </div>
            </div>
            <div className={styles.skeletonLine} style={{ width: "64%" }} />
          </div>
        </section>
      </div>

      <div className={styles.track} style={{ "--steps": STEPS.length } as React.CSSProperties}>
        {STEPS.map((s, i) => (
          <button
            key={s.label}
            type="button"
            className={styles.trackStep}
            data-state={i < step ? "done" : i === step ? "active" : "pending"}
            data-playing={playing}
            aria-current={i === step ? "step" : undefined}
            aria-label={`Step ${i + 1}: ${s.label}`}
            onClick={() => goTo(i)}
            style={{ "--duration": `${s.duration}ms` } as React.CSSProperties}
          >
            <span className={styles.bar}>
              <span key={`${step}-${playing}`} />
            </span>
            <span className={styles.trackLabel}>
              <span className={styles.stepNum}>{i + 1}</span>
              {s.label}
            </span>
          </button>
        ))}
        <span className={styles.trackCaption}>
          <span className={styles.stepNum}>{step + 1}</span>
          {STEPS[step].label}
        </span>
      </div>
    </figure>
  );
}
