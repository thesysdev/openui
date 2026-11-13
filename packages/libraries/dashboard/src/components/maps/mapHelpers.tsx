"use client";
import { useEffect, useState } from "react";
// Through the old path on purpose: maps.browser.test.tsx mocks the loader there. #241 moves the
// import to ../../shared/atlas together with that mock, when it removes the shim.
import { loadShapes, retryShapes, type Shape } from "../../shared/atlas";
import { Empty } from "../shared/States";
/* ---------- Region matching ---------- */

export const normalize = (name: string) => name.toLowerCase().replace(/[^a-z]/g, "");

/** Common names and ISO codes → the names used by world-atlas. */
const COUNTRY_ALIASES: Record<string, string> = {
  us: "United States of America",
  usa: "United States of America",
  unitedstates: "United States of America",
  uk: "United Kingdom",
  gb: "United Kingdom",
  gbr: "United Kingdom",
  greatbritain: "United Kingdom",
  england: "United Kingdom",
  de: "Germany",
  deu: "Germany",
  fr: "France",
  fra: "France",
  ca: "Canada",
  can: "Canada",
  au: "Australia",
  aus: "Australia",
  in: "India",
  ind: "India",
  br: "Brazil",
  bra: "Brazil",
  jp: "Japan",
  jpn: "Japan",
  cn: "China",
  chn: "China",
  es: "Spain",
  esp: "Spain",
  it: "Italy",
  ita: "Italy",
  nl: "Netherlands",
  nld: "Netherlands",
  holland: "Netherlands",
  se: "Sweden",
  swe: "Sweden",
  no: "Norway",
  nor: "Norway",
  dk: "Denmark",
  dnk: "Denmark",
  fi: "Finland",
  fin: "Finland",
  ie: "Ireland",
  irl: "Ireland",
  pl: "Poland",
  pol: "Poland",
  pt: "Portugal",
  prt: "Portugal",
  ch: "Switzerland",
  che: "Switzerland",
  at: "Austria",
  aut: "Austria",
  be: "Belgium",
  bel: "Belgium",
  mx: "Mexico",
  mex: "Mexico",
  ar: "Argentina",
  arg: "Argentina",
  co: "Colombia",
  col: "Colombia",
  cl: "Chile",
  chl: "Chile",
  za: "South Africa",
  zaf: "South Africa",
  ng: "Nigeria",
  nga: "Nigeria",
  eg: "Egypt",
  egy: "Egypt",
  ke: "Kenya",
  ken: "Kenya",
  sg: "Singapore",
  sgp: "Singapore",
  id: "Indonesia",
  idn: "Indonesia",
  ph: "Philippines",
  phl: "Philippines",
  vn: "Vietnam",
  vnm: "Vietnam",
  th: "Thailand",
  tha: "Thailand",
  my: "Malaysia",
  mys: "Malaysia",
  kr: "South Korea",
  kor: "South Korea",
  korea: "South Korea",
  southkorea: "South Korea",
  tw: "Taiwan",
  twn: "Taiwan",
  il: "Israel",
  isr: "Israel",
  tr: "Turkey",
  tur: "Turkey",
  turkiye: "Turkey",
  ae: "United Arab Emirates",
  are: "United Arab Emirates",
  uae: "United Arab Emirates",
  sa: "Saudi Arabia",
  sau: "Saudi Arabia",
  ru: "Russia",
  rus: "Russia",
  russianfederation: "Russia",
  ua: "Ukraine",
  ukr: "Ukraine",
  nz: "New Zealand",
  nzl: "New Zealand",
  cz: "Czechia",
  cze: "Czechia",
  czechrepublic: "Czechia",
  ro: "Romania",
  rou: "Romania",
  hu: "Hungary",
  hun: "Hungary",
  gr: "Greece",
  grc: "Greece",
  pk: "Pakistan",
  pak: "Pakistan",
  bd: "Bangladesh",
  bgd: "Bangladesh",
  pe: "Peru",
  per: "Peru",
};

const US_STATES: Record<string, string> = {
  al: "Alabama",
  ak: "Alaska",
  az: "Arizona",
  ar: "Arkansas",
  ca: "California",
  co: "Colorado",
  ct: "Connecticut",
  de: "Delaware",
  dc: "District of Columbia",
  fl: "Florida",
  ga: "Georgia",
  hi: "Hawaii",
  id: "Idaho",
  il: "Illinois",
  in: "Indiana",
  ia: "Iowa",
  ks: "Kansas",
  ky: "Kentucky",
  la: "Louisiana",
  me: "Maine",
  md: "Maryland",
  ma: "Massachusetts",
  mi: "Michigan",
  mn: "Minnesota",
  ms: "Mississippi",
  mo: "Missouri",
  mt: "Montana",
  ne: "Nebraska",
  nv: "Nevada",
  nh: "New Hampshire",
  nj: "New Jersey",
  nm: "New Mexico",
  ny: "New York",
  nc: "North Carolina",
  nd: "North Dakota",
  oh: "Ohio",
  ok: "Oklahoma",
  or: "Oregon",
  pa: "Pennsylvania",
  ri: "Rhode Island",
  sc: "South Carolina",
  sd: "South Dakota",
  tn: "Tennessee",
  tx: "Texas",
  ut: "Utah",
  vt: "Vermont",
  va: "Virginia",
  wa: "Washington",
  wv: "West Virginia",
  wi: "Wisconsin",
  wy: "Wyoming",
};

export function shapeName(label: string, region: "world" | "us") {
  const key = normalize(label);
  if (region === "us") return US_STATES[key] ?? label;
  return COUNTRY_ALIASES[key] ?? label;
}

/** Readable name for the ranked list: "US" → "United States", "NY" → "New York". */
export function displayName(label: string, region: "world" | "us") {
  const name = shapeName(label, region);
  if (name === label) return label;
  return name === "United States of America" ? "United States" : name;
}

/* ---------- Shapes, loaded on first use ---------- */

/** The region's shapes; failed once the atlas couldn't load, so the card says so instead of loading forever. */
export function useShapes(region: "world" | "us") {
  const [shapes, setShapes] = useState<Shape[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    setFailed(false);
    loadShapes(region).then(
      (loaded) => live && setShapes(loaded),
      () => {
        retryShapes(region); // try again on the next mount
        if (live) setFailed(true);
      },
    );
    return () => {
      live = false;
    };
  }, [region]);
  return { shapes, failed };
}

export function MapFailed() {
  return (
    <Empty
      state="error"
      title="The map didn’t load"
      hint="The values are in the list."
      height={280}
    />
  );
}

export const WIDTH = 760;
