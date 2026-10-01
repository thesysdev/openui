"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { Mascot } from "./mascot";
import { playTick, playTransmit } from "./radio-sounds";

/*
 * RadioInput: the chat box styled as an F1 team-radio caption. The mascot sits
 * "on air" beside a heavy RADIO wordmark, a meter of sharp bars sits flat and
 * jumps with every keystroke, and what you type is the red caption under it.
 * Enter or the ASK key (arrow up) transmits. Replies render elsewhere, not in here.
 */

export type RadioInputProps = {
  /** "full" has the RADIO masthead and a tall meter on the page. "compact" is a floating warm-white slanted bar: mascot, input, ASK. */
  size?: "full" | "compact";
  /** Small line above RADIO in the wordmark. */
  channel?: string;
  placeholder?: string;
  /** Controlled value. Leave unset to let the component hold its own text. */
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSend?: (value: string) => void;
  /** While an answer is on its way: typing still works, sending waits. */
  busy?: boolean;
  /** Longest question the input takes. */
  maxLength?: number;
  /** Radio clicks while typing and a squelch-and-chirp on send. Off by default. */
  sound?: boolean;
  style?: CSSProperties;
};

const RED = "#E10600";
const CARBON = "#15151E";
const WARM_WHITE = "#F7F4F1";
const BARS = 36;
const ITALIC_PAD = "0.2em";
const COMPACT_SLANT = 16;

const c = { bg: WARM_WHITE, ink: CARBON, muted: "#949498", rule: "#15151E26", idleBar: "#15151E33" };

const display = (wght: number, wdth: number): CSSProperties => ({
  fontFamily: '"Saira", sans-serif',
  fontStyle: "italic",
  fontWeight: wght,
  fontStretch: `${wdth}%`,
  fontVariationSettings: `"wght" ${wght}, "wdth" ${wdth}`,
  textTransform: "uppercase",
});

// Speaker icon from the team-radio graphic: a filled circle with the speaker cut in.
function SpeakerIcon({ color, knockout }: { color: string; knockout: string }) {
  return (
    <svg viewBox="0 0 24 24" width="0.72em" height="0.72em" aria-hidden style={{ flex: "none" }}>
      <circle cx="12" cy="12" r="12" fill={color} />
      <path d="M6 10h3l4-3.5v11L9 14H6z" fill={knockout} />
      <path d="M15.5 9.2a4 4 0 0 1 0 5.6M17.6 7.2a7 7 0 0 1 0 9.6" stroke={knockout} strokeWidth="1.8" fill="none" />
    </svg>
  );
}

// Arrow up, leaning with the italic type: a solid head over a stem cut into two
// blocks, so it reads fast like a kerb stripe. Uses currentColor.
function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 16 18" width="14" height="16" aria-hidden style={{ flex: "none", overflow: "visible" }}>
      <g transform="skewX(-12) translate(2 0)" fill="currentColor">
        <path d="M8 0 16 8.5H0z" />
        <path d="M5.5 10h5v3.5h-5z" />
        <path d="M5.5 15h5v3h-5z" />
      </g>
    </svg>
  );
}

const swap = (shown: boolean): CSSProperties => ({
  opacity: shown ? 1 : 0,
  transform: shown ? "none" : "scale(0.6)",
  transition: "opacity 160ms, transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
});

