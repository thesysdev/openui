"use client";

import { Renderer } from "@openuidev/react-lang";
import { openuiLibrary } from "@openuidev/react-ui";
import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

const program = `root = Stack([header, stats, charts])
header = Stack([heading, live], "row", "m", "center", "between")
heading = CardHeader("Weather in San Francisco", "Updated just now")
live = Tag("Live", Icon("radio"), "sm", "info")
stats = Stack([temp, humidity, wind, uv], "row", "m", "stretch", "start", true)
temp = Card([CardHeader("72°F", "Partly cloudy")])
humidity = Card([CardHeader("58%", "Humidity")])
wind = Card([CardHeader("12 mph", "Wind")])
uv = Card([CardHeader("6", "UV index")])
charts = Stack([forecast, rain], "row", "m", "stretch", "start", true)
forecast = Card([CardHeader("7-day forecast", "High and low, °F"), forecastChart])
forecastChart = LineChart(days, [highs, lows], "natural", "", "", 150)
days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
highs = Series("High", [74, 76, 71, 68, 70, 75, 79])
lows = Series("Low", [58, 60, 57, 55, 56, 59, 62])
rain = Card([CardHeader("Rainfall", "mm per day"), rainChart])
rainChart = BarChart(days, [rainfall], "grouped", "", "", 150)
rainfall = Series("Rain", [0, 2, 12, 6, 0, 0, 1])
`;

// Chunks of 10–20 characters every 50ms stream the program in about 5 seconds.
const CHUNK_MIN = 10;
const CHUNK_MAX = 20;
const CHUNK_INTERVAL_MS = 50;

type Status = "idle" | "streaming" | "done";

// Seeded so every replay streams the same chunks.
function chunkEnds(length: number): number[] {
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const ends: number[] = [];
  let end = 0;
  while (end < length) {
    end = Math.min(length, end + CHUNK_MIN + Math.floor(random() * (CHUNK_MAX - CHUNK_MIN + 1)));
    ends.push(end);
  }
  return ends;
}

const ends = chunkEnds(program.length);

const tokenPattern =
  /("(?:[^"\\\n]|\\.)*"?)|(\b\d+(?:\.\d+)?\b)|(\b[A-Z][A-Za-z]*(?=\())|(^[a-z][A-Za-z]*(?= =))|(\btrue\b|\bfalse\b)/gm;

function highlight(code: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of code.matchAll(tokenPattern)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(code.slice(last, index));
    const [text, string, number, component, name, boolean] = match;
    const className = string
      ? "text-emerald-700 dark:text-emerald-300"
      : number || boolean
        ? "text-amber-700 dark:text-amber-300"
        : component
          ? "text-sky-700 dark:text-sky-300"
          : name
            ? "font-semibold text-fd-foreground"
            : undefined;
    nodes.push(
      <span key={index} className={className}>
        {text}
      </span>,
    );
    last = index + text.length;
  }
  if (last < code.length) nodes.push(code.slice(last));
  return nodes;
}

const views = [
  { id: "preview", label: "Preview" },
  { id: "code", label: "OpenUI Lang" },
] as const;

type View = (typeof views)[number]["id"];

const headerText = "font-mono text-[11px] font-semibold uppercase tracking-[0.12em]";

export function OpenUILangStreamDemo() {
  const [started, setStarted] = useState(false);
  const [chunk, setChunk] = useState(0);
  const [view, setView] = useState<View>("preview");
  const rootRef = useRef<HTMLElement>(null);
  const codeRef = useRef<HTMLPreElement>(null);

  const status: Status = chunk >= ends.length ? "done" : started ? "streaming" : "idle";
  const streaming = status === "streaming";

  // Start streaming the first time the demo scrolls into view. Readers who
  // prefer reduced motion see the finished program and interface instead.
  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          setChunk(ends.length);
        } else {
          setStarted(true);
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!streaming) return;
    const timer = window.setTimeout(() => setChunk((c) => c + 1), CHUNK_INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [streaming, chunk]);

  const streamed = program.slice(0, chunk === 0 ? 0 : ends[chunk - 1]);

  // Keep the newest line in view as the program grows, and when the code is
  // shown again after streaming in the background.
  useEffect(() => {
    const code = codeRef.current;
    if (code) code.scrollTop = code.scrollHeight;
  }, [streamed, view]);

  const replay = () => {
    setStarted(true);
    setChunk(0);
  };

  return (
    <figure ref={rootRef} className="not-prose my-6">
      <div
        role="group"
        aria-label="OpenUI Lang streaming from a model and rendering live as a weather dashboard"
        className="flex h-[440px] flex-col overflow-hidden rounded-xl border border-fd-border bg-fd-card"
      >
        <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-fd-border px-2">
          <div className="flex rounded-lg bg-fd-muted p-0.5">
            {views.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={view === option.id}
                onClick={() => setView(option.id)}
                className={`rounded-md px-2.5 py-1 transition-colors ${headerText} ${
                  view === option.id
                    ? "bg-fd-background text-fd-foreground shadow-sm"
                    : "text-fd-muted-foreground hover:text-fd-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {streaming && (
            <span
              className={`flex items-center gap-1.5 px-2 text-fd-muted-foreground ${headerText}`}
            >
              <span
                className="size-1.5 animate-pulse rounded-full bg-emerald-500"
                aria-hidden="true"
              />
              Streaming
            </span>
          )}
          {status === "done" && (
            <button
              type="button"
              onClick={replay}
              className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground ${headerText}`}
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Replay
            </button>
          )}
        </div>

        {/* Both views stay mounted so streaming continues behind whichever is hidden. */}
        <pre
          ref={codeRef}
          hidden={view !== "code"}
          className="m-0 min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words bg-fd-muted/30 p-4 font-mono text-[12.5px] leading-5 text-fd-muted-foreground"
        >
          <code>
            {highlight(streamed)}
            {status !== "done" && (
              <span
                className="ml-px inline-block h-3.5 w-[7px] translate-y-[2px] animate-pulse bg-fd-foreground/70"
                aria-hidden="true"
              />
            )}
          </code>
        </pre>
        <div hidden={view !== "preview"} className="min-h-0 flex-1 overflow-auto p-4">
          {streamed && (
            <Renderer response={streamed} library={openuiLibrary} isStreaming={streaming} />
          )}
        </div>
      </div>
      <figcaption className="mt-2 text-center text-xs leading-5 text-fd-muted-foreground">
        A model streams OpenUI Lang, and the interface renders with your components as each line
        arrives.
      </figcaption>
    </figure>
  );
}
