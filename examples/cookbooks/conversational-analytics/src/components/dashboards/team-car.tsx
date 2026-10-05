import { Car3D } from "../car-3d";

/* TeamCar: the painted car of each team (public/cars), seen from the front and above, in the
   same 760×1225 frame as Car3D. A team without a painting falls back to Car3D in its colour. */

const FILES: Record<string, string> = {
  Mercedes: "mercedes",
  Ferrari: "ferrari",
  McLaren: "mclaren",
  "Red Bull Racing": "red-bull-racing",
  "Racing Bulls": "racing-bulls",
  Alpine: "alpine",
  "Haas F1 Team": "haas",
  Audi: "audi",
  Williams: "williams",
  "Aston Martin": "aston-martin",
  Cadillac: "cadillac",
};

export function TeamCar({ team, colour, width }: { team?: string | null; colour: string; width: number }) {
  const file = team ? FILES[team] : undefined;
  const title = `${team ?? "Team"} car`;
  if (!file) return <Car3D colour={colour} width={width} shadow={false} title={title} />;
  return <img src={`/cars/${file}.svg`} alt={title} width={width} height={Math.round((width * 1225) / 760)} draggable={false} style={{ display: "block" }} />;
}
