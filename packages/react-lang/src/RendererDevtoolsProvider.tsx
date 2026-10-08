import { createContext, useContext, type ReactNode } from "react";

export interface RendererDevtoolsRun {
  /** Renderers with the same ID appear in one Inspect group. Keep it stable during a generation. */
  id: string;
  /** Display title for the run group, such as the user's prompt. */
  title?: string;
}

const RendererDevtoolsContext = createContext<RendererDevtoolsRun | undefined>(undefined);

/** Supplies Inspect run metadata to all nested Renderers. */
export function RendererDevtoolsProvider({
  run,
  children,
}: {
  run?: RendererDevtoolsRun;
  children: ReactNode;
}) {
  return (
    <RendererDevtoolsContext.Provider value={run}>{children}</RendererDevtoolsContext.Provider>
  );
}

export function useRendererDevtoolsRun(): RendererDevtoolsRun | undefined {
  return useContext(RendererDevtoolsContext);
}
