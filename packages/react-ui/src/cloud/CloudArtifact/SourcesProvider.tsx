"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { DataSourcesContentsProps } from "../SourcesContents/types";
import { ProvenanceContext } from "./contexts";
import { SourcesMenu } from "./SourcesMenu";
import { SourcesPopover } from "./SourcesPopover";

/** What an app can tell the default Sources contents, through the `Provenance` slot's props. */
export type SourcesOptions = Pick<DataSourcesContentsProps, "describeSource">;

interface SourcesState {
  options: SourcesOptions;
  setOptions: (options: SourcesOptions) => void;
  /** How many `Provenance` slots have their own contents: above 0, the default ones step aside. */
  customCount: number;
  setCustom: (update: (count: number) => number) => void;
  /** Where the app's own contents go, inside the open popover or menu. */
  customHost: HTMLElement | null;
}

export const SourcesContext = createContext<SourcesState | null>(null);

const NO_OPTIONS: SourcesOptions = {};

/**
 * The artifact's content, and with provenance on, what opens over it: the selected item's Sources
 * popover, and the All sources menu.
 */
export function SourcesProvider({ children }: { children: ReactNode }) {
  const provenance = useContext(ProvenanceContext);
  const [options, setOptions] = useState<SourcesOptions>(NO_OPTIONS);
  const [customCount, setCustom] = useState(0);
  const [popoverHost, setPopoverHost] = useState<HTMLElement | null>(null);
  const [menuHost, setMenuHost] = useState<HTMLElement | null>(null);
  const customHost = popoverHost ?? menuHost;
  const state = useMemo<SourcesState>(
    () => ({ options, setOptions, customCount, setCustom, customHost }),
    [options, customCount, customHost],
  );

  if (!provenance) return <>{children}</>;
  return (
    <SourcesContext.Provider value={state}>
      {children}
      <SourcesPopover
        describeSource={options.describeSource}
        custom={customCount > 0}
        onCustomHost={setPopoverHost}
      />
      <SourcesMenu
        describeSource={options.describeSource}
        custom={customCount > 0}
        onCustomHost={setMenuHost}
      />
    </SourcesContext.Provider>
  );
}
