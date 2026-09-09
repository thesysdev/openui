"use client";

import { ArrowRight } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import styles from "./page.module.css";

/* How long the confirmation hangs around before fading out. Long enough to read
   twice, short enough that it is gone by the time you scroll. */
const NOTICE_MS = 4000;

const SUCCESS = "You’re on the waitlist.";
const OFFLINE = "Could not reach the server. Please try again.";
const FALLBACK = "Something went wrong. Please try again.";

type Status = "idle" | "pending" | "done" | "error";

/* The hero's only call to action: an email capture, posted to /api/waitlist.
 *
 * The one rule worth preserving here: never show the confirmation unless the
 * server actually stored the address. A waitlist that reports success while
 * dropping signups is invisibly broken to everyone involved.
 */
export function EarlyAccessForm() {
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState(SUCCESS);
  const timer = useRef<number | null>(null);
  const notice = status === "done" || status === "error";

  /* A pending dismissal must not outlive the component. */
  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const flash = (text: string, next: Status) => {
    setMessage(text);
    setStatus(next);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus("idle"), NOTICE_MS);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const address = email.trim();
    if (!address || status === "pending") return;

    setStatus("pending");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: address }),
      });

      if (!response.ok) {
        /* The route sends a human-readable reason; fall back if it did not. */
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        flash(body?.error ?? FALLBACK, "error");
        return;
      }

      /* Clearing on success only, so a failed attempt keeps what was typed and
         the retry costs nothing. */
      setEmail("");
      flash(SUCCESS, "done");
    } catch {
      flash(OFFLINE, "error");
    }
  };

  return (
    <div className={styles.ctaGroup}>
      <form className={styles.emailForm} onSubmit={submit} noValidate>
        <label className={styles.emailLabel} htmlFor={inputId}>
          Work email
        </label>
        <input
          id={inputId}
          className={styles.emailInput}
          type="email"
          name="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your work email"
          autoComplete="email"
          required
        />
        <button
          className={styles.emailSubmit}
          type="submit"
          aria-label="Join waitlist"
          /* Guards the double-submit; the label does not change, so the control
             keeps its width while the request is in flight. */
          disabled={status === "pending"}
        >
          <span className={styles.emailSubmitText}>Join waitlist</span>
          <ArrowRight className={styles.emailSubmitIcon} size={16} weight="bold" />
        </button>
      </form>

      {/* Floats under the field rather than sitting in the layout, so showing it
          moves nothing. role="status" announces it without stealing focus. */}
      <p
        className={[
          styles.emailNotice,
          notice ? styles.emailNoticeVisible : "",
          status === "error" ? styles.emailNoticeError : "",
        ]
          .filter(Boolean)
          .join(" ")}
        role="status"
      >
        {message}
      </p>
    </div>
  );
}
