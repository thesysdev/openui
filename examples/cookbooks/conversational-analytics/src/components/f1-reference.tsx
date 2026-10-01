// Reference values taken from formula1.com's live CSS. See f1-reference.md at the app root.
// These are plain values to look at and pick from, not tokens.

type Swatch = { name: string; hex: string; note?: string };

const colorGroups: { title: string; swatches: Swatch[] }[] = [
  {
    title: "Brand",
    swatches: [
      { name: "Hot Red", hex: "#E10600", note: "Primary buttons, logo" },
      { name: "Carbon Black", hex: "#15151E", note: "Dark surfaces, text" },
      { name: "Warm White", hex: "#F7F4F1", note: "Light page background" },
      { name: "Shift Green", hex: "#71CC98" },
      { name: "Spark Yellow", hex: "#E6F854" },
      { name: "Bright Blue 50", hex: "#0076CC", note: "Links" },
      { name: "Bright Blue 60", hex: "#0463A9", note: "Link hover" },
    ],
  },
  {
    title: "Neutrals",
    swatches: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Surface 2", hex: "#F3F3F4" },
      { name: "Warm White", hex: "#F7F4F1" },
      { name: "Surface 4", hex: "#E0DEDC" },
      { name: "Surface 5", hex: "#CDCDCD" },
      { name: "Surface 6", hex: "#AAAAAA" },
      { name: "Surface 7", hex: "#606066", note: "Muted text on light" },
      { name: "Surface 8", hex: "#47464C" },
      { name: "Surface 9", hex: "#303037", note: "Card on dark" },
      { name: "Dark hover", hex: "#26262B" },
      { name: "Body text", hex: "#1C1C25" },
      { name: "Carbon Black", hex: "#15151E" },
      { name: "Black", hex: "#000000" },
    ],
  },
  {
    title: "System",
    swatches: [
      { name: "Positive", hex: "#1A8930" },
      { name: "Negative", hex: "#E91711" },
      { name: "Error", hex: "#E66700" },
      { name: "Warning", hex: "#FFD100" },
      { name: "Hot Red 20", hex: "#F6B4B2" },
      { name: "Sector Purple", hex: "#5300A6", note: "Fastest overall" },
    ],
  },
  {
    title: "Teams (2026)",
    swatches: [
      { name: "Mercedes", hex: "#27F4D2" },
      { name: "Ferrari", hex: "#E8002D" },
      { name: "McLaren", hex: "#FF8000" },
      { name: "Red Bull Racing", hex: "#3671C6" },
      { name: "Aston Martin", hex: "#229971" },
      { name: "Alpine", hex: "#00A1E8" },
      { name: "Williams", hex: "#1868DB" },
      { name: "Racing Bulls", hex: "#6692FF" },
      { name: "Haas F1 Team", hex: "#DEE1E2" },
      { name: "Audi", hex: "#FF2D00" },
      { name: "Cadillac", hex: "#AAAAAD" },
    ],
  },
];

const TITILLIUM = '"Titillium Web", sans-serif';
const SAIRA = '"Saira", sans-serif';

