"use client";

import { CalendarDays, Check, CornerDownRight, Heart, Minus, Plus } from "lucide-react";
import {
  Fragment,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./StreamingComparison.module.css";
import type {
  Block,
  CardItem,
  ComparisonExample,
  ComparisonSide,
  FactItem,
  StreamMode,
  TableCell,
} from "./types";

export type { ComparisonExample } from "./types";

/* Streaming speed, in characters per second. Both sides share one clock, so a
   side that says more takes longer, which is the point of the comparison. */
const CHARS_PER_SECOND = 150;
/* Pause after the prompt lands before either answer starts. */
const START_DELAY_MS = 600;

/* What a UI piece costs on the shared clock, in characters. */
const COST = {
  divider: 6,
  card: 45,
  fact: 18,
  image: 20,
  followup: 22,
  metric: 24,
  bar: 10,
  row: 26,
  slide: 60,
  chart: 70,
  stat: 30,
  thumbs: 40,
  field: 34,
  custom: 40,
} as const;

interface Segment {
  block: Block;
  start: number;
  /* Per-item costs for blocks made of several pieces (bullets, cards, facts). */
  parts: number[];
}

function partsOf(block: Block): number[] {
  switch (block.type) {
    case "heading":
    case "subheading":
    case "paragraph":
    case "muted":
      return [block.text.length];
    case "bullets":
      return block.items.map((item) => item.length);
    case "divider":
      return [COST.divider];
    case "cards":
      return block.cards.map(() => COST.card);
    case "facts":
      return block.facts.map(() => COST.fact);
    case "gallery":
      return block.images.map(() => COST.image);
    case "followups":
      return block.items.map(() => COST.followup);
    case "metrics":
      return block.metrics.map(() => COST.metric);
    case "barChart":
      return block.bars.map(() => COST.bar);
    case "table":
      return [COST.row, ...block.rows.map(() => COST.row)];
    case "slides":
      return block.slides.map(() => COST.slide);
    case "groupedBars":
      return block.categories.map(() => COST.bar * 2);
    case "funnel":
      return block.steps.map(() => COST.bar * 2);
    case "donut":
    case "area":
    case "scatter":
      return [COST.chart];
    case "statList":
      return block.items.map(() => COST.stat);
    case "imageStack":
      return block.images.map(() => COST.image);
    case "richText":
      return block.items.map((item) => item.lead.length + item.text.length);
    case "split":
      return [Math.max(...block.columns.map((column) => timeline({ blocks: column }).total))];
    case "pager":
      return [COST.thumbs, timeline({ blocks: block.page }).total];
    case "form":
      return [...block.fields.map(() => COST.field), COST.field];
    case "custom":
      return [block.cost ?? COST.custom];
  }
}

function timeline(side: { blocks: Block[] }) {
  let offset = 0;
  const segments: Segment[] = side.blocks.map((block) => {
    const parts = partsOf(block);
    const segment = { block, start: offset, parts };
    offset += parts.reduce((a, b) => a + b, 0);
    return segment;
  });
  return { segments, total: offset };
}

/* How far into each part of a segment the stream has got: -1 not started,
   otherwise the number of characters shown (capped at the part's length). */
function partProgress(segment: Segment, progress: number) {
  let cursor = segment.start;
  return segment.parts.map((cost) => {
    const shown = progress - cursor;
    cursor += cost;
    return shown <= 0 ? -1 : Math.min(shown, cost);
  });
}

/* Plays one example: the prompt, then both answers streaming in at once.
   Plays once when scrolled into view (pausing off screen) and then rests on
   the finished answers, which reduced motion shows straight away. */
export function StreamingComparison({
  example,
  leftStatic = false,
}: {
  example: ComparisonExample;
  /* Shows the "Without" answer finished from the start instead of streaming. */
  leftStatic?: boolean;
}) {
  const left = useMemo(() => (example.left ? timeline(example.left) : null), [example.left]);
  const right = useMemo(() => timeline(example.right), [example.right]);
  // The plain-text side says more, so it would trail far behind. It starts at
  // the shared pace and speeds up gradually, landing just after the UI side.
  const finish = left && left.total > right.total ? Math.round(right.total * 1.15) : 0;
  const longest = Math.max(finish, right.total, left && !finish ? left.total : 0);
  const leftProgressAt = (p: number) => {
    if (!left) return 0;
    if (!finish) return p;
    const x = Math.min(1, p / finish);
    return Math.round(p + (left.total - finish) * x * x);
  };

  const rootRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.2,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      // Reduced motion shows the finished answer at once instead of streaming it.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(longest);
      return;
    }
    if (!visible) return;
    if (progressRef.current >= longest) return; // played once already
    let frame = 0;
    let begin: number | null = null;
    const tick = (now: number) => {
      // Resume where it was, so scrolling away and back doesn't restart it.
      begin ??= now - progressRef.current * (1000 / CHARS_PER_SECOND) - START_DELAY_MS;
      const elapsed = now - begin;
      const next = Math.floor(
        Math.max(0, Math.min(longest, ((elapsed - START_DELAY_MS) / 1000) * CHARS_PER_SECOND)),
      );
      if (next !== progressRef.current) {
        progressRef.current = next;
        setProgress(next);
      }
      // Plays once, then rests on the finished answers.
      if (next < longest) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, reducedMotion, longest]);

  return (
    <div ref={rootRef} className={styles.frame}>
      <div
        className={`${styles.root} ${example.left ? "" : styles.rootSingle}`.trim()}
        data-left-phones={example.leftOnPhonesOnly || undefined}
        data-left-static={leftStatic || undefined}
      >
        {example.left && left ? (
          <Panel
            side={example.left}
            prompt={example.prompt}
            segments={left.segments}
            progress={leftStatic ? left.total : leftProgressAt(progress)}
            done={leftStatic || leftProgressAt(progress) >= left.total}
          />
        ) : null}
        <Panel
          side={example.right}
          prompt={example.prompt}
          segments={right.segments}
          progress={progress}
          done={progress >= right.total}
          accent
        />
      </div>
    </div>
  );
}

