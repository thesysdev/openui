"use client";

import { useCallback, useRef, type ReactNode } from "react";
import { ArtifactStorageContext } from "../store/ArtifactStorageContext";
import type { FrontendTokenSource } from "./frontendTokenManager";
import { useOpenuiCloudStorage, type OpenuiCloudOptions } from "./openuiCloud";
import { ArtifactPollIntervalContext } from "./pollInterval";

/** @category Types */
export interface OpenUICloudProviderProps extends Omit<OpenuiCloudOptions, "features"> {
  /**
   * How often every open artifact checks for a newer version, a rename or an
   * access change, in ms (at least 3s), unless its renderer sets its own.
   * `false`: never. Default 30s.
   */
  pollInterval?: number | false;
  children?: ReactNode;
}

export function OpenUICloudProvider({
  token,
  pollInterval,
  children,
  ...options
}: OpenUICloudProviderProps) {
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
      <ArtifactPollIntervalContext.Provider value={pollInterval}>
        {children}
      </ArtifactPollIntervalContext.Provider>
    </ArtifactStorageContext.Provider>
  );
}
