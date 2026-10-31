export interface StackedLegendItem {
  key: string;
  label: string;
  color: string;
  value: number;
}

export interface LegendEntry {
  items: StackedLegendItem[];
  activeKey: string | null;
  hiddenKeys: string[];
  /** Value format the publishing chart uses; a detached legend inherits it. */
  format?: "percentage" | "number";
}

export interface LegendStoreState {
  entries: Record<string, LegendEntry>;
  /**
   * Chart publishes its current items. Reconciles active/hidden against the new
   * item keys (drops stale keys, never leaves zero visible) and carries the
   * chart's value format for detached legends to inherit.
   */
  publish: (key: string, items: StackedLegendItem[], format?: "percentage" | "number") => void;
  /** Chart unmount: drop the entry entirely. */
  unpublish: (key: string) => void;
  /** Either side: set the highlighted item (null clears). No-op if key absent. */
  setActive: (key: string, itemKey: string | null) => void;
  /** Either side: flip an item's hidden state. No-op if key absent. */
  toggle: (key: string, itemKey: string) => void;
  /** Chart mount: track publisher count; warns on duplicate publisher for a key. */
  registerPublisher: (key: string) => void;
  /** Chart unmount: decrement publisher count. */
  unregisterPublisher: (key: string) => void;
}
