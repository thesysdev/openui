"use client";

import { useCallback, useRef, type ReactNode } from "react";
import { ArtifactStorageProvider } from "../store/ArtifactStorageContext";
import type { FrontendTokenSource } from "./frontendTokenManager";
import { useOpenuiCloudStorage, type OpenuiCloudOptions } from "./openuiCloud";

/** @category Types */
export interface OpenUICloudProviderProps extends Omit<OpenuiCloudOptions, "features"> {
  children?: ReactNode;
}

/**
 * Connects artifact renderers to OpenUI Cloud, so they can stream and load
 * artifacts by id. Wrap the part of your app that renders artifacts in it.
 *
 * Inside `<AgentInterface storage={useOpenuiCloudStorage(…)}>` (or any
 * `ChatProvider` with `storage.artifact`), artifact storage is provided
 * already and this isn't needed.
 *
 * @category Components
 */
export function OpenUICloudProvider({ token, children, ...options }: OpenUICloudProviderProps) {
  // A function `token` is often an inline arrow. Read it through a ref, so a
  // new identity on every render doesn't rebuild the storage and drop its streams.
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const readToken = useCallback(() => {
    const current = tokenRef.current;
    return typeof current === "string" ? Promise.resolve(current) : current();
  }, []);
  const source: FrontendTokenSource = typeof token === "string" ? token : readToken;

  const storage = useOpenuiCloudStorage({ ...options, token: source });
  return (
    <ArtifactStorageProvider value={storage.artifact ?? null}>{children}</ArtifactStorageProvider>
  );
}
