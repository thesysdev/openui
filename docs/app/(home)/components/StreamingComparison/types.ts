import type { ReactNode } from "react";

/* One example for <StreamingComparison>: the same prompt answered twice, once
   as plain text and once as generative UI, both streamed side by side. Every
   block on either side is plain data, so a new example is a new config file
   (see examples/parisHotels.tsx). */
export interface ComparisonExample {
  prompt: string;
  /* Leave out for a single, full-width "With OpenUI" panel. */
  left?: ComparisonSide;
  /* Show the "Without" side on phones only; desktop keeps the single panel. */
  leftOnPhonesOnly?: true;
  right: ComparisonSide;
}

export interface ComparisonSide {
  /* The pill over the panel, e.g. "Without" or "With OpenUI". */
  label: string;
  /* How text streams in: "lines" (default) lands a full line at a time,
     blurring into focus; "characters" types it out letter by letter. */
  stream?: StreamMode;
  /* Lay the answer out as separate cards on the panel instead of one white
     sheet (charts, metrics and tables each become a card). */
  sectioned?: boolean;
  /* No white sheet and no inset: for an answer that brings its own frame,
     such as a whole dashboard board. */
  bare?: boolean;
  /* Scroll to keep the newest output in view once it outgrows the panel.
     Off by default, so the top of the answer stays put. */
  follow?: boolean;
  blocks: Block[];
}

export type StreamMode = "characters" | "lines";

