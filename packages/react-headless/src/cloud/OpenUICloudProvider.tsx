"use client";

import { useCallback, useRef, type ReactNode } from "react";
import { ArtifactStorageContext } from "../store/ArtifactStorageContext";
import type { FrontendTokenSource } from "./frontendTokenManager";
import { useOpenuiCloudStorage, type OpenuiCloudOptions } from "./openuiCloud";

/** @category Types */
export interface OpenUICloudProviderProps extends Omit<OpenuiCloudOptions, "features"> {
  children?: ReactNode;
}

export function OpenUICloudProvider({ token, children, ...options }: OpenUICloudProviderProps) {
  const tokenRef = useRef(token);
  tokenRef.current = token;
  const readToken = useCallback(() => {
    const current = tokenRef.current;
    return typeof current === "string" ? Promise.resolve(current) : current();
  }, []);
  const source: FrontendTokenSource = typeof token === "string" ? token : readToken;

  const storage = useOpenuiCloudStorage({ ...options, token: source });
  return (
    <ArtifactStorageContext.Provider value={storage.artifact ?? null}>
      {children}
    </ArtifactStorageContext.Provider>
  );
}
