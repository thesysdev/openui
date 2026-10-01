// The F1 asset components as OpenUI components the agent can generate.
// The model passes only data (driver codes, team names, places); colours, sizes in pixels and
// artwork come from the assets, so every generated answer stays on brand.
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Car3D as Car3DAsset } from "./car-3d";
import {
  CarSilhouette as CarSilhouetteAsset,
  CircuitMap as CircuitMapAsset,
  CountryFlag as CountryFlagAsset,
  DriverAvatar as DriverAvatarAsset,
  Helmet as HelmetAsset,
  TeamChip as TeamChipAsset,
  circuits,
  drivers,
  teamColour,
  teams,
} from "./f1-assets";
import { TeamLogo as TeamLogoAsset } from "./f1-team-logos";
import { Mascot as MascotArt } from "./mascot";

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

/** A driver by number, code ("LEC"), surname or full name. */
export function findDriver(ref: string | number) {
  const q = fold(String(ref));
  return (
    drivers.find((d) => String(d.number) === q) ??
    drivers.find((d) => fold(d.acronym) === q) ??
    drivers.find((d) => fold(d.lastName) === q || fold(d.fullName) === q) ??
    drivers.find((d) => q.length > 2 && fold(d.fullName).includes(q))
  );
}

const teamAliases: Record<string, string> = {
  redbull: "Red Bull Racing",
  haas: "Haas F1 Team",
  rb: "Racing Bulls",
  vcarb: "Racing Bulls",
  sauber: "Audi",
  kicksauber: "Audi",
};

/** A 2026 team by name ("Red Bull", "Haas"), or by one of its drivers. */
export function findTeam(ref: string) {
  const q = fold(ref);
  const name =
    teams.find((t) => fold(t.name) === q)?.name ??
    teamAliases[q] ??
    teams.find((t) => q.length > 2 && (fold(t.name).includes(q) || q.includes(fold(t.name))))?.name ??
    findDriver(ref)?.team;
  return name;
}

/** A 2026 circuit by place ("Monza", "Baku"), Grand Prix, circuit name or id ("it-1922"). */
export function findCircuit(ref: string) {
  const q = fold(ref.replace(/grand prix|\bgp\b/gi, ""));
  if (!q) return undefined;
  return (
    circuits.find((c) => c.id === ref) ??
    circuits.find((c) => [c.location, c.grandPrix.replace(/ Grand Prix$/, ""), c.name].some((f) => fold(f) === q)) ??
    circuits.find((c) => [c.location, c.grandPrix, c.name].some((f) => fold(f).includes(q)))
  );
}

const size = z.enum(["s", "m", "l"]).optional();
const px = (s: "s" | "m" | "l" | undefined, scale: [number, number, number]) =>
  scale[s === "s" ? 0 : s === "l" ? 2 : 1];

const teamArg = z.string().describe('Team name, e.g. "Ferrari", "Red Bull Racing", "McLaren".');

export const DriverAvatar = defineComponent({
  name: "DriverAvatar",
  props: z.object({
    driver: z.string().describe('Driver code ("LEC"), number ("16") or surname ("Leclerc").'),
    size,
    photo: z.boolean().optional(),
  }),
  description:
    'Round driver avatar on the team colour: number and code, or the 2026 portrait when photo is true. driver: code ("LEC"), number ("16") or surname. size: "s" | "m" (default) | "l".',
  component: ({ props }) => {
    const driver = findDriver(props.driver);
    const number = driver?.number ?? Number(props.driver);
    if (!Number.isFinite(number)) return <TeamChipAsset team={String(props.driver)} size={16} />;
    return <DriverAvatarAsset number={number} size={px(props.size, [40, 72, 120])} showHeadshot={props.photo} />;
  },
});

export const TeamLogo = defineComponent({
  name: "TeamLogo",
  props: z.object({ team: teamArg, size }),
  description: 'Official 2026 team logo. team: name such as "Ferrari", "Red Bull Racing", "McLaren". size: "s" | "m" (default) | "l".',
  component: ({ props }) => {
    const team = findTeam(props.team);
    if (!team) return <TeamChipAsset team={props.team} size={16} />;
    return <TeamLogoAsset team={team} size={px(props.size, [32, 56, 96])} />;
  },
});

