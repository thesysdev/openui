import type { ReactNode } from "react";

/*
 * ToolIcon: one icon per OpenF1 tool the chat can call. Flat and solid on a
 * 24px grid, leaning with the italic type, in currentColor with one red detail.
 * The list below mirrors the registry in src/lib/f1/tools/index.ts.
 */

export type F1ToolName =
  | "get_schedule"
  | "get_standings"
  | "get_results"
  | "get_drivers"
  | "get_lap_times"
  | "get_gaps"
  | "get_positions"
  | "get_stints"
  | "get_race_control"
  | "get_timing_tower"
  | "get_telemetry"
  | "get_weather"
  | "get_team_radio";

const R = "var(--c-red, #E10600)";

// Each glyph: the carbon shapes, then the red detail on top. The parts that move while the tool
// runs carry a ti-* class; chat.css animates them under .f1c-ti--live.
const glyphs: Record<F1ToolName, ReactNode> = {
  // Calendar with one day marked. Live: the mark hops along the week.
  get_schedule: (
    <>
      <path fillRule="evenodd" d="M3 5h18v16H3zM5.5 10v8.5h13V10z" />
      <path d="M7 2h2.5v5H7zM14.5 2H17v5h-2.5z" />
      <path className="ti-day" fill={R} d="M13 12.5h3.5V16H13z" />
    </>
  ),
  // Podium, the winner's step in red. Live: the steps rise in turn.
  get_standings: (
    <>
      <path className="ti-step ti-step--2" d="M2 11h6v10H2z" />
      <path className="ti-step ti-step--3" d="M16 14h6v7h-6z" />
      <path className="ti-step ti-step--1" fill={R} d="M9 6h6v15H9z" />
    </>
  ),
  // Chequered flag. Live: it waves from the pole.
  get_results: (
    <>
      <path d="M3.5 2H6v20H3.5z" />
      <g className="ti-wave">
        <path d="M6 3h3.5v5H6zM13 3h3.5v5H13zM9.5 8H13v5H9.5zM16.5 8H20v5h-3.5z" />
        <path fill="none" stroke="currentColor" strokeWidth="1.4" d="M6.7 3.7h12.6v8.6H6.7z" />
      </g>
      <path fill={R} d="M3.5 19H6v3H3.5z" />
    </>
  ),
  // Helmet in profile, red visor. Live: the driver nods.
  get_drivers: (
    <g className="ti-nod">
      <path d="M2.5 15.5A9.5 9.5 0 0 1 21.5 12v5h-8.5l-2 3H4a1.5 1.5 0 0 1-1.5-1.5z" />
      <path fill={R} d="M12 9h9.2l.3 4H12z" />
    </g>
  ),
  // Stopwatch, red hand. Live: the hand sweeps round.
  get_lap_times: (
    <>
      <path fillRule="evenodd" d="M12 5.5a8.25 8.25 0 1 1 0 16.5 8.25 8.25 0 0 1 0-16.5zm0 2.6a5.65 5.65 0 1 0 0 11.3 5.65 5.65 0 0 0 0-11.3z" />
      <path d="M9.5 1.5h5V4h-5z" />
      {/* Drawn from the dial's centre (12, 13.75), so it can turn on the hub. */}
      <path className="ti-hand" fill={R} d="M12.35 14.81 10.94 13.4l3.75-3.75 1.41 1.41z" />
      <path d="M10.5 12.25h3v3h-3z" />
    </>
  ),
  // Two cars and the gap between them. Live: the gap opens and closes.
  get_gaps: (
    <>
      <path className="ti-car ti-car--a" d="M1.5 8.5h5.5v7H1.5z" />
      <path className="ti-car ti-car--b" d="M17 8.5h5.5v7H17z" />
      <path className="ti-gap" fill={R} d="M8 12l3-3v2h2V9l3 3-3 3v-2h-2v2z" />
    </>
  ),
  // Overtake: one car up in red, one down. Live: they trade places.
  get_positions: (
    <>
      <path className="ti-down" d="M8.5 21 3.5 16h3V3h4v13h3z" />
      <path className="ti-up" fill={R} d="M15.5 3l5 5h-3v13h-4V8h-3z" />
    </>
  ),
  // Tyre with its compound stripe. Live: it spins.
  get_stints: (
    <g className="ti-spin">
      <path fillRule="evenodd" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" />
      {/* Broken stripe, so the turn shows. */}
      <circle cx="12" cy="12" r="7.4" fill="none" stroke={R} strokeWidth="1.4" strokeDasharray="9 2.6" />
      <circle cx="12" cy="12" r="2.2" />
    </g>
  ),
  // Marshal flag. Live: it waves.
  get_race_control: (
    <>
      <path d="M3.5 2H6v20H3.5z" />
      <path className="ti-wave" fill={R} d="M6 3.5c4-1.6 6.5 1.6 10.5 0 1.6-.6 3-.7 4-.7v10c-1 0-2.4.1-4 .7-4 1.6-6.5-1.6-10.5 0z" />
    </>
  ),
  // Timing tower, the leader in red. Live: the gap bars flicker like a live tower.
  get_timing_tower: (
    <>
      <path fill={R} d="M2.5 2.5h4v4h-4z" />
      <path d="M2.5 8h4v4h-4zM2.5 13.5h4v4h-4zM2.5 19h4v3h-4z" />
      <path className="ti-bar ti-bar--1" d="M8 2.5h13.5v4H8z" />
      <path className="ti-bar ti-bar--2" d="M8 8h11v4H8z" />
      <path className="ti-bar ti-bar--3" d="M8 13.5h9v4H8z" />
      <path className="ti-bar ti-bar--4" d="M8 19h7v3H8z" />
    </>
  ),
  // Speed trace over an axis. Live: the trace draws across.
  get_telemetry: (
    <>
      <path d="M2 19.5h20V22H2z" />
      <path
        className="ti-trace"
        pathLength={1}
        fill="none"
        stroke={R}
        strokeWidth="2.4"
        strokeLinecap="square"
        strokeLinejoin="miter"
        d="M3 15.5l3.5-8 3 5.5 3.5-10 3.5 13 2.5-5H21"
      />
    </>
  ),
  // Cloud with rain. Live: the rain falls.
  get_weather: (
    <>
      <path d="M6.5 15a4.5 4.5 0 0 1 .6-9 5.8 5.8 0 0 1 10.9 1.6A3.7 3.7 0 0 1 17.8 15z" />
      <path className="ti-drop ti-drop--1" fill={R} d="M7.5 17h2.2l-1.6 5H5.9z" />
      <path className="ti-drop ti-drop--2" fill={R} d="M12.5 17h2.2l-1.6 5h-2.2z" />
      <path className="ti-drop ti-drop--3" fill={R} d="M17.5 17h2.2l-1.6 5h-2.2z" />
    </>
  ),
  // Speaker on air. Live: the waves pulse out.
  get_team_radio: (
    <>
      <path d="M2.5 8.5H7L12.5 4v16L7 15.5H2.5z" />
      <path className="ti-wave-in" fill="none" stroke={R} strokeWidth="2.4" strokeLinecap="square" d="M15.5 9a4.2 4.2 0 0 1 0 6" />
      <path className="ti-wave-out" fill="none" stroke={R} strokeWidth="2.4" strokeLinecap="square" d="M18.3 6.2a8.2 8.2 0 0 1 0 11.6" />
    </>
  ),
};