// Two fonts only. Saira is variable (wght 100–900, wdth 50–125), so display, wide and
// timing styles come from its axes; Titillium Web covers body text through weights.
// Sizes are measured on formula1.com.
const typeScale: {
  role: string;
  family: string;
  fontFamily: string;
  size: number;
  lineHeight: number;
  weight: number;
  width?: number;
  uppercase?: boolean;
  italic?: boolean;
  tabular?: boolean;
  sample: string;
}[] = [
  { role: "Display", family: "Saira", fontFamily: SAIRA, size: 40, lineHeight: 44, weight: 900, width: 100, sample: "Miami Grand Prix" },
  { role: "Page title (H1)", family: "Saira", fontFamily: SAIRA, size: 32, lineHeight: 38, weight: 900, width: 100, uppercase: true, sample: "Driver standings" },
  { role: "Section title (H2)", family: "Saira", fontFamily: SAIRA, size: 24, lineHeight: 28, weight: 800, width: 100, uppercase: true, sample: "Latest news" },
  { role: "Wide display", family: "Saira", fontFamily: SAIRA, size: 24, lineHeight: 32, weight: 600, width: 125, uppercase: true, sample: "Formula 1" },
  { role: "Hero italic", family: "Saira", fontFamily: SAIRA, size: 40, lineHeight: 44, weight: 900, width: 112, uppercase: true, italic: true, sample: "Lights out" },
  { role: "Card title", family: "Saira", fontFamily: SAIRA, size: 20, lineHeight: 24, weight: 500, width: 100, sample: "Norris takes maiden win" },
  { role: "Label", family: "Saira", fontFamily: SAIRA, size: 16, lineHeight: 22, weight: 600, width: 110, uppercase: true, sample: "Race results" },
  { role: "Timing number", family: "Saira", fontFamily: SAIRA, size: 28, lineHeight: 28, weight: 700, width: 87, tabular: true, sample: "1:30.634" },
  { role: "Caption", family: "Saira", fontFamily: SAIRA, size: 12, lineHeight: 16, weight: 400, width: 100, sample: "Updated 2 hours ago" },
  { role: "Article body", family: "Titillium Web", fontFamily: TITILLIUM, size: 17, lineHeight: 28, weight: 400, sample: "Lando Norris held off Max Verstappen to win in Miami." },
  { role: "UI body", family: "Titillium Web", fontFamily: TITILLIUM, size: 16, lineHeight: 24, weight: 600, sample: "Lap 57 of 57" },
  { role: "Nav / table head", family: "Titillium Web", fontFamily: TITILLIUM, size: 14, lineHeight: 16, weight: 700, uppercase: true, sample: "Pos. Driver Team Pts." },
];

const typefaces = [
  { family: "Titillium Web", use: "Body copy, nav, tables, UI (the font F1 itself uses). Weights 200–900.", fontFamily: TITILLIUM },
  { family: "Saira (variable)", use: "Headlines, wide display, labels, timing. Weight 100–900, width 50–125.", fontFamily: SAIRA },
];

const variation = (style: (typeof typeScale)[number]) =>
  style.width ? `"wght" ${style.weight}, "wdth" ${style.width}` : undefined;

export function ReferenceColors() {
  return (
    <div className="ref">
      {colorGroups.map((group) => (
        <section key={group.title} className="ref-group">
          <h3>{group.title}</h3>
          <div className="ref-swatches">
            {group.swatches.map((swatch) => (
              <div key={group.title + swatch.name} className="ref-swatch">
                <div className="ref-swatch-chip" style={{ background: swatch.hex }} />
                <strong>{swatch.name}</strong>
                <code>{swatch.hex}</code>
                {swatch.note && <span>{swatch.note}</span>}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function ReferenceTypography() {
  return (
    <div className="ref">
      <section className="ref-group">
        <h3>Typefaces</h3>
        <table className="ref-table">
          <thead>
            <tr>
              <th>Family</th>
              <th>Used for</th>
              <th>Sample</th>
              <th>License</th>
            </tr>
          </thead>
          <tbody>
            {typefaces.map((face) => (
              <tr key={face.family}>
                <td>{face.family}</td>
                <td>{face.use}</td>
                <td style={{ fontFamily: face.fontFamily, fontSize: 22, fontWeight: 700 }}>OpenUI x F1 1:30.634</td>
                <td>SIL OFL 1.1</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="ref-group">
        <h3>Type scale</h3>
        <p className="ref-note">
          Sizes measured on formula1.com. Saira styles use font-variation-settings for weight and width.
        </p>
        {typeScale.map((style) => (
          <div key={style.role} className="ref-type-row">
            <div className="ref-type-meta">
              <strong>{style.role}</strong>
              <code>
                {style.family} · {style.size}/{style.lineHeight}px · wght {style.weight}
                {style.width ? ` · wdth ${style.width}` : ""}
                {style.uppercase ? " · uppercase" : ""}
                {style.italic ? " · italic" : ""}
                {style.tabular ? " · tabular-nums" : ""}
              </code>
            </div>
            <div
              style={{
                fontFamily: style.fontFamily,
                fontSize: style.size,
                lineHeight: `${style.lineHeight}px`,
                fontWeight: style.weight,
                fontVariationSettings: variation(style),
                fontStyle: style.italic ? "italic" : "normal",
                fontVariantNumeric: style.tabular ? "tabular-nums" : undefined,
                textTransform: style.uppercase ? "uppercase" : "none",
              }}
            >
              {style.sample}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