/** Drives the bar heights straight on the DOM so typing never re-renders the meter. */
function useMeter(barsRef: React.RefObject<HTMLDivElement | null>, energyRef: React.RefObject<number>) {
  useEffect(() => {
    const bars = Array.from(barsRef.current?.children ?? []) as HTMLElement[];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seeds = bars.map(() => Math.random() * Math.PI * 2);
    const levels = bars.map(() => 0.1);
    let frame = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      energyRef.current = Math.max(0, energyRef.current - dt * 1.2);
      const e = Math.min(energyRef.current, 1);
      bars.forEach((bar, i) => {
        // Idle: flat and still. Only typing moves the bars.
        const idle = 0.1;
        // Live: jittery, loudest in the middle like a voice band.
        const shape = 0.55 + 0.45 * Math.sin((i / Math.max(1, bars.length - 1)) * Math.PI);
        const live = e * shape * (0.45 + 0.55 * Math.abs(Math.sin(now / 140 + seeds[i] * 3)));
        const target = reduced ? 0.12 + e * shape * 0.5 : Math.max(idle, live);
        levels[i] += (target - levels[i]) * Math.min(1, dt * 10);
        bar.style.transform = `scaleY(${levels[i].toFixed(3)})`;
        bar.dataset.hot = levels[i] > 0.82 ? "peak" : levels[i] > 0.2 ? "live" : "idle";
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [barsRef, energyRef]);
}

export function RadioInput({
  size = "full",
  channel = "Pit Wall",
  placeholder = "Radio in your question…",
  value,
  defaultValue = "",
  onChange,
  onSend,
  busy = false,
  maxLength,
  sound = false,
  style,
}: RadioInputProps) {
  const [inner, setInner] = useState(defaultValue);
  const text = value ?? inner;
  const energyRef = useRef(0);
  const barsRef = useRef<HTMLDivElement>(null);
  const prevLength = useRef(text.length);
  const inputRef = useRef<HTMLInputElement>(null);
  // Our own caret (the native one can't be made thicker): where it sits and how far the text has scrolled.
  const [caret, setCaret] = useState<{ at: number; scroll: number } | null>(null);
  const syncCaret = () => {
    const el = inputRef.current;
    if (el && document.activeElement === el) setCaret({ at: el.selectionStart ?? el.value.length, scroll: el.scrollLeft });
  };
  useEffect(syncCaret, [text]);
  useMeter(barsRef, energyRef);

  // Any change in the text, typed or controlled, kicks the meter.
  useEffect(() => {
    if (text.length !== prevLength.current) energyRef.current = Math.min(1.4, energyRef.current + 0.6);
    prevLength.current = text.length;
  }, [text]);

  const live = text.length > 0;
  const setText = (next: string) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };
  const send = (e?: FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || busy) return;
    energyRef.current = 1.4;
    if (sound) playTransmit();
    onSend?.(text.trim());
    setText("");
  };

  // Level meter: sharp bars, scaled from the baseline.
  const meter = (count: number, box: CSSProperties) => (
    <div ref={barsRef} aria-hidden style={{ display: "flex", alignItems: "flex-end", ...box }}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="radio-bar" style={{ flex: 1, height: "100%", transformOrigin: "bottom", transform: "scaleY(0.1)" }} />
      ))}
    </div>
  );
  // Caption: what you're saying, in red.
  const field = (
    <label style={{ position: "relative", flex: 1, minWidth: 0, display: "flex", ...display(800, 100), fontSize: 22, lineHeight: 1.1, color: RED }}>
      <input
        ref={inputRef}
        aria-label="Message the radio"
        value={text}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => {
          if (sound) playTick();
          setText(e.target.value);
        }}
        onSelect={syncCaret}
        onKeyUp={syncCaret}
        onFocus={syncCaret}
        onScroll={syncCaret}
        onBlur={() => setCaret(null)}
        style={{
          flex: 1,
          minWidth: 0,
          // Room for the italic overhang, so the first and last letters aren't clipped.
          padding: `0 ${ITALIC_PAD}`,
          border: 0,
          background: "transparent",
          color: RED,
          font: "inherit",
          fontVariationSettings: "inherit",
          textTransform: "uppercase",
          caretColor: "transparent",
        }}
      />
      {caret && (
        // A hidden copy of the text up to the cursor pushes a thick, italic-slanted red bar into place.
        <span
          aria-hidden
          style={{ position: "absolute", inset: 0, padding: `0 ${ITALIC_PAD}`, overflow: "hidden", whiteSpace: "pre", pointerEvents: "none" }}
        >
          <span style={{ display: "inline-block", transform: `translateX(${-caret.scroll}px)` }}>
            <span style={{ visibility: "hidden" }}>{text.slice(0, caret.at)}</span>
            <span
              key={`${caret.at}-${text.length}`}
              style={{
                display: "inline-block",
                width: 4,
                height: "1em",
                marginLeft: -2,
                marginRight: -2,
                verticalAlign: "-0.12em",
                background: RED,
                transform: "skewX(-12deg)",
                // Lean from the baseline, like the italic glyphs around it.
                transformOrigin: "0 88%",
                animation: "radio-caret 1s steps(1) 500ms infinite",
              }}
            />
          </span>
        </span>
      )}
    </label>
  );
  const ask = (
    <button
      type="submit"
      className="radio-send"
      disabled={!live || busy}
      style={{
        flex: "none",
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 40,
        border: 0,
        ...(size === "compact"
          ? // In the slanted compact bar, ASK is the one round shape.
            { padding: "0 18px 0 20px", borderRadius: 999 }
          : // Slanted ends, like the angled panels on F1 broadcast graphics.
            { padding: "0 22px 0 24px", borderRadius: 0, clipPath: "polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)" }),
        cursor: "pointer",
        ...display(900, 112),
        fontSize: 16,
        letterSpacing: "0.06em",
        transition: "background 120ms, color 120ms",
      }}
    >
      Ask <ArrowUpIcon />
    </button>
  );

  return (
    <form
      className="radio-input"
      onSubmit={send}
      // A press anywhere on the input (mascot, padding, empty space) focuses the text field.
      onMouseDown={(e) => {
        const el = inputRef.current;
        const target = e.target as HTMLElement;
        if (!el || target === el || target.closest("button")) return;
        e.preventDefault();
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }}
      style={{
        color: c.ink,
        cursor: "text",
        ...(size === "compact" && {
          // Slanted ends, like the angled panels on F1 broadcast graphics.
          padding: `8px ${COMPACT_SLANT + 8}px 8px ${COMPACT_SLANT + 6}px`,
          clipPath: `polygon(${COMPACT_SLANT}px 0, 100% 0, calc(100% - ${COMPACT_SLANT}px) 100%, 0 100%)`,
          background: WARM_WHITE,
        }),
        ...style,
      }}
    >
      <style>{`
        .radio-input .radio-bar { background: ${c.idleBar}; }
        .radio-input .radio-bar[data-hot="live"] { background: ${RED}; }
        .radio-input .radio-bar[data-hot="peak"] { background: ${CARBON}; }
        .radio-input .radio-dot .radio-bar[data-hot] { background: ${WARM_WHITE}; }
        .radio-input input::placeholder { color: ${c.muted}; opacity: 1; }
        .radio-input input:focus { outline: none; }
        .radio-input .radio-send { background: ${RED}; color: ${WARM_WHITE}; }
        .radio-input .radio-send:hover { background: ${CARBON}; color: ${WARM_WHITE}; }
        .radio-input .radio-send:disabled { background: ${c.rule}; color: ${c.muted}; cursor: default; }
        @keyframes radio-onair { 50% { opacity: 0.25; } }
        @keyframes radio-caret { 50% { opacity: 0; } }
      `}</style>

      {size === "compact" ? (
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* While typing, the mascot hands over to a round radio badge with live bars. */}
          <div style={{ position: "relative", flex: "none", width: 48, height: 48 }}>
            <div style={{ position: "absolute", inset: 0, ...swap(!live) }}>
              <Mascot size={48} alt="Radio" />
            </div>
            <div
              className="radio-dot"
              style={{ position: "absolute", inset: 6, display: "grid", placeItems: "center", borderRadius: "50%", background: RED, ...swap(live) }}
            >
              {meter(5, { gap: 2, width: 20, height: 15 })}
            </div>
          </div>
          {field}
          {ask}
        </div>
      ) : (
        <>
          {/* Masthead: mascot on air + wordmark + status. */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ flex: "none" }}>
              <Mascot size={64} alt="Radio" />
            </div>
            <div style={{ lineHeight: 0.86 }}>
              <div style={{ ...display(900, 112), fontSize: 15, letterSpacing: "0.04em", color: c.muted }}>{channel}</div>
              <div style={{ ...display(900, 112), fontSize: 44, display: "flex", alignItems: "center", gap: 8, color: c.ink }}>
                <SpeakerIcon color={RED} knockout={c.bg} />
                Radio
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, ...display(700, 87), fontStyle: "normal", fontSize: 14, letterSpacing: "0.08em" }}>
              <span
                style={{ width: 10, height: 10, background: live ? RED : c.muted, animation: live ? "radio-onair 900ms steps(1) infinite" : undefined }}
              />
              <span style={{ color: live ? RED : c.muted }}>{live ? "On air" : "Standby"}</span>
            </div>
          </div>

          {meter(BARS, { gap: 3, height: 34, margin: "18px 0 16px" })}

          <div style={{ borderTop: `2px solid ${c.rule}`, paddingTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
            {field}
            {ask}
          </div>
        </>
      )}
    </form>
  );
}

