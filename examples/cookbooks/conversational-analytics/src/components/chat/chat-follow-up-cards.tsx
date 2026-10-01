"use client";

import type { CSSProperties, ReactNode } from "react";
import { Car3DGloss } from "../car-3d-gloss";
import { CircuitMap, CountryFlag, circuits, drivers, teamColour, teams, type Driver } from "../f1-assets";
import { TeamLogo } from "../f1-team-logos";
import { KerbArrow } from "./icons";
import "./chat.css";

/*
 * ChatFollowUpCards: follow-ups as picture tiles instead of a list. Each tile is
 * about one thing (a driver, a head-to-head, a team, a circuit or a lap) and is
 * painted from it: the team colour, the driver's portrait, the car, the track.
 * Flat, one bevelled corner, no borders. The only hover is the bevel closing up so
 * the card squares off (see chat.css); nothing moves or resizes. ChatFollowUps is
 * the plain list version, for follow-ups with no subject to picture.
 */

export type FollowUpCard = { text: string } & (
  | { kind: "driver"; driver: string }
  | { kind: "compare"; drivers: [string, string] }
  | { kind: "team"; team: string }
  | { kind: "circuit"; circuit: string }
  | { kind: "lap"; lap: number; label?: string }
);

export type ChatFollowUpCardsProps = {
  items: FollowUpCard[];
  label?: string | null;
  onPick?: (text: string) => void;
};

const CARBON = "#15151E";
const WARM = "#F7F4F1";
const RED = "#E10600";
// Car3DGloss is drawn top-down and upright at 760 × 1225; at this width it's 168 tall.
const CAR_W = 104;

const fold = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const findDriver = (ref: string) => {
  const q = fold(ref);
  return drivers.find((d) => fold(d.acronym) === q || String(d.number) === q || fold(d.lastName) === q);
};
const findTeam = (ref: string) => {
  const q = fold(ref);
  return teams.find((t) => fold(t.name) === q) ?? teams.find((t) => q.length > 2 && fold(t.name).includes(q));
};
const findCircuit = (ref: string) => {
  const q = fold(ref);
  return circuits.find((c) => [c.location, c.grandPrix.replace(/ Grand Prix$/, ""), c.name, c.id].some((f) => fold(f) === q));
};

// The 2026 cut-out portrait (head and shoulders on transparent), hotlinked from formula1.com
// the same way DriverAvatar does it.
function portraitUrl(d: Driver) {
  const code = d.headshotUrl?.match(/\/drivers\/\w\/([A-Z0-9]+)_/)?.[1]?.toLowerCase();
  if (!code) return undefined;
  const team = d.team.toLowerCase().replace(/[^a-z0-9]/g, "");
  return (
    "https://media.formula1.com/image/upload/f_auto/c_thumb,g_face,z_0.6,w_400,h_400/" +
    `v1740000001/common/f1/2026/${team}/${code}/2026${team}${code}right.webp`
  );
}

// A portrait standing on the band's floor: shoulders on the bottom edge, head up.
function Portrait({ driver }: { driver: Driver }) {
  const src = portraitUrl(driver);
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="f1c-card__portrait" src={src} alt="" />
  ) : null;
}

// White or carbon, whichever reads better on the colour.
function inkOn(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const l = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return 1.05 / (l + 0.05) >= (l + 0.05) / 0.058 ? "#FFFFFF" : CARBON;
}

// art sits in the picture band and is clipped to it. backdrop sits behind the whole card and
// fades out under the words, for pictures that need more room than the band.
type Look = { bg: string; ink: string; tag: ReactNode; art: ReactNode; backdrop?: ReactNode };

function look(card: FollowUpCard): Look {
  switch (card.kind) {
    case "driver": {
      const d = findDriver(card.driver);
      const bg = d?.teamColour ?? CARBON;
      return {
        bg,
        ink: inkOn(bg),
        tag: d ? `${d.lastName} · ${d.number}` : card.driver,
        art: d && (
          <>
            {/* The car number, big and faded behind the portrait. */}
            <span className="f1c-card__art f1c-card__art--number f1c-num">{d.number}</span>
            <span className="f1c-card__art f1c-card__art--portrait">
              <Portrait driver={d} />
            </span>
          </>
        ),
      };
    }
    case "compare": {
      const [a, b] = card.drivers.map(findDriver);
      const ca = a?.teamColour ?? CARBON;
      const cb = b?.teamColour ?? RED;
      return {
        // Split hard on the slant, one team colour each side.
        bg: `linear-gradient(100deg, ${ca} 0 50%, ${cb} 50% 100%)`,
        ink: inkOn(ca),
        tag: `${a?.acronym ?? card.drivers[0]} vs ${b?.acronym ?? card.drivers[1]}`,
        art: (
          <span className="f1c-card__art f1c-card__art--pair">
            <span>{a && <Portrait driver={a} />}</span>
            <span>{b && <Portrait driver={b} />}</span>
          </span>
        ),
      };
    }
    case "team": {
      const t = findTeam(card.team);
      const colour = t ? teamColour(t.name) : RED;
      return {
        bg: CARBON,
        ink: "#FFFFFF",
        tag: (
          <>
            {t && <TeamLogo team={t.name} size={20} variant="white" />}
            {t?.name ?? card.team}
          </>
        ),
        art: null,
        // The glossy car, top down and upright, running down behind the words and fading out.
        backdrop: (
          <span className="f1c-card__backdrop f1c-card__backdrop--car" aria-hidden>
            <Car3DGloss colour={colour} carbon="#2C323A" width={CAR_W} shadow={false} title="" />
          </span>
        ),
      };
    }
    case "circuit": {
      const c = findCircuit(card.circuit);
      return {
        bg: WARM,
        ink: CARBON,
        tag: (
          <>
            {c && <CountryFlag code={c.countryCode} size={14} />}
            {c?.location ?? card.circuit}
          </>
        ),
        art: null,
        // The track runs from the band down behind the words, fading out under them.
        backdrop: c && (
          <span className="f1c-card__backdrop f1c-card__backdrop--track" aria-hidden>
            <CircuitMap id={c.id} size={136} strokeWidth={34} />
          </span>
        ),
      };
    }
    case "lap":
      return {
        bg: RED,
        ink: "#FFFFFF",
        tag: card.label ?? "Lap",
        art: (
          <span className="f1c-card__art f1c-card__art--lap f1c-num" aria-hidden>
            {card.lap}
          </span>
        ),
      };
  }
}

export function ChatFollowUpCards({ items, label = "Next lap", onPick }: ChatFollowUpCardsProps) {
  if (!items.length) return null;
  return (
    <div className="f1c f1c-cards">
      {label && <span className="f1c-label">{label}</span>}
      <div className="f1c-cards__grid">
        {items.map((card) => {
          const { bg, ink, tag, art, backdrop } = look(card);
          return (
            <button
              key={card.text}
              type="button"
              className="f1c-card"
              data-kind={card.kind}
              // Only cards you can pick get the hover; Spotlight's display tiles don't.
              data-pick={onPick ? true : undefined}
              style={{ "--card-bg": bg, "--card-ink": ink } as CSSProperties}
              onClick={() => onPick?.(card.text)}
            >
              {backdrop}
              {/* Picture band on top, words underneath: the two never share space. */}
              <span className="f1c-card__band" aria-hidden>
                {art}
              </span>
              <span className="f1c-card__body">
                <span className="f1c-card__tag">{tag}</span>
                <span className="f1c-card__text">
                  {card.text}
                  <span className="f1c-card__go">
                    <KerbArrow direction="right" size={11} />
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
