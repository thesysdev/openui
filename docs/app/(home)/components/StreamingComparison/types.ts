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
  | { type: "cards"; cards: CardItem[] }
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
  /* Bars for two or more series per category, e.g. spend vs sales. */
  | {
      type: "groupedBars";
      title?: string;
      categories: string[];
      series: { name: string; values: number[]; color?: string }[];
      /* Axis range and tick suffix, e.g. 2 to 10 with "M". */
      min?: number;
      max?: number;
      suffix?: string;
    }
  /* A donut with a legend. */
  | {
      type: "donut";
      title?: string;
      subtitle?: string;
      slices: { label: string; value: number; color?: string }[];
    }
  /* A filled trend line. */
  | { type: "area"; title?: string; subtitle?: string; values: number[]; labels?: string[] }
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
  /* An interactive-looking form: fields land one by one, then the button. */
  | { type: "form"; fields: FormField[]; submit: string }
  /* Anything else: any element, shown when the stream reaches it. `cost` is
     how many characters of streaming time it takes (default 40). */
  | { type: "custom"; node: ReactNode; cost?: number };

export interface CardItem {
  image: string;
  imageAlt: string;
  badge?: { label: string; icon?: ReactNode; tone?: "green" | "purple" | "blue" | "amber" };
  title: string;
  description: string;
  /* Label of the black button along the card's foot, e.g. "Book". */
  action?: string;
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

export type FormField =
  | { kind: "text"; label: string; placeholder?: string; value?: string; icon?: ReactNode }
  | { kind: "dates"; label: string; from: string; to: string }
  | { kind: "stepper"; label: string; value: number; unit?: string }
  | { kind: "chips"; label: string; options: string[]; selected?: string[] }
  /* Big icon tiles to pick from; the selected ones are filled. */
  | {
      kind: "tiles";
      label: string;
      options: { label: string; icon: ReactNode }[];
      selected?: string[];
      columns?: number;
    }
  /* A strip of days with the chosen range highlighted. */
  | {
      kind: "dateStrip";
      label: string;
      month: string;
      days: { dow: string; day: number }[];
      from: number;
      to: number;
    };

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
