// Reusable F1 asset components built on openly licensed data. See src/assets/f1/README.md.
import "flag-icons/css/flag-icons.min.css";
import circuitData from "../assets/f1/circuits.json";
import { carSidePath, carTopSvg } from "../assets/f1/cars";
import driverData from "../assets/f1/drivers.json";
import { helmetPath, helmetVisorPath } from "../assets/f1/helmet";

const SAIRA = '"Saira", sans-serif';

export type Driver = (typeof driverData.drivers)[number];
export type Circuit = (typeof circuitData.circuits)[number];

export const drivers: Driver[] = driverData.drivers;
export const circuits: Circuit[] = circuitData.circuits;

export const teams = [...new Map(drivers.map((d) => [d.team, { name: d.team, colour: d.teamColour }])).values()];

export const teamColour = (team: string) => teams.find((t) => t.name === team)?.colour ?? "#949498";

// Black or white text, whichever reads better on the given hex background.
function inkFor(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  // Contrast against white is 1.05 / (L + 0.05); against Carbon Black (L ≈ 0.008) it is (L + 0.05) / 0.058.
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.058 ? "#FFFFFF" : "#15151E";
}

/* TeamChip: team colour bar + name. No logos. */

export function TeamChip({ team, size = 20 }: { team: string; size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: size * 0.45, fontSize: size, lineHeight: 1.1 }}>
      <span
        style={{ width: size * 0.28, height: size * 1.2, borderRadius: 0, background: teamColour(team), flexShrink: 0 }}
      />
      <span style={{ fontFamily: SAIRA, fontWeight: 700, fontVariationSettings: '"wdth" 100' }}>{team}</span>
    </span>
  );
}

/* DriverAvatar: driver number + acronym on the team colour, or the driver's headshot. */

// formula1.com's 2026 driver portraits (1336×3840, transparent). The image CDN crops them
// around the detected face, so every avatar is framed the same way at a crisp 400px.
function headshotUrl(driver: Driver) {
  const code = driver.headshotUrl?.match(/\/drivers\/\w\/([A-Z0-9]+)_/)?.[1]?.toLowerCase();
  if (!code) return driver.headshotUrl;
  const team = driver.team.toLowerCase().replace(/[^a-z0-9]/g, "");
  return (
    "https://media.formula1.com/image/upload/f_auto/c_thumb,g_face,z_0.6,w_400,h_400/" +
    `v1740000001/common/f1/2026/${team}/${code}/2026${team}${code}right.webp`
  );
}

export function DriverAvatar({
  number,
  size = 96,
  showHeadshot = false,
}: {
  number: number;
  size?: number;
  /** 2026 portrait hotlinked from formula1.com (F1-owned; not stored in the repo). */
  showHeadshot?: boolean;
}) {
  const driver = drivers.find((d) => d.number === number);
  const colour = driver?.teamColour ?? "#949498";
  const ink = inkFor(colour);
  return (
    <div
      title={driver ? `${driver.fullName} · ${driver.team}` : `#${number}`}
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: "50%",
        background: colour,
        color: ink,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        fontFamily: SAIRA,
        flexShrink: 0,
      }}
    >
      {showHeadshot && driver?.headshotUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={headshotUrl(driver) ?? undefined}
            alt={driver.fullName}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
          <span
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              paddingBottom: size * 0.06,
              textAlign: "center",
              fontSize: size * 0.16,
              lineHeight: 1,
              fontWeight: 900,
              fontStyle: "italic",
              background: `linear-gradient(transparent, ${colour} 55%)`,
              paddingTop: size * 0.12,
            }}
          >
            {number}
          </span>
        </>
      ) : (
        <>
          <span
            style={{
              fontSize: size * 0.42,
              lineHeight: 1,
              fontWeight: 900,
              fontStyle: "italic",
              fontVariationSettings: '"wdth" 87',
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {number}
          </span>
          {driver && (
            <span
              style={{
                fontSize: size * 0.16,
                lineHeight: 1,
                marginTop: size * 0.04,
                fontWeight: 700,
                letterSpacing: "0.08em",
                fontVariationSettings: '"wdth" 110',
                opacity: 0.85,
              }}
            >
              {driver.acronym}
            </span>
          )}
        </>
      )}
    </div>
  );
}

