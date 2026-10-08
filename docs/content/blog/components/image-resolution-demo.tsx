"use client";

import { useEffect, useState } from "react";
import styles from "./image-resolution-demo.module.css";

const stages = [
  "The LLM generates an AsyncImage block",
  "The UI shows a loader and requests the image",
  "The search endpoint returns the image",
  "The image appears in the UI",
];

export function ImageResolutionDemo() {
  const [step, setStep] = useState(3);
  const [playing, setPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReducedMotion(preference.matches);
      setPlaying(!preference.matches);
      setStep(preference.matches ? 3 : 0);
    };
    sync();
    preference.addEventListener("change", sync);
    return () => preference.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => setStep((current) => (current + 1) % 4), step === 3 ? 3200 : 2400);
    return () => window.clearTimeout(timer);
  }, [playing, step]);

  return (
    <figure className={`${styles.figure} not-prose`} data-step={step} data-playing={playing} aria-label="Animated illustration: an AsyncImage block renders a loading image while the UI requests an image search, then displays the result.">
      <header className={styles.header}>
        <div><h3>From query to image</h3><p>Illustrative sequence</p></div>
        {!reducedMotion && <button type="button" className={styles.play} onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause image resolution animation" : "Play image resolution animation"}>{playing ? "Pause" : "Play"}</button>}
      </header>

      <div className={styles.scene}>
        <div className={styles.source}>
          <span className={styles.label}>LLM OUTPUT</span>
          <div className={styles.code}><span className={styles.tag}>&lt;AsyncImage</span><br />{'  '}query=<span className={styles.string}>"slow roasted<br />{'    '}lamb shoulder"</span><br /><span className={styles.tag}>/&gt;</span></div>
        </div>
        <div className={styles.forward} data-active={step >= 1} aria-hidden="true">→</div>
        <div className={styles.preview}>
          <span className={styles.label}>CLIENT UI</span>
          <div className={styles.menu} data-visible={step >= 1}>
            <div className={styles.imageSlot} aria-busy={step === 1 || step === 2}>
              <div className={styles.loader} data-visible={step < 3}><span className={styles.spinner} /><span>Finding image</span></div>
              <img src="/images/blog/intelligent-ui/lamb-roast.png" width={154} height={124} alt="Roast lamb with potatoes and herbs" className={styles.photo} data-visible={step === 3} />
            </div>
            <div className={styles.menuText}><span>THE MENU</span><strong>Slow-roasted lamb</strong><p>Rosemary, garlic &amp; lemon</p></div>
          </div>
        </div>
        <div className={styles.searchFlow} data-visible={step >= 1}>
          <div className={styles.connection}><span className={styles.request} data-active={step === 1}>↓ image query</span><span className={styles.response} data-active={step >= 2}>image result ↑</span></div>
          <div className={styles.endpoint}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></svg><span>Image search endpoint</span><span className={styles.status}>{step === 1 ? "Searching…" : "Found"}</span></div>
        </div>
      </div>

      <footer className={styles.footer}><div className={styles.steps} aria-label="Animation steps">{stages.map((label, index) => <button key={label} type="button" aria-label={`Step ${index + 1}: ${label}`} aria-pressed={step === index} onClick={() => {setPlaying(false);setStep(index);}}>{index + 1}</button>)}</div><span>{stages[step]}</span></footer>
    </figure>
  );
}
