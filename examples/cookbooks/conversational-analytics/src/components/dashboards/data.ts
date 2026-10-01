"use client";

import { useEffect, useState } from "react";

/*
 * Dashboard data: the same F1 tools the chat uses, through POST /api/f1/[tool]. Each call is
 * kept for the page's lifetime, so moving between Home, Standings, Drivers and Teams draws
 * straight from memory instead of loading again.
 */

export type ScheduleRow = {
  round: number | null;
  name: string;
  location: string;
  country: string;
  countryCode: string;
  circuit: string;
  start: string;
  end: string;
  raceStart: string | null;
  status: "completed" | "upcoming" | "next" | "in progress" | "cancelled";
  sprint: boolean;
  sessions?: { name: string; start: string; finished: boolean }[];
};
export type Schedule = { session: string; rows: ScheduleRow[]; next: { round: number; name: string; raceStart: string | null } | null; summary: string };

export type DriverStanding = {
  position: number;
  code: string;
  name: string;
  team: string | null;
  teamColour: string | null;
  points: number;
  gained: number | null;
  positionChange: number | null;
};
export type TeamStanding = { position: number; team: string; teamColour: string | null; points: number; gained: number | null; positionChange: number | null };
export type Standings<T> = { session: string; rows: T[]; summary?: string };

/** One row per round: { round, race, circuit, ANT: 302, … } (team names as keys for teams). */
export type Progression = { session: string; rows: Record<string, string | number>[] };

export type ResultRow = {
  position: number | null;
  number: number;
  code: string;
  name: string | null;
  team: string | null;
  teamColour: string | null;
  grid: number | null;
  gained: number | null;
  laps: number | null;
  time: string | null;
  gap: string | null;
  points: number | null;
  status: string;
  fastestLap: string | null;
  fastestLapSeconds: number | null;
};
export type Results = { session: string; rows: ResultRow[] };

const cache = new Map<string, Promise<unknown>>();

export function f1<T>(tool: string, args: Record<string, unknown> = {}): Promise<T> {
  const key = `${tool} ${JSON.stringify(args)}`;
  let hit = cache.get(key);
  if (!hit) {
    hit = fetch(`/api/f1/${tool}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(args) })
      .then(async (r) => {
        const body = await r.json().catch(() => null);
        if (r.ok) return body;
        // A question the tools can't answer (no such race) stays answered; a server failure is
        // forgotten, so the next visit tries again.
        if (r.status >= 500) cache.delete(key);
        throw new Error(body?.error ?? `${tool} failed`);
      }, (error) => {
        // Offline or aborted: try again next time.
        cache.delete(key);
        throw error;
      });
    cache.set(key, hit);
  }
  return hit as Promise<T>;
}

/** The tool's answer once it arrives; undefined while loading, null if it failed. */
export function useF1<T>(tool: string, args: Record<string, unknown> = {}, enabled = true): T | null | undefined {
  const key = JSON.stringify(args);
  const [state, setState] = useState<{ key: string; data: T | null } | undefined>();
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    f1<T>(tool, JSON.parse(key))
      .then((data) => live && setState({ key: tool + key, data }))
      .catch(() => live && setState({ key: tool + key, data: null }));
    return () => {
      live = false;
    };
  }, [tool, key, enabled]);
  return state?.key === tool + key ? state.data : undefined;
}

/** "Kimi Antonelli" → "Antonelli"; codes and one-word names stay as they are. */
export const surname = (name: string) => name.split(" ").slice(1).join(" ") || name;

/** Short team names for tight places. */
export const shortTeam = (team: string) =>
  ({ "Red Bull Racing": "Red Bull", "Haas F1 Team": "Haas", "Racing Bulls": "Racing Bulls" })[team] ?? team;
