import type { DataSourceQuery, DataSources } from "@openuidev/react-lang";
import type { ReactNode } from "react";

/** A component on the dashboard, for the panel's "Also used by" and its headings. */
export interface DataSourcesComponent {
  /** Its statement name, or its component id (`lead.1`). */
  id: string;
  /** What people call it: its `title`, `label` or `name` prop, else its type. */
  label: string;
  /** Its `subtitle` or `hint`, shown under the label. */
  description?: string;
  /** The component's type, e.g. `Kpi` or `TimeSeries`. */
  typeName: string;
  /** The Query statements it reads. */
  queries: string[];
}

/** What was clicked: a component, and the prop when the click landed on a marked one. */
export interface DataSourcesSelection {
  id: string;
  prop?: string;
  /** The figure as the dashboard shows it, e.g. `$184,920`. */
  value?: string;
}

/** How an app names one of its data tools. Every field is optional. */
export interface SourceDescription {
  /** The source's name, e.g. `Sessions by channel`. */
  title?: string;
  /**
   * What kind of source it is, shown after the title, e.g. `Postgres` or `GA4`. `Script` lists
   * the calls it made (`scriptInputs`); `File` labels its data "File".
   */
  kind?: string;
  /** One muted line after the kind, e.g. a connection name. */
  detail?: string;
  /** A 14px mark, such as the product's logo. */
  icon?: ReactNode;
  /** What the call shows as: `SQL`, `HogQL`, `Request`, `Tool call`… */
  codeLabel?: string;
  /** The call's text, e.g. its SQL. */
  code?: string;
}

/** One call a script made, as `scriptInputs` returns it. */
export interface ScriptCall {
  name: string;
  args: unknown;
}

export interface DataSourcesPanelProps {
  /** Every Query in the dashboard, for the list. */
  queries: DataSourceQuery[];
  /** Every component on the dashboard, for "Also used by". */
  components: DataSourcesComponent[];
  /** What was clicked. Null shows the list of sources. */
  selection: DataSourcesSelection | null;
  /** Where the selection's data comes from: `useDataSources` for it. */
  sources: DataSources | null;
  /** Select another component, e.g. from "Also used by". */
  onSelect?: (id: string) => void;
  /** Back to the list. */
  onClearSelection?: () => void;
  onClose?: () => void;
  /** Name a data tool: its title, kind, logo and call. */
  describeSource?: (toolName: string, args: unknown) => SourceDescription | undefined;
  /** The calls a script made, for a source whose kind is `Script`. */
  scriptInputs?: (toolName: string) => ScriptCall[] | undefined;
  /** Run one of a script's calls, to show its data. */
  runCall?: (call: ScriptCall) => Promise<unknown>;
  className?: string;
}
