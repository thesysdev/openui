// Shared UI contracts (future @openui-channels/ui): the platform-neutral types
// every platform library implements with the same shape. Pure types, no
// runtime dependencies — core references these; platform libraries render them.

/** A chart the model asked for; part of the shared component contract. */
export type ChartSpec = {
  /** Stable id, also used to key the placeholder emitted during the walk. */
  id: string;
  /** "bar" | "line" | "pie" | "area". */
  type: string;
  labels: string[];
  values: number[];
  title?: string;
  /** Legend name for the value series (cartesian charts). */
  series?: string;
  xLabel?: string;
  yLabel?: string;
};

/**
 * One field of a Form. The five kinds are supported natively by every target
 * platform's form surface (Slack modals, Teams inline Input.*, WhatsApp Flows,
 * Telegram WebApps).
 */
export type FieldSpec = {
  target: string;
  kind:
    | "text"
    | "textarea"
    | "number"
    | "email"
    | "url"
    | "select"
    | "multiselect"
    | "date"
    | "time"
    | "datetime";
  label: string;
  initial: unknown;
  options?: { value: string; label: string }[];
};

/**
 * A Form, extracted during the walk. How and when it becomes UI is the
 * platform library's choice: a modal behind a trigger button (Slack), inline
 * card inputs (Teams), or a native flow (WhatsApp).
 */
export type FormSpec = { title: string; submit: string; fields: FieldSpec[]; action?: any };