// Types a line on a loop so the gallery can show the meter reacting.
function TypingDemo(props: Omit<RadioInputProps, "value" | "onChange">) {
  const line = "Who has the fastest sector two in Monza?";
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setN((k) => (k > line.length + 14 ? 0 : k + 1)), n === 0 ? 900 : 70 + Math.random() * 90);
    return () => clearTimeout(id);
  }, [n]);
  return <RadioInput {...props} value={line.slice(0, n)} />;
}

export function RadioInputPreview() {
  const [sound, setSound] = useState(false);
  return (
    <div style={{ display: "grid", gap: 28, maxWidth: 720 }}>
      <button
        type="button"
        onClick={() => setSound((on) => !on)}
        style={{
          justifySelf: "start",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          border: 0,
          borderRadius: 0,
          background: sound ? RED : "#15151E14",
          color: sound ? WARM_WHITE : CARBON,
          cursor: "pointer",
          ...display(900, 112),
          fontSize: 14,
          letterSpacing: "0.06em",
        }}
      >
        <SpeakerIcon color={sound ? WARM_WHITE : RED} knockout={sound ? RED : WARM_WHITE} />
        Sound {sound ? "on" : "off"}
      </button>
      <div style={{ display: "grid", gap: 8 }}>
        <span className="asset-round">IDLE · TRY IT</span>
        <RadioInput sound={sound} />
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <span className="asset-round">TYPING</span>
        <TypingDemo />
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <span className="asset-round">COMPACT · TRY IT</span>
        <RadioInput size="compact" sound={sound} />
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        <span className="asset-round">COMPACT · TYPING</span>
        <TypingDemo size="compact" />
      </div>
      <p className="ref-note">
        <code>{'<RadioInput onSend={fn} />'}</code>. Props: <code>size</code> (full, compact: a floating warm-white slanted bar),{" "}
        <code>channel</code>, <code>placeholder</code>, <code>value</code>, <code>onChange</code>,{" "}
        <code>onSend</code>, <code>sound</code>. Typing clicks are synthesised with Web Audio; the send sound is <code>public/sounds/f1-radio-send.mp3</code>. The typing loops stay silent. Not wired into the chat yet.
      </p>
    </div>
  );
}
