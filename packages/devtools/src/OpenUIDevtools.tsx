"use client";

import { useEffect } from "react";
import { mountOpenUIDevtoolsFromCdn } from "./cdn";
import type { OpenUIDevtoolsProps } from "./types";

export type { ColorMode, DevtoolsPosition, OpenUIDevtoolsProps } from "./types";

/**
 * Development-only OpenUI Inspect / Debug widget.
 *
 * The npm package is a thin host wrapper: in development it fetches the CDN
 * browser build and mounts it with this app's React, ReactDOM, and react-lang.
 * All props (`theme`, `position`, `maxEvents`, …) are forwarded into that
 * widget. Pass `version` to pin the CDN tag (`"0"`, `"0.1"`, `"0.1.0"`);
 * omit it for `@latest`.
 *
 * Renders nothing itself — the widget attaches to `document.body`.
 */
export function OpenUIDevtools(props: OpenUIDevtoolsProps) {
  const {
    enabled,
    position,
    maxEvents,
    errorsOnly,
    autoOpenOnError,
    theme,
    version,
    __autoMounted,
  } = props;

  useEffect(() => {
    return mountOpenUIDevtoolsFromCdn({
      enabled,
      position,
      maxEvents,
      errorsOnly,
      autoOpenOnError,
      theme,
      version,
      __autoMounted,
    });
  }, [enabled, position, maxEvents, errorsOnly, autoOpenOnError, theme, version, __autoMounted]);

  return null;
}
