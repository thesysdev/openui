"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/* ---------- Comparison state ---------- */

type CompareState = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  /** What the previous period is called in legends and tooltips. */
  label: string;
  setLabel: (label: string) => void;
};

const CompareOverrideContext = createContext<boolean | null>(null);

/**
 * Turns compare on (or off) for every dashboard below it, without a
 * CompareToggle in the program: for previews, or hosts that compare by
 * default. null leaves each dashboard's own toggle in charge.
 */
export function CompareOverride({
  value,
  children,
}: {
  value: boolean | null;
  children: ReactNode;
}) {
  return (
    <CompareOverrideContext.Provider value={value}>{children}</CompareOverrideContext.Provider>
  );
}

const CompareContext = createContext<CompareState>({
  enabled: false,
  setEnabled: () => {},
  label: "Previous period",
  setLabel: () => {},
});

/**
 * Holds the "compare to previous period" switch for a whole dashboard. It's
 * presentation only (the previous-period data is already in the program), so
 * it lives in React rather than in OpenUI state.
 */
export function CompareProvider({ children }: { children: ReactNode }) {
  const forced = useContext(CompareOverrideContext);
  const [state, setEnabled] = useState(false);
  const [label, setLabel] = useState("Previous period");
  // A host override wins over the dashboard's own toggle.
  const enabled = forced ?? state;
  const value = useMemo(() => ({ enabled, setEnabled, label, setLabel }), [enabled, label]);
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export const useCompare = () => useContext(CompareContext);
