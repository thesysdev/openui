// Small icons shared by the chat pieces. They lean with the italic type and use currentColor.

/** The kerb-stripe arrow from RadioInput's ASK key: a solid head over a stem cut into two blocks. */
export function KerbArrow({ direction = "up", size = 14 }: { direction?: "up" | "right" | "down"; size?: number }) {
  const turn = { up: 0, right: 90, down: 180 }[direction];
  return (
    <svg viewBox="0 0 16 18" width={size} height={(size * 18) / 16} aria-hidden style={{ flex: "none", overflow: "visible" }}>
      <g transform={`rotate(${turn} 8 9)`}>
        <g transform="skewX(-12) translate(2 0)" fill="currentColor">
          <path d="M8 0 16 8.5H0z" />
          <path d="M5.5 10h5v3.5h-5z" />
          <path d="M5.5 15h5v3h-5z" />
        </g>
      </g>
    </svg>
  );
}

/** Speaker from the team-radio graphic: a filled circle with the speaker cut in. */
export function SpeakerIcon({ color = "#E10600", knockout = "#FFFFFF", size = 14 }: { color?: string; knockout?: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden style={{ flex: "none" }}>
      <circle cx="12" cy="12" r="12" fill={color} />
      <path d="M6 10h3l4-3.5v11L9 14H6z" fill={knockout} />
      <path d="M15.5 9.2a4 4 0 0 1 0 5.6M17.6 7.2a7 7 0 0 1 0 9.6" stroke={knockout} strokeWidth="1.8" fill="none" />
    </svg>
  );
}

/** A flat chevron, square-ended. */
export function Chevron({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 14 14" width={size} height={size} aria-hidden className="f1c-rc__chevron">
      <path d="M2 5l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="square" />
    </svg>
  );
}