export type Block =
  /* Text blocks stream in (see `stream`). */
  | { type: "heading"; text: string }
  | { type: "subheading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "muted"; text: string }
  | { type: "bullets"; items: string[] }
  /* UI blocks pop in as whole pieces, one after another. */
  | { type: "divider" }
  /* `variant: "poster"` fills each card with its photo, square: the tag
     and an arrow button on the photo, the name and description on a white
     panel inside. The row shows two and a half. */
  | { type: "cards"; cards: CardItem[]; variant?: "poster" }
  /* Small cards in a row, each an icon on a tinted tile beside a label and
     a value, e.g. the weather. */
  | { type: "tiles"; tiles: TileItem[] }
  /* One featured item, as a card: a large photo on the left; an optional
     tag, its name, rating, a short description, tags and a button on the
     right. */
  | {
      type: "feature";
      badge?: { label: string; icon?: ReactNode; tone?: "green" | "purple" | "blue" | "amber" };
      image: string;
      imageAlt: string;
      title: string;
      rating: string;
      reviews: string;
      description: string;
      tags: string[];
      price: string;
      action: string;
    }
  /* Icon tiles in a grid; `columns` defaults to 2. `layout: "rules"` drops
     the tinted tiles for react-ui's ValueLayout look: cells split by dashed
     rules. */
  | { type: "facts"; facts: FactItem[]; columns?: number; layout?: "tiles" | "rules" }
  /* A photo mosaic: the first image large on the left, the rest tiled. */
  | { type: "gallery"; images: { src: string; alt: string }[] }
  /* Suggested next prompts, listed under a small label. */
  | { type: "followups"; label?: string; items: string[] }
  /* Stat tiles: a label, a big value and an optional change. */
  | { type: "metrics"; metrics: MetricItem[]; layout?: "tiles" | "rules" }
  /* A bar chart; bars grow in one after another. */
  | {
      type: "barChart";
      title?: string;
      bars: { label: string; value: number }[];
      unit?: string;
      color?: string;
    }
  /* A small table; rows land one after another. */
  | { type: "table"; columns: string[]; rows: (string | TableCell)[][] }
  /* A row of 16:9 slides. */
  | { type: "slides"; slides: SlideItem[] }
  /* Bars for two or more series per category, e.g. spend vs sales. `labels`
     captions the columns ("" leaves one bare). */
  | {
      type: "groupedBars";
      title?: string;
      categories: string[];
      labels?: string[];
      series: { name: string; values: number[]; color?: string }[];
      /* Axis range and tick suffix, e.g. 2 to 10 with "M". */
      min?: number;
      max?: number;
      suffix?: string;
    }
  /* A donut with a legend; `center` sets a figure in its hole. */
  | {
      type: "donut";
      title?: string;
      subtitle?: string;
      slices: { label: string; value: number; color?: string }[];
      center?: { value: string; label?: string };
    }
  /* Layers stacked per category, bottom-up in series order, e.g. revenue by
     market per month. `labels` captions the columns ("" leaves one bare). */
  | {
      type: "stackedBars";
      title?: string;
      categories: string[];
      labels?: string[];
      series: { name: string; values: number[]; color?: string }[];
      max?: number;
      suffix?: string;
    }
  /* A filled trend line. With `min`/`max` it plots on that range against
     `yTicks`; `callout` pins a chip and a dot to one point. `compare` draws
     a second, unfilled line on the same axis, and a legend names both. */
  | {
      type: "area";
      title?: string;
      subtitle?: string;
      name?: string;
      values: number[];
      compare?: { name: string; values: number[]; color?: string };
      labels?: string[];
      yTicks?: string[];
      min?: number;
      max?: number;
      callout?: { index: number; text: string };
    }
  /* Dots for one or more series on x/y axes. */
  | {
      type: "scatter";
      title?: string;
      caption?: string;
      series: { name: string; color?: string; points: [number, number][] }[];
      xTicks: string[];
      yTicks: string[];
    }
  /* A conversion funnel: bars narrowing step by step, with a footnote. */
  | {
      type: "funnel";
      title?: string;
      steps: { label: string; value: number; display: string; color?: string }[];
      note?: string;
    }
  /* Big numbers stacked with hairlines between them. */
  | { type: "statList"; items: { value: string; change?: string; label: string }[] }
  /* Images stacked in a column, filling the space. */
  | { type: "imageStack"; images: { src: string; alt: string }[] }
  /* Paragraphs that open with a bold lead-in. */
  | { type: "richText"; items: { lead: string; text: string }[] }
  /* Columns side by side, streaming in parallel. */
  | { type: "split"; columns: Block[][]; ratio?: string }
  /* A deck or document: a rail of page thumbnails and the selected page large. */
  | { type: "pager"; railLabel: string; thumbs: ThumbItem[]; selected: number; page: Block[] }
  /* An interactive-looking form: fields land one by one, then the buttons. */
  | { type: "form"; fields: FormField[]; submit: string; secondary?: string }
  /* Anything else: any element, shown when the stream reaches it. `cost` is
     how many characters of streaming time it takes (default 40). */
  | { type: "custom"; node: ReactNode; cost?: number };

export interface CardItem {
  image: string;
  imageAlt: string;
  badge?: { label: string; icon?: ReactNode; tone?: "green" | "purple" | "blue" | "amber" };
  title: string;
  /* Left out on poster cards, where the photo carries the card. */
  description?: string;
  /* Poster cards: a star rating and a price level out of three (shown as
     €€€ with the first `level` coloured), after the description. */
  rating?: string;
  priceLevel?: 1 | 2 | 3;
  /* Label of the black button along the card's foot, e.g. "Book". */
  action?: string;
}

export interface TileItem {
  icon: ReactNode;
  /* The tile's tint, by meaning: yellow for sun, blue for transport, and
     so on. */
  tone: "yellow" | "blue" | "green" | "pink";
  /* Optional: without one the tile is just the icon and its value. */
  label?: string;
  value: string;
}

export interface FactItem {
  icon?: ReactNode;
  label: string;
  value: string;
}

export interface MetricItem {
  icon?: ReactNode;
  label: string;
  value: string;
  /* e.g. "+12.4%"; coloured by `trend`. */
  change?: string;
  trend?: "up" | "down";
}

export interface SlideItem {
  eyebrow?: string;
  title: string;
  bullets?: string[];
  /* A big number or phrase shown in place of bullets. */
  stat?: string;
  dark?: boolean;
}

/* A page thumbnail in a pager rail: a tiny rendering of a page. */
export interface ThumbItem {
  title?: string;
  /* A big word or number. */
  stat?: string;
  /* Background image. */
  image?: string;
  dark?: boolean;
  /* Show a few bars, as a stand-in for a chart page. */
  chart?: boolean;
}

export interface FormOption {
  label: string;
  icon?: ReactNode;
}

/* What every labelled field can carry: a hint under the control, and an
   info mark at the end of the label row. */
interface FieldBase {
  label: string;
  hint?: string;
  info?: boolean;
}

export type FormField =
  /* Starts a new group of fields; groups after the first open on a hairline. */
  | { kind: "section"; label: string }
  /* Fields side by side; `columns` is their grid-template-columns. `wrap`
     stacks them once the form is too narrow to hold them side by side.
     `divided` sets a vertical hairline between them. */
  | { kind: "row"; fields: FormField[]; columns?: string; wrap?: boolean; divided?: boolean }
  /* `select` adds the up-down chevrons of a dropdown. */
  | (FieldBase & {
      kind: "text";
      placeholder?: string;
      value?: string;
      icon?: ReactNode;
      select?: boolean;
    })
  | (FieldBase & { kind: "dates"; from: string; to: string })
  /* Picked values as removable tags inside a dropdown, each with a round
     mark: `swatch` is its CSS background (e.g. a gradient), `icon` sits on it. */
  | (FieldBase & {
      kind: "tags";
      tags: { label: string; swatch?: string; icon?: ReactNode }[];
      placeholder: string;
    })
  | (FieldBase & { kind: "stepper"; value: number; unit?: string })
  /* Pick any number; a picked chip trades its icon for a check. */
  | (FieldBase & {
      kind: "chips";
      options: FormOption[];
      selected?: string[];
      /* Lays the chips on a grid of equal-width columns instead of wrapping. */
      columns?: number;
    })
  /* Pick any number, from square tiles: the icon top left, the label under
     it. As tall as two rows of chips, so the two sit side by side evenly. */
  | (FieldBase & { kind: "tiles"; options: FormOption[]; selected?: string[] })
  /* Pick exactly one, from a connected bar. */
  | (FieldBase & { kind: "segmented"; options: FormOption[]; selected: string })
  /* A two-thumb slider: `from` and `to` are fractions of the track, `value`
     reads them out opposite the label, `min` and `max` sit under its ends. */
  | (FieldBase & {
      kind: "range";
      from: number;
      to: number;
      value: string;
      min: string;
      max: string;
    });

/* A richer table cell: an icon or avatar, a tinted badge, or a progress bar. */
export interface TableCell {
  text: string;
  icon?: ReactNode;
  /* Shows the text as a tinted pill. */
  badge?: "green" | "amber" | "blue" | "purple";
  /* 0–1: a thin bar under the text. */
  bar?: number;
  strong?: boolean;
}