function Panel({
  side,
  prompt,
  segments,
  progress,
  done,
  accent = false,
}: {
  side: ComparisonSide;
  prompt: string;
  segments: Segment[];
  progress: number;
  done: boolean;
  accent?: boolean;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const follow = side.follow ?? false;

  // A side set to follow keeps its newest output in view, the way a chat
  // follows a long reply; otherwise it stays put at the top.
  useLayoutEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    body.scrollTop = follow && progress > 0 ? body.scrollHeight : 0;
  }, [progress, follow]);

  const started = progress > 0;

  return (
    <section
      className={`${styles.panel} ${accent ? styles.panelAccent : ""}`.trim()}
      aria-label={side.label}
    >
      <span className={styles.label}>{side.label}</span>
      <div className={styles.prompt}>{prompt}</div>
      <div ref={bodyRef} className={styles.body}>
        <div
          className={`${styles.response} ${started ? styles.responseVisible : ""} ${
            side.sectioned ? styles.responseSectioned : ""
          }`.trim()}
        >
          {segments.map((segment, index) => (
            <SegmentView
              // biome-ignore lint/suspicious/noArrayIndexKey: blocks are a fixed list
              key={index}
              segment={segment}
              progress={progress}
              showCaret={!done}
              mode={side.stream ?? "lines"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Cell({ cell }: { cell: TableCell }) {
  if (cell.badge) {
    return (
      <span className={`${styles.badge} ${styles.cellBadge} ${styles[`badge_${cell.badge}`]}`}>
        {cell.text}
      </span>
    );
  }
  return (
    <span className={styles.cell}>
      <span className={`${styles.cellMain} ${cell.strong ? styles.cellStrong : ""}`.trim()}>
        {cell.icon ? <span className={styles.cellIcon}>{cell.icon}</span> : null}
        {cell.text}
      </span>
      {cell.bar !== undefined ? (
        <span className={styles.cellBar}>
          <i style={{ width: `${Math.round(cell.bar * 100)}%` }} />
        </span>
      ) : null}
    </span>
  );
}

function Caret() {
  return <span className={styles.caret} aria-hidden="true" />;
}

/* Text cut to what has streamed so far, with a caret while it is still going.
   In "lines" mode the whole text is laid out and revealed a full line at a
   time, the way a plain chat reply lands. */
function Streamed({
  text,
  shown,
  caret,
  mode,
}: {
  text: string;
  shown: number;
  caret: boolean;
  mode: StreamMode;
}) {
  if (mode === "lines") return <LineReveal text={text} fraction={shown / text.length} />;
  const partial = shown < text.length;
  return (
    <>
      {text.slice(0, shown)}
      {partial && caret ? <Caret /> : null}
    </>
  );
}

function LineReveal({ text, fraction }: { text: string; fraction: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shownLines = useRef(0);
  // Each word keeps its trailing space, so the text lays out exactly as one run.
  const words = useMemo(() => text.match(/\S+\s*/g) ?? [], [text]);

  // Work out which line each word landed on, show the lines streamed so far,
  // blur each new line into focus, and clip the block to its shown lines.
  // Runs every render (cheap) so it follows width changes too.
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    const spans = Array.from(node.children) as HTMLElement[];
    const tops: number[] = [];
    const lineOf = spans.map((span) => {
      const top = span.offsetTop;
      let line = tops.findIndex((t) => Math.abs(t - top) < 2);
      if (line < 0) line = tops.push(top) - 1;
      return line;
    });
    const visible = Math.max(1, Math.ceil(fraction * tops.length));
    let bottom = 0;
    spans.forEach((span, i) => {
      const show = lineOf[i] < visible;
      span.style.visibility = show ? "" : "hidden";
      if (show) bottom = Math.max(bottom, span.offsetTop + span.offsetHeight);
      if (show && lineOf[i] >= shownLines.current) {
        span.classList.remove(styles.blurIn);
        void span.offsetWidth; // restart the animation
        span.classList.add(styles.blurIn);
      }
    });
    shownLines.current = visible;
    // Inline boxes are a touch shorter than the line; pad so descenders show,
    // and drop the clip once every line is out.
    node.style.maxHeight = visible >= tops.length ? "none" : `${bottom + 4}px`;
  });

  return (
    <span ref={ref} className={styles.lineReveal}>
      {words.map((word, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: words of a fixed string
        <span key={i}>{word}</span>
      ))}
    </span>
  );
}

/* Nested blocks (split columns, pager pages) on their own little timeline. */
function BlockList({
  blocks,
  progress,
  showCaret,
  mode,
}: {
  blocks: Block[];
  progress: number;
  showCaret: boolean;
  mode: StreamMode;
}) {
  const { segments } = useMemo(() => timeline({ blocks }), [blocks]);
  return (
    <>
      {segments.map((segment, index) => (
        <SegmentView
          // biome-ignore lint/suspicious/noArrayIndexKey: blocks are a fixed list
          key={index}
          segment={segment}
          progress={progress}
          showCaret={showCaret}
          mode={mode}
        />
      ))}
    </>
  );
}

const PALETTE = ["#4f46e5", "#93b4f8", "#c7d2fe", "#1e1b4b", "#a5b4fc"];

function SegmentView({
  segment,
  progress,
  showCaret,
  mode,
}: {
  segment: Segment;
  progress: number;
  showCaret: boolean;
  mode: StreamMode;
}) {
  const shown = partProgress(segment, progress);
  if (shown[0] < 0) return null;
  const { block } = segment;

  switch (block.type) {
    case "heading":
      return (
        <h3 className={styles.heading}>
          <Streamed text={block.text} shown={shown[0]} caret={showCaret} mode={mode} />
        </h3>
      );
    case "subheading":
      return (
        <h4 className={styles.subheading}>
          <Streamed text={block.text} shown={shown[0]} caret={showCaret} mode={mode} />
        </h4>
      );
    case "paragraph":
    case "muted":
      return (
        <p className={block.type === "muted" ? styles.muted : styles.paragraph}>
          <Streamed text={block.text} shown={shown[0]} caret={showCaret} mode={mode} />
        </p>
      );
    case "bullets":
      return (
        <ul className={styles.bullets}>
          {block.items.map((item, i) =>
            shown[i] < 0 ? null : (
              <li key={item}>
                <Streamed text={item} shown={shown[i]} caret={showCaret} mode={mode} />
              </li>
            ),
          )}
        </ul>
      );
    case "divider":
      return <hr className={`${styles.divider} ${styles.pop}`} />;
    case "cards":
      return (
        <div className={styles.cards}>
          {block.cards.map((card, i) =>
            shown[i] < 0 ? null : <Card key={card.title} card={card} />,
          )}
        </div>
      );
    case "facts":
      return (
        <div
          className={`${styles.facts} ${block.layout === "rules" ? styles.factsRules : ""}`.trim()}
          style={
            block.columns
              ? { gridTemplateColumns: `repeat(${block.columns}, minmax(0, 1fr))` }
              : undefined
          }
        >
          {block.facts.map((fact, i) =>
            shown[i] < 0 ? null : <Fact key={fact.label} fact={fact} />,
          )}
        </div>
      );
    case "gallery":
      return (
        <div className={styles.gallery}>
          {block.images.map((image, i) =>
            shown[i] < 0 ? null : (
              <img
                key={image.src}
                className={`${styles.galleryImage} ${styles.pop}`}
                src={image.src}
                alt={image.alt}
                loading="lazy"
              />
            ),
          )}
        </div>
      );
    case "followups":
      return (
        <div className={styles.followups}>
          {block.label ? <span className={styles.followupsLabel}>{block.label}</span> : null}
          {block.items.map((item, i) =>
            shown[i] < 0 ? null : (
              <span key={item} className={`${styles.followup} ${styles.pop}`}>
                <CornerDownRight aria-hidden />
                {item}
              </span>
            ),
          )}
        </div>
      );
    case "metrics":
      return (
        <div
          className={`${styles.metrics} ${block.layout === "rules" ? styles.metricsRules : ""}`.trim()}
        >
          {block.metrics.map((metric, i) =>
            shown[i] < 0 ? null : (
              <div key={metric.label} className={`${styles.metric} ${styles.pop}`}>
                {metric.icon ? <span className={styles.metricIcon}>{metric.icon}</span> : null}
                <span className={styles.metricValue}>
                  {metric.value}
                  {metric.change ? (
                    <span
                      className={`${styles.metricChange} ${
                        metric.trend === "down" ? styles.metricDown : styles.metricUp
                      }`}
                    >
                      {metric.change}
                    </span>
                  ) : null}
                </span>
                <span className={styles.metricLabel}>{metric.label}</span>
              </div>
            ),
          )}
        </div>
      );
    case "barChart": {
      const max = Math.max(...block.bars.map((bar) => Math.abs(bar.value)), 1);
      return (
        <figure className={styles.chart}>
          {block.title ? (
            <figcaption className={styles.chartTitle}>{block.title}</figcaption>
          ) : null}
          <div className={styles.bars}>
            {block.bars.map((bar, i) => (
              <div key={bar.label} className={styles.barColumn}>
                <span className={styles.barValue}>
                  {shown[i] < 0 ? "" : `${bar.value}${block.unit ?? ""}`}
                </span>
                <span className={styles.barTrack}>
                  {shown[i] < 0 ? null : (
                    <span
                      className={`${styles.bar} ${bar.value < 0 ? styles.barNegative : ""}`.trim()}
                      style={{ height: `${(Math.abs(bar.value) / max) * 100}%` }}
                    />
                  )}
                </span>
                <span className={styles.barLabel}>{bar.label}</span>
              </div>
            ))}
          </div>
        </figure>
      );
    }
    case "table":
      return (
        <div className={`${styles.tableWrap} ${styles.pop}`}>
          <table className={styles.table}>
            <thead>
              <tr>
                {block.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) =>
                shown[i + 1] < 0 ? null : (
                  // biome-ignore lint/suspicious/noArrayIndexKey: rows of a fixed table
                  <tr key={i} className={styles.pop}>
                    {row.map((cell, j) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: cells of a fixed row
                      <td key={j}>{typeof cell === "string" ? cell : <Cell cell={cell} />}</td>
                    ))}
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      );
    case "slides":
      return (
        <div className={styles.slides}>
          {block.slides.map((slide, i) =>
            shown[i] < 0 ? null : (
              <div
                key={slide.title}
                className={`${styles.slide} ${slide.dark ? styles.slideDark : ""} ${styles.pop}`}
              >
                {slide.eyebrow ? (
                  <span className={styles.slideEyebrow}>{slide.eyebrow}</span>
                ) : null}
                <span className={styles.slideTitle}>{slide.title}</span>
                {slide.stat ? <span className={styles.slideStat}>{slide.stat}</span> : null}
                {slide.bullets ? (
                  <ul className={styles.slideBullets}>
                    {slide.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ),
          )}
        </div>
      );
    case "groupedBars": {
      const min = block.min ?? 0;
      const max = block.max ?? Math.max(...block.series.flatMap((serie) => serie.values));
      const span = max - min || 1;
      const ticks = [max, min + (span * 3) / 4, min + span / 2, min + span / 4, min];
      return (
        <figure className={styles.chart}>
          {block.title ? (
            <figcaption className={styles.chartTitle}>{block.title}</figcaption>
          ) : null}
          <div className={styles.groupedPlot}>
            <div className={styles.yTicks}>
              {ticks.map((tick) => (
                <span key={tick}>
                  {Math.round(tick * 10) / 10}
                  {block.suffix ?? ""}
                </span>
              ))}
            </div>
            <div className={styles.groups}>
              {block.categories.map((category, i) => (
                <div key={category} className={styles.group}>
                  <div className={styles.groupBars}>
                    {shown[i] < 0
                      ? null
                      : block.series.map((serie, k) => (
                          <span
                            key={serie.name}
                            className={styles.groupBar}
                            style={{
                              height: `${Math.max(0, ((serie.values[i] - min) / span) * 100)}%`,
                              background: serie.color ?? PALETTE[k],
                            }}
                          />
                        ))}
                  </div>
                  <span className={styles.barLabel}>{category}</span>
                </div>
              ))}
            </div>
          </div>
          <div className={styles.legend}>
            {block.series.map((serie, k) => (
              <span key={serie.name}>
                <i style={{ background: serie.color ?? PALETTE[k] }} />
                {serie.name}
              </span>
            ))}
          </div>
        </figure>
      );
    }
    case "donut": {
      const total = block.slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
      const circumference = 2 * Math.PI * 38;
      const lengths = block.slices.map((slice) => (slice.value / total) * circumference);
      const offsets = lengths.map((_, k) => lengths.slice(0, k).reduce((sum, l) => sum + l, 0));
      return (
        <figure className={`${styles.chart} ${styles.pop}`}>
          {block.title ? (
            <figcaption className={styles.chartTitle}>{block.title}</figcaption>
          ) : null}
          {block.subtitle ? <span className={styles.chartSubtitle}>{block.subtitle}</span> : null}
          <div className={styles.donutRow}>
            <svg viewBox="0 0 100 100" className={styles.donut} aria-hidden="true">
              {block.slices.map((slice, k) => {
                const dash = `${Math.max(0, lengths[k] - 1.5)} ${circumference}`;
                return (
                  <circle
                    key={slice.label}
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    stroke={slice.color ?? PALETTE[k % PALETTE.length]}
                    strokeWidth="14"
                    strokeDasharray={dash}
                    strokeDashoffset={-offsets[k]}
                    transform="rotate(-90 50 50)"
                  />
                );
              })}
            </svg>
          </div>
          <div className={styles.legend}>
            {block.slices.map((slice, k) => (
              <span key={slice.label}>
                <i style={{ background: slice.color ?? PALETTE[k % PALETTE.length] }} />
                {slice.label} {Math.round((slice.value / total) * 100)}%
              </span>
            ))}
          </div>
        </figure>
      );
    }
    case "area": {
      const max = Math.max(...block.values);
      const min = Math.min(...block.values) * 0.8;
      const points = block.values.map((value, i) => [
        (i / (block.values.length - 1)) * 100,
        40 - ((value - min) / (max - min || 1)) * 36,
      ]);
      const line = points.map(([x, y]) => `${x},${y}`).join(" L");
      return (
        <figure className={`${styles.chart} ${styles.pop}`}>
          {block.title ? (
            <figcaption className={styles.chartTitle}>{block.title}</figcaption>
          ) : null}
          {block.subtitle ? <span className={styles.chartSubtitle}>{block.subtitle}</span> : null}
          <svg
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            className={styles.area}
            aria-hidden="true"
          >
            <path d={`M0,40 L${line} L100,40 Z`} className={styles.areaFill} />
            <path d={`M${line}`} className={styles.areaLine} vectorEffect="non-scaling-stroke" />
          </svg>
          {block.labels ? (
            <div className={styles.areaLabels}>
              {block.labels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          ) : null}
        </figure>
      );
    }
    case "scatter":
      return (
        <figure className={`${styles.chart} ${styles.pop}`}>
          {block.title ? (
            <figcaption className={styles.chartTitle}>{block.title}</figcaption>
          ) : null}
          <div className={styles.scatterPlot}>
            <div className={styles.yTicks}>
              {block.yTicks.map((tick) => (
                <span key={tick}>{tick}</span>
              ))}
            </div>
            <div className={styles.scatter} aria-hidden="true">
              {block.series.map((serie, k) =>
                serie.points.map(([x, y]) => (
                  <span
                    key={`${serie.name}-${x}-${y}`}
                    className={styles.dot}
                    style={{
                      left: `${x}%`,
                      bottom: `${y}%`,
                      background: serie.color ?? PALETTE[k],
                    }}
                  />
                )),
              )}
            </div>
          </div>
          <div className={styles.xTicks}>
            {block.xTicks.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>
          <div className={styles.legend}>
            {block.series.map((serie, k) => (
              <span key={serie.name}>
                <i style={{ background: serie.color ?? PALETTE[k] }} />
                {serie.name}
              </span>
            ))}
          </div>
          {block.caption ? <span className={styles.chartCaption}>{block.caption}</span> : null}
        </figure>
      );
    case "funnel": {
      const first = block.steps[0]?.value || 1;
      return (
        <figure className={styles.chart}>
          {block.title ? (
            <figcaption className={styles.chartTitle}>{block.title}</figcaption>
          ) : null}
          <div className={styles.funnel}>
            {block.steps.map((step, i) => (
              <Fragment key={step.label}>
                {i > 0 ? (
                  <span className={styles.funnelDrop}>
                    {shown[i] < 0
                      ? ""
                      : `↓ ${((step.value / block.steps[i - 1].value) * 100).toFixed(1)}% continue`}
                  </span>
                ) : null}
                <div className={styles.funnelStep}>
                  <span className={styles.funnelLabel}>{step.label}</span>
                  <span className={styles.funnelTrack}>
                    {shown[i] < 0 ? null : (
                      <span
                        className={styles.funnelBar}
                        style={{
                          // Fourth-root scale: steps span orders of magnitude,
                          // so a linear bar would vanish after the first step.
                          width: `${Math.max(8, (step.value / first) ** 0.25 * 100)}%`,
                          background: step.color ?? PALETTE[i % PALETTE.length],
                        }}
                      />
                    )}
                  </span>
                  <span className={styles.funnelValue}>{shown[i] < 0 ? "" : step.display}</span>
                </div>
              </Fragment>
            ))}
          </div>
          {block.note ? <span className={styles.funnelNote}>{block.note}</span> : null}
        </figure>
      );
    }
    case "statList":
      return (
        <div className={styles.statList}>
          {block.items.map((item, i) =>
            shown[i] < 0 ? null : (
              <div key={item.label} className={`${styles.statItem} ${styles.pop}`}>
                <span className={styles.statValue}>
                  {item.value}
                  {item.change ? <em>{item.change}</em> : null}
                </span>
                <span className={styles.statLabel}>{item.label}</span>
              </div>
            ),
          )}
        </div>
      );
    case "imageStack":
      return (
        <div className={styles.imageStack}>
          {block.images.map((image, i) =>
            shown[i] < 0 ? null : (
              <img
                key={image.src}
                className={styles.pop}
                src={image.src}
                alt={image.alt}
                loading="lazy"
              />
            ),
          )}
        </div>
      );
    case "richText":
      return (
        <div className={styles.richText}>
          {block.items.map((item, i) =>
            shown[i] < 0 ? null : (
              <p key={item.lead} className={styles.blurIn}>
                <strong>{item.lead}</strong> {item.text}
              </p>
            ),
          )}
        </div>
      );
    case "split":
      return (
        <div
          className={styles.split}
          style={block.ratio ? { gridTemplateColumns: block.ratio } : undefined}
        >
          {block.columns.map((column, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed columns
            <div key={i} className={styles.splitColumn}>
              <BlockList
                blocks={column}
                progress={progress - segment.start}
                showCaret={showCaret}
                mode={mode}
              />
            </div>
          ))}
        </div>
      );
    case "pager":
      return (
        <div className={styles.pager}>
          <div className={`${styles.rail} ${styles.pop}`}>
            <span className={styles.railLabel}>{block.railLabel}</span>
            {block.thumbs.map((thumb, i) => (
              <div key={`${thumb.title ?? thumb.stat ?? ""}-${i}`} className={styles.thumbRow}>
                <span className={styles.thumbIndex}>{i + 1}</span>
                <span
                  className={`${styles.thumb} ${thumb.dark ? styles.thumbDark : ""} ${
                    i === block.selected ? styles.thumbSelected : ""
                  }`}
                  style={thumb.image ? { backgroundImage: `url(${thumb.image})` } : undefined}
                >
                  {thumb.stat ? <b>{thumb.stat}</b> : null}
                  {thumb.title ? <span>{thumb.title}</span> : null}
                  {thumb.chart ? (
                    <span className={styles.thumbBars}>
                      <i style={{ height: "45%" }} />
                      <i style={{ height: "70%" }} />
                      <i style={{ height: "55%" }} />
                      <i style={{ height: "90%" }} />
                    </span>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
          {shown[1] < 0 ? null : (
            <div className={`${styles.page} ${styles.pop}`}>
              <BlockList
                blocks={block.page}
                progress={progress - segment.start - COST.thumbs}
                showCaret={showCaret}
                mode={mode}
              />
            </div>
          )}
        </div>
      );
    case "form":
      return (
        <div className={styles.form}>
          {block.fields.map((field, i) =>
            shown[i] < 0 ? null : (
              <div key={field.label} className={`${styles.field} ${styles.pop}`}>
                <span className={styles.fieldLabel}>{field.label}</span>
                {field.kind === "text" ? (
                  <span
                    className={`${styles.input} ${field.value ? "" : styles.inputPlaceholder}`.trim()}
                  >
                    {field.icon}
                    {field.value ?? field.placeholder}
                  </span>
                ) : null}
                {field.kind === "dates" ? (
                  <span className={styles.dateRow}>
                    <span className={styles.input}>
                      <CalendarDays aria-hidden />
                      {field.from}
                    </span>
                    <span className={styles.input}>
                      <CalendarDays aria-hidden />
                      {field.to}
                    </span>
                  </span>
                ) : null}
                {field.kind === "stepper" ? (
                  <span className={styles.stepper}>
                    <span className={styles.stepperButton}>
                      <Minus aria-hidden />
                    </span>
                    <span>
                      {field.value} {field.unit}
                    </span>
                    <span className={styles.stepperButton}>
                      <Plus aria-hidden />
                    </span>
                  </span>
                ) : null}
                {field.kind === "tiles" ? (
                  <span
                    className={styles.tiles}
                    style={{ gridTemplateColumns: `repeat(${field.columns ?? 3}, minmax(0, 1fr))` }}
                  >
                    {field.options.map((option) => (
                      <span
                        key={option.label}
                        className={`${styles.tile} ${
                          field.selected?.includes(option.label) ? styles.tileSelected : ""
                        }`.trim()}
                      >
                        {option.icon}
                        {option.label}
                      </span>
                    ))}
                  </span>
                ) : null}
                {field.kind === "dateStrip" ? (
                  <span className={styles.dateStrip}>
                    <span className={styles.dateMonth}>{field.month}</span>
                    <span className={styles.days}>
                      {field.days.map((day, d) => {
                        const inRange = d >= field.from && d <= field.to;
                        const edge = d === field.from || d === field.to;
                        return (
                          <span
                            key={day.day}
                            className={`${styles.day} ${inRange ? styles.dayInRange : ""} ${
                              edge ? styles.dayEdge : ""
                            }`.trim()}
                          >
                            <small>{day.dow}</small>
                            {day.day}
                          </span>
                        );
                      })}
                    </span>
                  </span>
                ) : null}
                {field.kind === "chips" ? (
                  <span className={styles.chips}>
                    {field.options.map((option) => (
                      <span
                        key={option}
                        className={`${styles.chip} ${
                          field.selected?.includes(option) ? styles.chipSelected : ""
                        }`.trim()}
                      >
                        {field.selected?.includes(option) ? <Check aria-hidden /> : null}
                        {option}
                      </span>
                    ))}
                  </span>
                ) : null}
              </div>
            ),
          )}
          {shown[block.fields.length] < 0 ? null : (
            <span className={`${styles.formSubmit} ${styles.pop}`}>{block.submit}</span>
          )}
        </div>
      );
    case "custom":
      return <div className={styles.pop}>{block.node}</div>;
  }
}

function Card({ card }: { card: CardItem }) {
  return (
    <article className={`${styles.card} ${styles.pop}`}>
      <img className={styles.cardImage} src={card.image} alt={card.imageAlt} loading="lazy" />
      {card.badge ? (
        <span className={`${styles.badge} ${styles[`badge_${card.badge.tone ?? "green"}`]}`}>
          {card.badge.icon}
          {card.badge.label}
        </span>
      ) : null}
      <h4 className={styles.cardTitle}>{card.title}</h4>
      <p className={styles.cardDescription}>{card.description}</p>
      {card.action ? (
        <div className={styles.cardFooter}>
          <span className={styles.cardAction}>{card.action}</span>
          <span className={styles.cardIconButton} aria-hidden="true">
            <Heart />
          </span>
        </div>
      ) : null}
    </article>
  );
}

function Fact({ fact }: { fact: FactItem }): ReactNode {
  return (
    <div className={`${styles.fact} ${styles.pop}`}>
      {fact.icon ? <span className={styles.factIcon}>{fact.icon}</span> : null}
      <span>
        <span className={styles.factLabel}>{fact.label}</span>
        <span className={styles.factValue}>{fact.value}</span>
      </span>
    </div>
  );
}