/* Helmet: game-icons full-face helmet, mirrored to face right and tinted by team colour. */

export function Helmet({
  colour = "#E10600",
  size = 96,
  visor = "#15151E",
  title = "Race helmet",
}: {
  colour?: string;
  size?: number;
  visor?: string;
  /** Accessible label; pass "" to hide it from screen readers. */
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      role={title ? "img" : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
    >
      <g transform="matrix(-1 0 0 1 512 0)">
        <path d={helmetVisorPath} fill={visor} />
        <path d={helmetPath} fill={colour} />
      </g>
    </svg>
  );
}

/* CountryFlag: ISO 3166-1 alpha-2 code via flag-icons (MIT). */

export function CountryFlag({ code, size = 32, square = false }: { code: string; size?: number; square?: boolean }) {
  return (
    <span
      className={`fi fi-${code.toLowerCase()}${square ? " fis" : ""}`}
      role="img"
      aria-label={code.toUpperCase()}
      style={{
        width: square ? size : (size * 4) / 3,
        height: size,
        lineHeight: `${size}px`,
        borderRadius: 0,
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08)",
        flexShrink: 0,
      }}
    />
  );
}

/* CircuitMap: track outline projected from GeoJSON (lon/lat) into an SVG path. */

const VIEW = 1000;
const PAD = 60;

function circuitPath(coords: number[][]) {
  const midLat = (coords.reduce((s, [, lat]) => s + lat, 0) / coords.length) * (Math.PI / 180);
  const pts = coords.map(([lon, lat]) => [lon * Math.cos(midLat), -lat]);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [minX, minY] = [Math.min(...xs), Math.min(...ys)];
  const span = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY);
  const scale = (VIEW - PAD * 2) / span;
  const offX = (VIEW - (Math.max(...xs) - minX) * scale) / 2;
  const offY = (VIEW - (Math.max(...ys) - minY) * scale) / 2;
  const projected = pts.map(([x, y]) => [offX + (x - minX) * scale, offY + (y - minY) * scale]);
  const d = projected.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("") + "Z";
  return { d, start: projected[0] };
}

export function CircuitMap({
  id,
  size = 240,
  colour = "#15151E",
  strokeWidth = 28,
  showStart = true,
}: {
  /** bacinger/f1-circuits id, e.g. "us-2022" for Miami. */
  id: string;
  size?: number;
  colour?: string;
  strokeWidth?: number;
  showStart?: boolean;
}) {
  const circuit = circuits.find((c) => c.id === id);
  if (!circuit) return null;
  const { d, start } = circuitPath(circuit.coordinates);
  return (
    <svg viewBox={`0 0 ${VIEW} ${VIEW}`} width={size} height={size} role="img" aria-label={`${circuit.name} layout`}>
      <path d={d} fill="none" stroke={colour} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
      {showStart && <circle cx={start[0]} cy={start[1]} r={strokeWidth * 0.9} fill="#E10600" stroke="#FFFFFF" strokeWidth={8} />}
    </svg>
  );
}

/* CarSilhouette: open-licensed open-wheeler artwork (src/assets/f1/cars.ts), tinted by team colour. */

export function CarSilhouette({
  colour = "#E10600",
  width = 320,
  view = "side",
}: {
  colour?: string;
  width?: number;
  view?: "side" | "top";
}) {
  if (view === "top") {
    return (
      <span
        style={{ display: "inline-block", width, height: (width * 530) / 228, color: colour }}
        dangerouslySetInnerHTML={{ __html: carTopSvg }}
      />
    );
  }
  return (
    <svg viewBox="20 186 492 144" width={width} height={(width * 144) / 492} role="img" aria-label="Open-wheel race car">
      <path d={carSidePath} fill={colour} />
      {[102.97, 380.8].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={292.25} r={34} fill="#15151E" />
          <circle cx={cx} cy={292.25} r={13} fill="#47464C" />
          <circle cx={cx} cy={292.25} r={5} fill={colour} />
        </g>
      ))}
    </svg>
  );
}
