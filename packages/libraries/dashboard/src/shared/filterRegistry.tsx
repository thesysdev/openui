"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CardControlsContext } from "./cardSlot";

/* Filters report whether they narrow the data, so an empty component can tell
   "nothing exists" from "the filters hid everything". */

type FilterEntry = { active: boolean };
type FilterRegistry = {
  set: (key: string, entry: FilterEntry | null) => void;
  entries: Map<string, FilterEntry>;
  /** Each filter name's starting value, kept by the first copy to render it: the phone sheet mounts a second copy later. */
  baselines: Map<string, string>;
};
/* Two contexts: the registry itself never changes identity (so filters' effects
   don't re-run when it updates), and a version that bumps when any filter turns
   on or off, which is what empty components re-render on. */
const FilterRegistryContext = createContext<FilterRegistry | null>(null);
const FilterVersionContext = createContext(0);
export function FilterRegistryProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const registry = useMemo<FilterRegistry>(() => {
    const entries = new Map<string, FilterEntry>();
    return {
      entries,
      baselines: new Map<string, string>(),
      set: (key, entry) => {
        const before = entries.get(key);
        if (entry) entries.set(key, entry);
        else entries.delete(key);
        if ((before?.active ?? false) !== (entry?.active ?? false)) setVersion((v) => v + 1);
      },
    };
  }, []);
  return (
    <FilterRegistryContext.Provider value={registry}>
      <FilterVersionContext.Provider value={version}>{children}</FilterVersionContext.Provider>
    </FilterRegistryContext.Provider>
  );
}

/**
 * Called by each filter with its current value. The first value it renders with
 * is the program's default, so a filter is active once it moves off it.
 */
export function useReportFilter(name: string, value: unknown) {
  const registry = useContext(FilterRegistryContext);
  const inCard = useContext(CardControlsContext);
  // One entry per rendered copy (the bar and the phone sheet each render the filter),
  // judged against one shared starting value, so closing the sheet can't erase the bar's state.
  const key = `${name}#${useId()}`;
  const serialized = JSON.stringify(value ?? null);
  const initial = useRef(serialized);
  if (registry && !inCard && !registry.baselines.has(name))
    registry.baselines.set(name, initial.current);
  const baseline = registry && !inCard ? registry.baselines.get(name)! : initial.current;
  const active = serialized !== baseline;
  useEffect(() => {
    if (!registry || inCard) return;
    registry.set(key, { active });
  }, [registry, inCard, key, active]);
  useEffect(() => () => registry?.set(key, null), [registry, key]);
}

/** Whether any filter narrows the data. */
export function useActiveFilters(): { active: boolean } {
  const registry = useContext(FilterRegistryContext);
  useContext(FilterVersionContext); // re-render when a filter turns on or off
  if (!registry) return { active: false };
  return { active: [...registry.entries.values()].some((entry) => entry.active) };
}
