// Team logos, kept apart from the openly licensed assets in f1-assets.tsx.
// Logos are trademarks of their teams. They are hotlinked from formula1.com's media CDN
// (the same files formula1.com/en/teams uses) and never stored in this repo.

const LOGO_BASE = "https://media.formula1.com/image/upload/v1740000001/common/f1/2026";

export type LogoVariant = "colour" | "white" | "black";

// "Red Bull Racing" → "redbullracing", matching formula1.com's asset paths.
const slug = (team: string) => team.toLowerCase().replace(/[^a-z0-9]/g, "");

export const teamLogoUrl = (team: string, variant: LogoVariant = "colour") => {
  const s = slug(team);
  const suffix = variant === "colour" ? "logo" : `logo${variant}`;
  return `${LOGO_BASE}/${s}/2026${s}${suffix}.svg`;
};

export function TeamLogo({
  team,
  size = 48,
  variant = "colour",
}: {
  team: string;
  size?: number;
  variant?: LogoVariant;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={teamLogoUrl(team, variant)}
      alt={`${team} logo`}
      width={size}
      height={size}
      style={{ objectFit: "contain", flexShrink: 0 }}
    />
  );
}
