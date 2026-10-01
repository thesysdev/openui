// Component gallery previews for the F1 asset components, using the snapshot data.
import {
  CarSilhouette,
  CircuitMap,
  CountryFlag,
  DriverAvatar,
  Helmet,
  TeamChip,
  circuits,
  drivers,
  teamColour,
  teams,
} from "./f1-assets";
import { TeamLogo } from "./f1-team-logos";

const Usage = ({ code, source }: { code: string; source: string }) => (
  <p className="ref-note">
    <code>{code}</code> · {source}
  </p>
);

export function TeamChipPreview() {
  return (
    <div className="ref">
      <section className="ref-group">
        <h3>All teams</h3>
        <div className="asset-grid asset-grid-wide">
          {teams.map((t) => (
            <TeamChip key={t.name} team={t.name} size={24} />
          ))}
        </div>
      </section>
      <section className="ref-group">
        <h3>Sizes</h3>
        <div className="asset-row">
          {[16, 24, 40].map((size) => (
            <TeamChip key={size} team="McLaren" size={size} />
          ))}
        </div>
      </section>
      <Usage code={'<TeamChip team="McLaren" size={24} />'} source="Names and colours from OpenF1." />
    </div>
  );
}

export function DriverAvatarPreview() {
  return (
    <div className="ref">
      <section className="ref-group">
        <h3>2026 grid</h3>
        <div className="asset-grid">
          {drivers.map((d) => (
            <div key={d.number} className="asset-tile">
              <DriverAvatar number={d.number} size={88} />
              <strong>{d.fullName}</strong>
              <TeamChip team={d.team} size={14} />
            </div>
          ))}
        </div>
      </section>
      <section className="ref-group">
        <h3>With headshots</h3>
        <div className="asset-grid">
          {drivers.map((d) => (
            <div key={d.number} className="asset-tile">
              <DriverAvatar number={d.number} size={120} showHeadshot />
              <strong>{d.fullName}</strong>
              <TeamChip team={d.team} size={14} />
            </div>
          ))}
        </div>
      </section>
      <section className="ref-group">
        <h3>Sizes</h3>
        <div className="asset-row">
          {[160, 96, 56, 32].map((size) => (
            <DriverAvatar key={size} number={81} size={size} />
          ))}
          {[160, 96, 56].map((size) => (
            <DriverAvatar key={`h${size}`} number={81} size={size} showHeadshot />
          ))}
        </div>
      </section>
      <Usage
        code="<DriverAvatar number={81} size={96} showHeadshot />"
        source="Numbers, acronyms and team colours from OpenF1. Add showHeadshot for the 2026 formula1.com portrait, face-cropped to 400px (hotlinked, F1-owned)."
      />
    </div>
  );
}

export function CircuitMapPreview() {
  const miami = circuits.find((c) => c.id === "us-2022")!;
  return (
    <div className="ref">
      <section className="ref-group">
        <h3>Miami</h3>
        <div className="asset-row">
          <CircuitMap id="us-2022" size={360} />
          <div className="asset-caption">
            <CountryFlag code={miami.countryCode} size={28} />
            <strong>{miami.name}</strong>
            <span>
              Round {miami.round} · {(miami.lengthMeters / 1000).toFixed(3)} km
            </span>
          </div>
        </div>
      </section>
      <section className="ref-group">
        <h3>2026 calendar</h3>
        <p className="ref-note">
          {circuits.filter((c) => c.status === "scheduled").length} rounds, from OpenF1 meetings. Bahrain and Saudi
          Arabia were cancelled in April; the Bahrain Grand Prix runs at Sepang, Malaysia instead.
        </p>
        <div className="asset-grid">
          {circuits.map((c) => {
            const cancelled = c.status === "cancelled";
            return (
              <div key={c.id + c.dateStart} className="asset-tile" style={cancelled ? { opacity: 0.4 } : undefined}>
                <CircuitMap id={c.id} size={150} strokeWidth={32} showStart={!cancelled} />
                <span className="asset-round">
                  {cancelled ? "CANCELLED" : `R${String(c.round).padStart(2, "0")}`} · {c.dateStart.slice(5)}
                </span>
                <span className="asset-inline">
                  <CountryFlag code={c.countryCode} size={16} />
                  <strong style={cancelled ? { textDecoration: "line-through" } : undefined}>{c.location}</strong>
                </span>
                <span className="ref-note">{c.grandPrix}</span>
              </div>
            );
          })}
        </div>
      </section>
      <Usage code={'<CircuitMap id="us-2022" size={240} colour="#15151E" />'} source="Outlines from bacinger/f1-circuits (MIT)." />
    </div>
  );
}