export const TeamChip = defineComponent({
  name: "TeamChip",
  props: z.object({ team: teamArg }),
  description: 'Inline team label: a bar in the team colour and the team name. team: name such as "Ferrari". Good in lists and beside numbers.',
  component: ({ props }) => <TeamChipAsset team={findTeam(props.team) ?? props.team} size={16} />,
});

export const CircuitMap = defineComponent({
  name: "CircuitMap",
  props: z.object({
    circuit: z.string().describe('Place, Grand Prix or circuit, e.g. "Monza", "Miami", "Silverstone", "Abu Dhabi".'),
    size,
  }),
  description: 'Track outline of a 2026 circuit with the start marked. circuit: place, Grand Prix or circuit name, e.g. "Monza", "Miami", "Abu Dhabi". size: "s" | "m" (default) | "l".',
  component: ({ props }) => {
    const circuit = findCircuit(props.circuit);
    if (!circuit) return null;
    const s = px(props.size, [96, 200, 320]);
    return <CircuitMapAsset id={circuit.id} size={s} strokeWidth={s < 120 ? 44 : 28} />;
  },
});

export const CountryFlag = defineComponent({
  name: "CountryFlag",
  props: z.object({
    country: z.string().describe('ISO 3166-1 alpha-2 code ("it") or a circuit place ("Monza") for the host country.'),
    size,
  }),
  description: 'Country flag. country: ISO 3166-1 alpha-2 code ("it") or a circuit place ("Monza") for its host country. size: "s" | "m" (default) | "l".',
  component: ({ props }) => {
    const code = /^[a-z]{2}$/i.test(props.country) ? props.country : findCircuit(props.country)?.countryCode;
    if (!code) return null;
    return <CountryFlagAsset code={code} size={px(props.size, [16, 24, 40])} />;
  },
});

export const CarSilhouette = defineComponent({
  name: "CarSilhouette",
  props: z.object({ team: teamArg, view: z.enum(["side", "top"]).optional(), size }),
  description: 'Flat car silhouette in the team colour. team: team name. view: "side" (default) | "top". size: "s" | "m" (default) | "l".',
  component: ({ props }) => (
    <CarSilhouetteAsset
      colour={teamColour(findTeam(props.team) ?? "")}
      view={props.view}
      width={px(props.size, props.view === "top" ? [48, 80, 120] : [160, 280, 420])}
    />
  ),
});

export const Car3D = defineComponent({
  name: "Car3D",
  props: z.object({ team: teamArg, size }),
  description: 'Illustrated top-down car in the team colour, nose down, in the house print style. team: team name. size: "s" | "m" (default) | "l".',
  component: ({ props }) => {
    const team = findTeam(props.team);
    return <Car3DAsset colour={teamColour(team ?? "")} width={px(props.size, [100, 180, 260])} title={team ? `${team} car` : "Race car"} />;
  },
});

export const Helmet = defineComponent({
  name: "Helmet",
  props: z.object({ team: teamArg, size }),
  description: 'Race helmet in the team colour. team: team name. size: "s" | "m" (default) | "l".',
  component: ({ props }) => {
    const team = findTeam(props.team);
    return <HelmetAsset colour={teamColour(team ?? "")} size={px(props.size, [40, 72, 120])} title={team ? `${team} helmet` : "Race helmet"} />;
  },
});

export const Mascot = defineComponent({
  name: "Mascot",
  props: z.object({
    size,
    // Placeholder for the emoticons to come: every mood draws the same art for now.
    mood: z.enum(["neutral", "happy", "thinking", "excited", "sad"]).optional(),
  }),
  description:
    'The F1 Design mascot, the agent\'s own face. Use it only to introduce yourself or greet the user, beside a short hello; never inside answers about data. size: "s" | "m" (default) | "l". mood: "neutral" (default) | "happy" | "thinking" | "excited" | "sad".',
  component: ({ props }) => <MascotArt size={px(props.size, [64, 120, 200])} alt={`F1 Design mascot, ${props.mood ?? "neutral"}`} />,
});

export const f1Components = [Mascot, DriverAvatar, TeamLogo, TeamChip, CircuitMap, CountryFlag, CarSilhouette, Car3D, Helmet];
