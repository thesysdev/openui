"use client";

import { useState } from "react";

// Gallery previews for the F1 charts, on real data from the local OpenF1 snapshot
// (samples.json, written by scripts/f1-chart-samples.ts).
import {
  ChampionshipProgress,
  GapChart,
  HeadToHeadBars,
  LapTimes,
  RaceTrace,
  RankedBars,
  Sparkline,
  StatCallout,
  StintBar,
} from "./f1-charts-special";
import { lapTime } from "./chart-kit";
import samples from "./samples.json";

type Row = Record<string, unknown>;
const race = "Baku";
const pick = (rows: Row[], keys: string[]) => rows.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => keys.some((c) => k === c || k.startsWith(`${c}_`)))));

function GapChartPreview() {
  const rows = samples.gaps.rows as Row[];
  const codes = Object.keys(rows[0]).filter((k) => k !== "lap");
  return (
    <GapChart
      title={`Gap to the leader, ${race}`}
      rows={rows}
      pits={samples.stints.pitStops.filter((p) => codes.includes(p.code))}
    />
  );
}

function RaceTracePreview() {
  return <RaceTrace title={`Race trace, ${race} top six`} rows={samples.laps as Row[]} />;
}

function LapTimesPreview() {
  return (
    <>
      <LapTimes
        title={`Leclerc's laps by tyre, ${race}`}
        rows={pick(samples.laps as Row[], ["lap", "LEC"])}
        stints={samples.stints.rows.filter((s) => s.code === "LEC")}
      />
      <LapTimes
        title={`Russell vs Verstappen, ${race}`}
        rows={pick(samples.laps as Row[], ["lap", "RUS", "VER"])}
        stints={samples.stints.rows.filter((s) => s.code === "RUS" || s.code === "VER")}
      />
    </>
  );
}

function RankedBarsPreview() {
  const rows = samples.quali.rows.filter((r) => r.position && r.position > 1 && r.position <= 10);
  return (
    <RankedBars
      title={`Gap to Russell's pole, ${race} qualifying`}
      rows={rows.map((r) => ({ code: r.code, value: r.gapToPole }))}
      format="gap"
    />
  );
}

function HeadToHeadBarsPreview() {
  const h = samples.headToHead;
  return (
    <HeadToHeadBars
      title={`Leclerc vs Hamilton, 2026 after ${h.rounds} rounds`}
      drivers={h.drivers as [string, string]}
      measures={h.measures as { label: string; values: [number, number]; better?: "lower" }[]}
    />
  );
}

function StintBarPreview() {
  const top = samples.race.map((r) => r.code);
  return <StintBar title={`Tyre strategies, ${race} top ten`} rows={samples.stints.rows.filter((s) => top.includes(s.code))} />;
}

function ChampionshipProgressPreview() {
  const rows = samples.progression.rows as Row[];
  return (
    <>
      <ChampionshipProgress title="Drivers' championship, 2026" rows={rows} />
      <ChampionshipProgress title="Gap to Antonelli, 2026" rows={rows} mode="gap" />
    </>
  );
}

function StatCalloutPreview() {
  const [p1, p2] = samples.race;
  const gained = [...samples.race].sort((a, b) => b.grid - b.position - (a.grid - a.position))[0];
  const fl = samples.fastestLap;
  return (
    <div className="f1s-preview-row">
      <StatCallout driver={p1.code} label="Winning margin" value={(p2.gap ?? "").replace(/[+s]/g, "")} unit="s" note={`Ahead of ${p2.code} at ${race}`} />
      <StatCallout driver={fl.code} label="Fastest lap" value={lapTime(fl.seconds, 3)} note={`Lap ${fl.lap}`} />
      <StatCallout
        driver={gained.code}
        label="Places gained"
        value={`+${gained.grid - gained.position}`}
        note={`P${gained.grid} on the grid to P${gained.position}`}
      />
    </div>
  );
}

function SparklinePreview() {
  const rows = samples.progression.rows as Row[];
  const last = rows.at(-1)!;
  const codes = Object.keys(last).filter((k) => /^[A-Z]{3}$/.test(k));
  // Points scored at each round, not the running total.
  const perRound = (code: string) => rows.map((r, i) => Number(r[code] ?? 0) - (i ? Number(rows[i - 1][code] ?? 0) : 0));
  return (
    <div className="f1s-preview-list">
      {codes.map((code) => (
        <div key={code} className="f1s-preview-list-row">
          <b>{code}</b>
          <Sparkline driver={code} values={perRound(code)} labels={rows.map((r) => String(r.circuit))} format={(v) => `${v} pts`} width={120} />
          <span>{String(last[code])}</span>
        </div>
      ))}
      <p className="ref-note">Points scored per round, 2026. Sparklines sit inside rows, stats and tower cells, so they have no panel or axes.</p>
    </div>
  );
}

// Each preview at the width of an answer in the chat thread, with a control that remounts it
// to play its reveal again.
function Replayable({ View }: { View: () => React.ReactNode }) {
  const [run, setRun] = useState(0);
  return (
    <div className="f1s-preview">
      <div className="f1s-replay">
        <button type="button" onClick={() => setRun((n) => n + 1)}>
          ↻ Replay
        </button>
      </div>
      <View key={run} />
    </div>
  );
}
const framed = (name: string, View: () => React.ReactNode) => ({ name, View: () => <Replayable View={View} /> });

export const f1ChartPreviews = [
  framed("GapChart", GapChartPreview),
  framed("RaceTrace", RaceTracePreview),
  framed("LapTimes", LapTimesPreview),
  framed("RankedBars", RankedBarsPreview),
  framed("HeadToHeadBars", HeadToHeadBarsPreview),
  framed("StintBar", StintBarPreview),
  framed("ChampionshipProgress", ChampionshipProgressPreview),
  framed("StatCallout", StatCalloutPreview),
  framed("Sparkline", SparklinePreview),
];
