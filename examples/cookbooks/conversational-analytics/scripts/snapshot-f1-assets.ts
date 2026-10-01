// Snapshots the open data behind the F1 asset components into src/assets/f1.
// Run with: npx tsx scripts/snapshot-f1-assets.ts
// - Drivers and team colours: OpenF1 (https://openf1.org), latest session.
// - Calendar: OpenF1 meetings. Circuit outlines: github.com/bacinger/f1-circuits (MIT).
import { writeFile } from "node:fs/promises";

const OUT = new URL("../src/assets/f1/", import.meta.url);
const CIRCUITS = "https://raw.githubusercontent.com/bacinger/f1-circuits/master";
const SEASON = 2026;

const getJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
};

type OpenF1Driver = {
  driver_number: number;
  full_name: string;
  first_name: string;
  last_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  headshot_url: string | null;
  session_key: number;
};

const drivers: OpenF1Driver[] = await getJson("https://api.openf1.org/v1/drivers?session_key=latest");
await writeFile(
  new URL("drivers.json", OUT),
  JSON.stringify(
    {
      source: "https://api.openf1.org/v1/drivers?session_key=latest",
      sessionKey: drivers[0]?.session_key,
      snapshotAt: new Date().toISOString().slice(0, 10),
      drivers: drivers.map((d) => ({
        number: d.driver_number,
        fullName: d.full_name,
        firstName: d.first_name,
        lastName: d.last_name,
        acronym: d.name_acronym,
        team: d.team_name,
        teamColour: `#${d.team_colour}`,
        headshotUrl: d.headshot_url,
      })),
    },
    null,
    2,
  ) + "\n",
);

// The calendar itself comes from OpenF1 meetings, so cancellations and relocations
// (2026: Bahrain and Saudi Arabia cancelled in April, Bahrain GP rerun at Sepang) stay current.
type Meeting = {
  meeting_name: string;
  location: string;
  circuit_short_name: string;
  date_start: string;
  is_cancelled?: boolean;
};
type Feature = { properties: { id: string; length: number }; geometry: { coordinates: [number, number][] } };

// OpenF1 circuit_short_name → bacinger/f1-circuits id.
const CIRCUIT_IDS: Record<string, string> = {
  Melbourne: "au-1953",
  Shanghai: "cn-2004",
  Suzuka: "jp-1962",
  Sakhir: "bh-2002",
  Jeddah: "sa-2021",
  Miami: "us-2022",
  Montreal: "ca-1978",
  "Monte Carlo": "mc-1929",
  Catalunya: "es-1991",
  Spielberg: "at-1969",
  Silverstone: "gb-1948",
  "Spa-Francorchamps": "be-1925",
  Hungaroring: "hu-1986",
  Zandvoort: "nl-1948",
  Monza: "it-1922",
  Madring: "es-2026",
  Baku: "az-2016",
  "Kuala Lumpur": "my-1999",
  Singapore: "sg-2008",
  Austin: "us-2012",
  "Mexico City": "mx-1962",
  Interlagos: "br-1940",
  "Las Vegas": "us-2023",
  Lusail: "qa-2004",
  "Yas Marina Circuit": "ae-2009",
};

const meetings: Meeting[] = (await getJson(`https://api.openf1.org/v1/meetings?year=${SEASON}`)).filter(
  (m: Meeting) => m.meeting_name.endsWith("Grand Prix"),
);
const geo: { features: Feature[] } = await getJson(`${CIRCUITS}/f1-circuits.geojson`);
const round = (n: number) => Math.round(n * 1e5) / 1e5;

let raceRound = 0;
const circuits = meetings.map((m) => {
  const id = CIRCUIT_IDS[m.circuit_short_name];
  const feature = geo.features.find((f) => f.properties.id === id);
  if (!feature) throw new Error(`No outline for ${m.circuit_short_name}`);
  const cancelled = Boolean(m.is_cancelled);
  return {
    id,
    round: cancelled ? null : ++raceRound,
    status: cancelled ? "cancelled" : "scheduled",
    grandPrix: m.meeting_name,
    name: (feature.properties as unknown as { Name: string }).Name,
    location: m.location,
    countryCode: id.slice(0, 2),
    dateStart: m.date_start.slice(0, 10),
    lengthMeters: feature.properties.length,
    coordinates: feature.geometry.coordinates.map(([lon, lat]) => [round(lon), round(lat)]),
  };
});

await writeFile(
  new URL("circuits.json", OUT),
  JSON.stringify({
    source: "Outlines: https://github.com/bacinger/f1-circuits (MIT). Calendar: https://api.openf1.org/v1/meetings",
    license: "MIT",
    season: SEASON,
    snapshotAt: new Date().toISOString().slice(0, 10),
    circuits,
  }) + "\n",
);
await writeFile(new URL("LICENSE-f1-circuits.md", OUT), await (await fetch(`${CIRCUITS}/LICENSE.md`)).text());
console.log(`Wrote ${drivers.length} drivers and ${circuits.length} Grands Prix (${raceRound} scheduled).`);