export const f1ToolList: { name: F1ToolName; label: string; about: string }[] = [
  { name: "get_schedule", label: "Schedule", about: "Season calendar, rounds and dates" },
  { name: "get_standings", label: "Standings", about: "Drivers' and constructors' championship" },
  { name: "get_results", label: "Results", about: "Classified result of a session" },
  { name: "get_drivers", label: "Drivers", about: "Entry list: numbers, codes, teams" },
  { name: "get_lap_times", label: "Lap times", about: "Laps, fastest laps and race pace" },
  { name: "get_gaps", label: "Gaps", about: "Gap to the leader or a rival, lap by lap" },
  { name: "get_positions", label: "Positions", about: "Running order and overtakes" },
  { name: "get_stints", label: "Tyres", about: "Stints, compounds and pit stops" },
  { name: "get_race_control", label: "Race control", about: "Flags, safety cars and penalties" },
  { name: "get_timing_tower", label: "Timing tower", about: "The order and gaps on any lap" },
  { name: "get_telemetry", label: "Telemetry", about: "Speed, throttle, brake and gear on a lap" },
  { name: "get_weather", label: "Weather", about: "Temperatures, wind and rain" },
  { name: "get_team_radio", label: "Team radio", about: "Radio clips by lap and driver" },
];

export const f1ToolLabel = (name: string) => f1ToolList.find((t) => t.name === name)?.label ?? name;

/** live: the icon's own small loop, for while its tool is running. Still under reduced motion. */
export function ToolIcon({ tool, size = 20, live = false }: { tool: string; size?: number; live?: boolean }) {
  const glyph = glyphs[tool as F1ToolName];
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      fill="currentColor"
      className={live ? "f1c-ti--live" : undefined}
      style={{ flex: "none", overflow: "visible" }}
    >
      {/* Lean with the italic type. */}
      <g transform="skewX(-8) translate(1.7 0)">{glyph ?? <path d="M4 4h16v16H4z" />}</g>
    </svg>
  );
}
