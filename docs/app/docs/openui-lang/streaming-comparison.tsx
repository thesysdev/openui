"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw, Check } from "lucide-react";

const JSON_CODE = `{
  "component": {
    "component": "Stack",
    "props": {
      "children": [
        {
          "component": "TextContent",
          "props": {
            "text": "Contact Us",
            "size": "large-heavy"
          }
        },
        {
          "component": "Form",
          "props": {
            "name": "contact",
            "fields": [
              {
                "component": "FormControl",
                "props": {
                  "label": "Name",
                  "input": {
                    "component": "Input",
                    "props": {
                      "name": "name",
                      "placeholder": "Your full name",
                      "type": "text",
                      "rules": [
                        "required",
                        "minLength:2"
                      ]
                    }
                  }
                }
              },
              {
                "component": "FormControl",
                "props": {
                  "label": "Email",
                  "input": {
                    "component": "Input",
                    "props": {
                      "name": "email",
                      "placeholder": "you@example.com",
                      "type": "email",
                      "rules": [
                        "required",
                        "email"
                      ]
                    }
                  }
                }
              },
              {
                "component": "FormControl",
                "props": {
                  "label": "Phone",
                  "input": {
                    "component": "Input",
                    "props": {
                      "name": "phone",
                      "placeholder": "e.g., +1 555 123 4567",
                      "type": "text",
                      "rules": [
                        "required",
                        "minLength:7",
                        "maxLength:20"
                      ]
                    }
                  }
                }
              },
              {
                "component": "FormControl",
                "props": {
                  "label": "Subject",
                  "input": {
                    "component": "Select",
                    "props": {
                      "name": "subject",
                      "items": [
                        {
                          "component": "SelectItem",
                          "props": {
                            "value": "general",
                            "label": "General inquiry"
                          }
                        },
                        {
                          "component": "SelectItem",
                          "props": {
                            "value": "support",
                            "label": "Support"
                          }
                        },
                        {
                          "component": "SelectItem",
                          "props": {
                            "value": "sales",
                            "label": "Sales"
                          }
                        },
                        {
                          "component": "SelectItem",
                          "props": {
                            "value": "billing",
                            "label": "Billing"
                          }
                        },
                        {
                          "component": "SelectItem",
                          "props": {
                            "value": "feedback",
                            "label": "Feedback"
                          }
                        }
                      ],
                      "placeholder": "Select a subject...",
                      "rules": [
                        "required"
                      ]
                    }
                  }
                }
              },
              {
                "component": "FormControl",
                "props": {
                  "label": "Message",
                  "input": {
                    "component": "TextArea",
                    "props": {
                      "name": "message",
                      "placeholder": "How can we help?",
                      "rows": 6,
                      "rules": [
                        "required",
                        "minLength:10"
                      ]
                    }
                  }
                }
              }
            ],
            "buttons": {
              "component": "Buttons",
              "props": {
                "buttons": [
                  {
                    "component": "Button",
                    "props": {
                      "label": "Submit",
                      "action": "submit:contact",
                      "variant": "primary"
                    }
                  },
                  {
                    "component": "Button",
                    "props": {
                      "label": "Cancel",
                      "action": "action:cancel_contact",
                      "variant": "secondary"
                    }
                  }
                ],
                "direction": "row"
              }
            }
          }
        }
      ],
      "direction": "column",
      "gap": "l"
    }
  },
  "error": null
}`;

const OPENUI_CODE = `root = Stack([title, form], "column", "l")
title = TextContent("Contact Us", "large-heavy")
form = Form("contact", [nameField, emailField, phoneField, subjectField, messageField], formButtons)
nameField = FormControl("Name", Input("name", "Your full name", "text", ["required", "minLength:2"]))
emailField = FormControl("Email", Input("email", "you@example.com", "email", ["required", "email"]))
phoneField = FormControl("Phone", Input("phone", "e.g., +1 555 123 4567", "text", ["required", "minLength:7", "maxLength:20"]))
subjectField = FormControl("Subject", Select("subject", subjectOptions, "Select a subject...", ["required"]))
messageField = FormControl("Message", TextArea("message", "How can we help?", 6, ["required", "minLength:10"]))
subjectOptions = [SelectItem("general", "General inquiry"), SelectItem("support", "Support"), SelectItem("sales", "Sales"), SelectItem("billing", "Billing"), SelectItem("feedback", "Feedback")]
formButtons = Buttons([submitBtn, cancelBtn], "row")
submitBtn = Button("Submit", "submit:contact", "primary")
cancelBtn = Button("Cancel", "action:cancel_contact", "secondary")`;

// Calculated using openai tokenizer, https://platform.openai.com/tokenizer 
const JSON_TOKENS = 849;
const OPENUI_TOKENS = 294;
const TOKEN_RATE = 60; // tokens per second

const JSON_DURATION = JSON_TOKENS / TOKEN_RATE; // ~5.7s
const OPENUI_DURATION = OPENUI_TOKENS / TOKEN_RATE; // ~2.0s

type StreamState = "idle" | "streaming" | "done";

