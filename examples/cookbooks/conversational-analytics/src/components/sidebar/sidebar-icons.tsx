// Flat line icons for the nav, drawn in currentColor so they follow the item's state.
const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinejoin: "miter" as const,
  "aria-hidden": true,
};

export function HomeIcon() {
  return (
    <svg {...base}>
      <path d="M3 11 12 3l9 8M5 9.5V21h5v-6h4v6h5V9.5" />
    </svg>
  );
}

/** A podium: 2, 1, 3. */
export function StandingsIcon() {
  return (
    <svg {...base}>
      <path d="M2 21V13h6.5v8M8.5 21V6h7v15M15.5 21v-5H22v5M1 21h22" />
    </svg>
  );
}

/** A helmet side-on with its visor slot. */
export function DriversIcon() {
  return (
    <svg {...base}>
      <path d="M3 17c0-6.5 4-11 10-11 4.5 0 8 3 8 7.5V17H3Z" />
      <path d="M11 11h10" />
    </svg>
  );
}

/** A chequered flag. */
export function TeamsIcon() {
  return (
    <svg {...base}>
      <path d="M5 22V3" />
      <path d="M5 4h15v10H5" />
      <path d="M10 4v10M15 4v10M5 9h15" />
    </svg>
  );
}

/** The team-radio speaker from RadioInput: a warm-white disc with the speaker cut out in carbon. */
export function RadioIcon({ size = 14, color = "#F7F4F1" }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden style={{ flex: "none" }}>
      <circle cx="12" cy="12" r="12" fill={color} />
      <path d="M6 10h3l4-3.5v11L9 14H6z" fill="#15151E" />
      <path d="M15.5 9.2a4 4 0 0 1 0 5.6M17.6 7.2a7 7 0 0 1 0 9.6" stroke="#15151E" strokeWidth="1.8" fill="none" />
    </svg>
  );
}

/** A panel with its left rail: the collapse / expand control. */
export function PanelIcon() {
  return (
    <svg {...base}>
      <path d="M3 4h18v16H3z" />
      <path d="M9 4v16" />
    </svg>
  );
}

/** A square-ended plus. Uses currentColor. */
export function PlusIcon({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 12 12" width={size} height={size} aria-hidden style={{ flex: "none" }}>
      <path d="M6 0v12M0 6h12" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  );
}
