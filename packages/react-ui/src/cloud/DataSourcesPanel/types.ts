import type { DataSources } from "@openuidev/react-lang";
import type { ReactNode } from "react";

/** What was clicked: a component, and the prop when the click landed on a marked one. */
export interface DataSourcesSelection {
  /** Its statement name, or its component id (`lead.1`). */
  id: string;
  prop?: string;
}

/**
 * How an app names one of its data tools. The panel never guesses: without this, a query shows
 * its tool name and its arguments as JSON. Every field is optional.
 */
export interface SourceDescription {
  /** What kind of source it is, shown in the list, e.g. `Postgres` or `GA4`. Default: the tool name. */
  kind?: string;
  /** A 14px mark, such as the product's logo. */
  icon?: ReactNode;
  /** The Query row's label, e.g. `SQL` or `HogQL`. Default: the tool name. */
  codeLabel?: string;
  /** The call's text, e.g. its SQL. Default: its arguments as JSON. */
  code?: string;
}

export interface DataSourcesContentsProps {
  /** Where the program's data comes from: `useArtifactProvenance().sources`. */
  sources: DataSources | null;
  /** What was clicked. Null shows every query. */
  selection: DataSourcesSelection | null;
  /** A query opened from the list, shown when nothing is selected. */
  query?: string | null;
  /** Makes each query in the list open its Query and Result. */
  onOpenQuery?: (name: string) => void;
  /** Name a data tool: its kind, logo and how its call reads. */
  describeSource?: (toolName: string, args: unknown) => SourceDescription | undefined;
}
