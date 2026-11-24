"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DataSourcesPanel } from "../DataSourcesPanel";
import { dockNames, dockStyles } from "../DataSourcesPanel/dataSourcesPanel.styles";
import type { DataSourcesPanelProps } from "../DataSourcesPanel/types";
import { ProvenanceContext, useArtifactProvenance } from "./contexts";

/** What an app can tell the default Sources panel, through the `Provenance` slot's props. */
export type SourcesOptions = Pick<DataSourcesPanelProps, "describeSource">;

interface DockState {
  options: SourcesOptions;
  setOptions: (options: SourcesOptions) => void;
  /** An app passed its own panel to `Provenance`: the default one steps aside. */
  custom: number;
  setCustom: (update: (count: number) => number) => void;
}

export const SourcesDockContext = createContext<DockState | null>(null);

const NO_OPTIONS: SourcesOptions = {};
/** What handles Escape itself, so it shouldn't also close Sources. */
const OWNS_ESCAPE =
  "[role=menu], [role=menuitem], [role=listbox], [role=option], [role=dialog], [role=combobox], select";

/** The artifact's content with the Sources panel docked beside it. */
export function SourcesWorkspace({ children }: { children: ReactNode }) {
  const provenance = useContext(ProvenanceContext);
  const [options, setOptions] = useState<SourcesOptions>(NO_OPTIONS);
  const [custom, setCustom] = useState(0);
  const dock = useMemo<DockState>(
    () => ({ options, setOptions, custom, setCustom }),
    [options, custom],
  );

  if (!provenance) return <>{children}</>;
  return (
    <SourcesDockContext.Provider value={dock}>
      <div
        className={`${dockStyles.workspace} ${dockNames.workspace}`}
        data-inspecting={provenance.isInspecting || undefined}
      >
        {children}
        {custom === 0 && <DefaultSourcesDock />}
      </div>
    </SourcesDockContext.Provider>
  );
}

/** The Sources panel in its slot: docked, an overlay when narrow, a bottom sheet on phones. */
function DefaultSourcesDock() {
  const dock = useContext(SourcesDockContext)!;
  const { selection, sources, clearSelection, isInspecting, setInspecting } =
    useArtifactProvenance();

  // A closed panel takes no focus or clicks. (`inert` as an attribute works in React 18 and 19.)
  const slotRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    slotRef.current?.toggleAttribute("inert", !isInspecting);
  }, [isInspecting]);

  const close = useCallback(() => {
    setInspecting(false);
    clearSelection();
  }, [setInspecting, clearSelection]);

  useEffect(() => {
    if (!isInspecting) return;
    // Escape closes Sources, unless it's closing something else first: a menu, list or dialog.
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const target = event.target as Element | null;
      if (target?.closest?.(OWNS_ESCAPE)) return;
      close();
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [isInspecting, close]);

  // A picked number's card is context, not the selection: mark it so only the number is ringed.
  useEffect(() => {
    const card = selection?.propElement ? selection.element : null;
    if (!card || card === selection?.propElement) return;
    card.setAttribute("data-openui-context", "");
    return () => card.removeAttribute("data-openui-context");
  }, [selection]);

  const panelSelection = useMemo(
    () => (selection ? { id: selection.id, prop: selection.prop } : null),
    [selection],
  );

  return (
    <div
      ref={slotRef}
      className={`${dockStyles.slot} ${dockNames.slot}`}
      data-open={isInspecting}
      aria-hidden={!isInspecting}
    >
      <DataSourcesPanel
        sources={sources}
        selection={panelSelection}
        onBack={clearSelection}
        onClose={close}
        describeSource={dock.options.describeSource}
      />
    </div>
  );
}
