"use client";

import { useCallback, useEffect, useState } from "react";

import { DEFAULT_MODEL, MODEL_OPTIONS } from "@/lib/models";

// The chosen model is saved in localStorage so it survives a page refresh.
const MODEL_STORAGE_KEY = "openui-cloud:selected-model";

export function getPersistedModel(): string {
  if (typeof window === "undefined") return DEFAULT_MODEL;
  try {
    const saved = window.localStorage.getItem(MODEL_STORAGE_KEY);
    if (saved && MODEL_OPTIONS.some((option) => option.id === saved)) {
      return saved;
    }
  } catch {
    // Ignore storage failures (private mode, quota, disabled storage).
  }
  return DEFAULT_MODEL;
}

// Like useState, but the value is remembered across refreshes.
export function usePersistedModel(): readonly [
  string,
  (model: string) => void,
] {
  const [model, setModel] = useState(DEFAULT_MODEL);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setModel(getPersistedModel());
  }, []);

  // Update the model and save the new choice to localStorage.
  const selectModel = useCallback((next: string) => {
    setModel(next);
    try {
      window.localStorage.setItem(MODEL_STORAGE_KEY, next);
    } catch {
      // Ignore storage failures (private mode, quota, disabled storage).
    }
  }, []);

  return [model, selectModel] as const;
}