function StreamingCodeBlock({
  code,
  charCount,
  totalTokens,
  currentTokens,
  elapsed,
  totalDuration,
  state,
  label,
  variant,
}: {
  code: string;
  charCount: number;
  totalTokens: number;
  currentTokens: number;
  elapsed: number;
  totalDuration: number;
  state: StreamState;
  label: string;
  variant: "red" | "green";
}) {
  const preRef = useRef<HTMLPreElement>(null);
  const displayedCode = code.slice(0, charCount);
  const isDone = state === "done";

  useEffect(() => {
    if (preRef.current && state === "streaming") {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [charCount, state]);

  const pillBg = variant === "red"
    ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
    : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400";

  const doneBg = variant === "red"
    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold sm:text-lg">{label}</h3>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isDone ? doneBg : pillBg}`}>
            {state === "streaming"
              ? `${currentTokens}/${totalTokens} tokens`
              : `${totalTokens} tokens`}
          </span>
          {state === "streaming" && (
            <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {elapsed.toFixed(1)}s
            </span>
          )}
          {isDone && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <Check size={12} /> {totalDuration.toFixed(1)}s
            </span>
          )}
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-[--color-doc-border]">
        <pre
          ref={preRef}
          className="h-100 overflow-y-auto bg-[--color-doc-code-bg] p-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300"
        >
          <code className="border-0! bg-transparent!">
            {displayedCode}
            {state === "streaming" && (
              <span className="inline-block h-4 w-0.5 animate-pulse bg-slate-500 align-text-bottom dark:bg-slate-400" />
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}

export function StreamingComparison() {
  const [state, setState] = useState<StreamState>("idle");
  const [jsonChars, setJsonChars] = useState(0);
  const [openuiChars, setOpenuiChars] = useState(0);
  const [jsonTokens, setJsonTokens] = useState(0);
  const [openuiTokens, setOpenuiTokens] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [jsonDone, setJsonDone] = useState(false);
  const [openuiDone, setOpenuiDone] = useState(false);
  const rafRef = useRef<number>(0);
  const startRef = useRef(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasAutoPlayed = useRef(false);

  const reset = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setState("idle");
    setJsonChars(0);
    setOpenuiChars(0);
    setJsonTokens(0);
    setOpenuiTokens(0);
    setElapsed(0);
    setJsonDone(false);
    setOpenuiDone(false);
  }, []);

  const play = useCallback(() => {
    reset();
    setState("streaming");
    startRef.current = performance.now();

    const tick = (now: number) => {
      const dt = (now - startRef.current) / 1000;
      setElapsed(dt);

      const jsonProgress = Math.min(1, dt / JSON_DURATION);
      const openuiProgress = Math.min(1, dt / OPENUI_DURATION);

      setJsonChars(Math.floor(jsonProgress * JSON_CODE.length));
      setOpenuiChars(Math.floor(openuiProgress * OPENUI_CODE.length));
      setJsonTokens(Math.floor(jsonProgress * JSON_TOKENS));
      setOpenuiTokens(Math.floor(openuiProgress * OPENUI_TOKENS));

      if (openuiProgress >= 1) setOpenuiDone(true);
      if (jsonProgress >= 1) setJsonDone(true);

      if (jsonProgress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setState("done");
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [reset]);

  // Auto-play when section scrolls into view
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAutoPlayed.current) {
          hasAutoPlayed.current = true;
          play();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [play]);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div ref={sectionRef} className="mb-12 sm:mb-20">
      <p className="mb-6 text-sm text-slate-600 sm:mb-8 sm:text-base dark:text-slate-400">
        Same UI component, both streaming at {TOKEN_RATE} tokens/sec. OpenUI Lang finishes in{" "}
        <strong>{OPENUI_DURATION.toFixed(1)}s</strong> vs JSON&apos;s{" "}
        <strong>{JSON_DURATION.toFixed(1)}s</strong> &mdash;{" "}
        <strong>{Math.round((1 - OPENUI_TOKENS / JSON_TOKENS) * 100)}% fewer tokens</strong>.
      </p>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <StreamingCodeBlock
          code={JSON_CODE}
          charCount={jsonChars}
          totalTokens={JSON_TOKENS}
          currentTokens={jsonTokens}
          elapsed={elapsed}
          totalDuration={JSON_DURATION}
          state={jsonDone ? "done" : state}
          label="JSON Format"
          variant="red"
        />
        <StreamingCodeBlock
          code={OPENUI_CODE}
          charCount={openuiChars}
          totalTokens={OPENUI_TOKENS}
          currentTokens={openuiTokens}
          elapsed={openuiDone ? OPENUI_DURATION : elapsed}
          totalDuration={OPENUI_DURATION}
          state={openuiDone ? "done" : state}
          label="OpenUI Lang"
          variant="green"
        />
      </div>

      {state === "done" && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-900/20">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            OpenUI Lang completed in <strong>{OPENUI_DURATION.toFixed(1)}s</strong> vs JSON&apos;s{" "}
            <strong>{JSON_DURATION.toFixed(1)}s</strong> &mdash;{" "}
            <strong>{(JSON_DURATION / OPENUI_DURATION).toFixed(1)}x faster</strong> with{" "}
            <strong>{JSON_TOKENS - OPENUI_TOKENS} fewer tokens</strong>.
          </p>
          <button
            onClick={() => { hasAutoPlayed.current = true; play(); }}
            className="ml-3 flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
            title="Replay streaming demo"
          >
            <RotateCcw size={12} /> Replay
          </button>
        </div>
      )}
    </div>
  );
}
