import type { DataSources } from "@openuidev/react-lang";
import type { ReactNode } from "react";

/** What was clicked: a component, and the prop when the click landed on a marked one. */
export interface DataSourcesSelection {
  /** Its statement name, or its component id (`lead.1`). */
  id: string;
  prop?: string;
}

/** How an app names one of its data tools. Every field is optional. */
export interface SourceDescription {
  /** What kind of source it is, shown in the list, e.g. `Postgres` or `GA4`. */
  kind?: string;
  /** A 14px mark, such as the product's logo. */
  icon?: ReactNode;
  /** What the call shows as: `SQL`, `HogQL`, `Request`, `Script`… */
  codeLabel?: string;
  /** The call's text, e.g. its SQL. */
  code?: string;
}

export interface DataSourcesPanelProps {
  /** Where the program's data comes from: `useArtifactProvenance().sources`. */
  sources: DataSources | null;
  /** What was clicked. Null shows every query. */
  selection: DataSourcesSelection | null;
  /** Back to every query. */
  onBack?: () => void;
  onClose?: () => void;
  /** Name a data tool: its kind, logo and how its call reads. */
  describeSource?: (toolName: string, args: unknown) => SourceDescription | undefined;
  className?: string;
}