export function CountryFlagPreview() {
  const codes = [...new Set(circuits.filter((c) => c.status === "scheduled").map((c) => c.countryCode))];
  return (
    <div className="ref">
      <section className="ref-group">
        <h3>Calendar countries</h3>
        <div className="asset-grid asset-grid-wide">
          {codes.map((code) => (
            <span key={code} className="asset-inline">
              <CountryFlag code={code} size={24} />
              <code>{code.toUpperCase()}</code>
            </span>
          ))}
        </div>
      </section>
      <section className="ref-group">
        <h3>Sizes and square</h3>
        <div className="asset-row">
          {[48, 32, 20].map((size) => (
            <CountryFlag key={size} code="us" size={size} />
          ))}
          {[48, 32, 20].map((size) => (
            <CountryFlag key={`sq${size}`} code="us" size={size} square />
          ))}
        </div>
      </section>
      <Usage code={'<CountryFlag code="us" size={32} square />'} source="flag-icons by lipis (MIT)." />
    </div>
  );
}

export function CarSilhouettePreview() {
  return (
    <div className="ref">
      <section className="ref-group">
        <h3>Side view</h3>
        <div className="asset-grid asset-grid-cars">
          {teams.map((t) => (
            <div key={t.name} className="asset-tile">
              <CarSilhouette colour={t.colour} width={260} />
              <TeamChip team={t.name} size={18} />
            </div>
          ))}
        </div>
      </section>
      <section className="ref-group">
        <h3>Top view</h3>
        <div className="asset-row" style={{ marginBottom: 32 }}>
          <CarSilhouette view="top" colour={teamColour("McLaren")} width={200} />
          <CarSilhouette view="top" colour={teamColour("Ferrari")} width={200} />
          <CarSilhouette view="top" colour={teamColour("Mercedes")} width={200} />
        </div>
        <div className="asset-grid">
          {teams.map((t) => (
            <div key={t.name} className="asset-tile">
              <CarSilhouette view="top" colour={t.colour} width={90} />
              <TeamChip team={t.name} size={16} />
            </div>
          ))}
        </div>
      </section>
      <Usage
        code={'<CarSilhouette colour="#F47600" width={320} view="side" />'}
        source='Side: "F1 car" by Skoll, game-icons.net (CC BY 3.0). Top: "2D Race Cars" by looneybits, OpenGameArt (CC0).'
      />
    </div>
  );
}

export function TeamLogoPreview() {
  return (
    <div className="ref">
      <section className="ref-group">
        <h3>Colour</h3>
        <div className="asset-grid">
          {teams.map((t) => (
            <div key={t.name} className="asset-tile">
              <TeamLogo team={t.name} size={80} />
              <TeamChip team={t.name} size={16} />
            </div>
          ))}
        </div>
      </section>
      <section className="ref-group">
        <h3>White, on team colour</h3>
        <div className="asset-grid">
          {teams.map((t) => (
            <div key={t.name} className="asset-logo-tile" style={{ background: t.colour }}>
              <TeamLogo team={t.name} size={64} variant="white" />
            </div>
          ))}
        </div>
      </section>
      <section className="ref-group">
        <h3>Black</h3>
        <div className="asset-row">
          {teams.map((t) => (
            <TeamLogo key={t.name} team={t.name} size={40} variant="black" />
          ))}
        </div>
      </section>
      <Usage
        code={'<TeamLogo team="McLaren" size={48} variant="colour" />'}
        source="Team trademarks, hotlinked from formula1.com's media CDN (not stored in the repo). Kept separate from TeamChip."
      />
    </div>
  );
}

export function HelmetPreview() {
  return (
    <div className="ref">
      <section className="ref-group">
        <h3>Team tints</h3>
        <div className="asset-grid">
          {teams.map((t) => (
            <div key={t.name} className="asset-tile">
              <Helmet colour={t.colour} size={120} title={`${t.name} helmet`} />
              <TeamChip team={t.name} size={16} />
            </div>
          ))}
        </div>
      </section>
      <section className="ref-group">
        <h3>Sizes</h3>
        <div className="asset-row">
          {[200, 120, 64, 32].map((size) => (
            <Helmet key={size} colour={teamColour("McLaren")} size={size} />
          ))}
        </div>
      </section>
      <Usage
        code={'<Helmet colour="#F47600" size={96} />'}
        source='"Full motorcycle helmet" by Delapouite, game-icons.net (CC BY 3.0). Mirrored to face right.'
      />
    </div>
  );
}
