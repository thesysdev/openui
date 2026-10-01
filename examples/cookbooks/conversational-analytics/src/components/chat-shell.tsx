"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChatJumpToLatest } from "./chat";
import { InputIntro } from "./input-intro";
import { RadioInput, type RadioInputProps } from "./radio-input";

/*
 * ChatShell: the page frame for the Radio chatbot. A white page with a
 * scrolling thread and the compact RadioInput floating at the bottom centre.
 * It owns layout only; the thread content and what happens on send come in as props.
 */

export type ChatShellProps = {
  /** The conversation. Scrolls behind the floating input. */
  children?: ReactNode;
  /** Shown when there is no conversation yet. */
  empty?: ReactNode;
  /** A full-width page (a dashboard) shown instead of `empty` when there is no conversation. It runs from the top. */
  page?: ReactNode;
  /** Passed straight to the RadioInput. */
  input?: Omit<RadioInputProps, "size">;
  /** Changes when a different conversation opens: it opens at its latest question. */
  threadKey?: string | null;
};

const CARBON = "#15151E";
const WHITE = "#FFFFFF";
const INPUT_WIDTH = 760;
// Dashboards use more of the page than the conversation.
const PAGE_WIDTH = 1180;
// Thread padding: room above the first line, and below the last one for the floating input.
const PAD_TOP = 32;
const PAD_BOTTOM = 160;
// Bottom fade: the thread is clear down to FADE_FROM above the bottom edge, then fades out by FADE_TO,
// where the input bar starts. PAD_BOTTOM keeps the last line above the fade once scrolled to the end.
const FADE_FROM = 156;
const FADE_TO = 84;
const FADE_MASK = `linear-gradient(to bottom, #000 calc(100% - ${FADE_FROM}px), transparent calc(100% - ${FADE_TO}px))`;
// Each question the reader sent. A new one scrolls to the top of the page.
const QUESTION = ".f1c-user";
const HOLD_MS = 2000;

export function ChatShell({ children, empty, page, input, threadKey }: ChatShellProps) {
  const hasThread = children != null && children !== false;
  const threadRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  // How many questions the thread showed last time, and whether it has just opened.
  const questionsRef = useRef(0);
  const openingRef = useRef(true);
  // The answer runs on below the fold: offer the way down.
  const [away, setAway] = useState(false);

  const toLatest = () => {
    const thread = threadRef.current;
    const content = contentRef.current;
    if (!thread || !content) return;
    const below = content.getBoundingClientRect().bottom - (thread.getBoundingClientRect().bottom - PAD_BOTTOM);
    thread.scrollTo({ top: thread.scrollTop + below, behavior: "smooth" });
  };

  // A different conversation opens at its latest question, without animating.
  useEffect(() => {
    questionsRef.current = 0;
    openingRef.current = true;
    setAway(false);
  }, [threadKey]);

  // A different page opens at its top.
  const showPage = !hasThread && page != null;
  useEffect(() => {
    if (showPage) threadRef.current?.scrollTo({ top: 0 });
  }, [threadKey, showPage]);

  // Standard chat scrolling: a new question moves to the top of the page and its answer
  // streams into the space below it. The spacer under the thread keeps that space there
  // until the answer fills it; nothing follows the stream after that, so reading back stays put.
  useEffect(() => {
    const thread = threadRef.current;
    const content = contentRef.current;
    const spacer = spacerRef.current;
    if (!thread || !content || !spacer) return;

    const measureAway = () => {
      // Two thresholds (show past 96px, hide under 24px) so the button doesn't flicker at the edge.
      const below = content.getBoundingClientRect().bottom - (thread.getBoundingClientRect().bottom - PAD_BOTTOM);
      setAway((was) => (was ? below > 24 : below > 96));
    };
    const update = () => {
      const questions = content.querySelectorAll<HTMLElement>(QUESTION);
      const last = questions[questions.length - 1];
      let room = 0;
      if (last) {
        const used = content.getBoundingClientRect().bottom - last.getBoundingClientRect().top;
        room = Math.max(0, thread.clientHeight - PAD_TOP - PAD_BOTTOM - used);
      }
      spacer.style.height = `${room}px`;
      const anchor = (smooth: boolean) => {
        const top = last.getBoundingClientRect().top - thread.getBoundingClientRect().top + thread.scrollTop - PAD_TOP;
        thread.scrollTo({ top: Math.max(0, top), behavior: smooth ? "smooth" : "auto" });
      };
      if (last && questions.length !== questionsRef.current) {
        // An opening thread holds its latest question in place while the answers above it
        // finish laying out (charts and tables size themselves after mount).
        if (openingRef.current) holdUntil = Date.now() + HOLD_MS;
        anchor(!openingRef.current);
        openingRef.current = false;
      } else if (last && Date.now() < holdUntil) anchor(false);
      questionsRef.current = questions.length;
      measureAway();
    };
    // Any scroll the reader starts ends the hold.
    let holdUntil = 0;
    const release = () => {
      holdUntil = 0;
    };

    const observer = new ResizeObserver(update);
    observer.observe(content);
    observer.observe(thread);
    thread.addEventListener("scroll", measureAway, { passive: true });
    for (const type of ["wheel", "touchstart", "keydown", "pointerdown"]) thread.addEventListener(type, release, { passive: true });
    return () => {
      observer.disconnect();
      thread.removeEventListener("scroll", measureAway);
      for (const type of ["wheel", "touchstart", "keydown", "pointerdown"]) thread.removeEventListener(type, release);
    };
  }, []);
  return (
    // Only the thread scrolls, and only when it overflows; the page itself never does.
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", overflow: "hidden", background: WHITE, color: CARBON }}>
      <main style={{ position: "relative", flex: 1, minHeight: 0 }}>
        {/* Thread: bottom padding keeps the last message clear of the floating input. */}
        <div
          ref={threadRef}
          style={{
            boxSizing: "border-box",
            height: "100%",
            overflowY: "auto",
            overscrollBehavior: "contain",
            padding: `${PAD_TOP}px 24px ${PAD_BOTTOM}px`,
            // Content fades out as it scrolls under the input instead of meeting a hard white edge.
            maskImage: FADE_MASK,
            WebkitMaskImage: FADE_MASK,
          }}
        >
          <div
            ref={contentRef}
            // The empty state sits centred in the page; a thread runs from the top.
            style={
              showPage
                ? { maxWidth: PAGE_WIDTH, margin: "0 auto" }
                : { maxWidth: INPUT_WIDTH, margin: "0 auto", ...(hasThread ? null : { minHeight: "100%", display: "grid", alignContent: "center" }) }
            }
          >
            {hasThread ? children : showPage ? page : empty}
          </div>
          <div ref={spacerRef} aria-hidden />
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            boxSizing: "border-box",
            padding: "0 24px 28px",
            paddingTop: 16,
          }}
        >
          {hasThread && away && (
            <div style={{ position: "absolute", left: 0, right: 0, bottom: "100%", display: "flex", justifyContent: "center", paddingBottom: 12, pointerEvents: "none" }}>
              <span style={{ pointerEvents: "auto" }}>
                <ChatJumpToLatest onClick={toLatest} />
              </span>
            </div>
          )}
          <div style={{ maxWidth: INPUT_WIDTH, margin: "0 auto" }}>
            <InputIntro autoFocus>
              <RadioInput size="compact" {...input} />
            </InputIntro>
          </div>
        </div>
      </main>
    </div>
  );
}
