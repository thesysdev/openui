import { openf1, type FetchOptions } from "./openf1";

// Turns the words people use ("latest", "next", "Baku", "Monaco qualifying", "2026-miami-R",
// "LEC", "Leclerc") into OpenF1 session keys and driver numbers.

export const CURRENT_YEAR = 2026;
/** A session counts as final (cached forever) this long after it ends. */
const SETTLE_MS = 3 * 3600_000;

export type SessionType =
  | "Race"
  | "Qualifying"
  | "Sprint"
  | "Sprint Qualifying"
  | "Practice 1"
  | "Practice 2"
  | "Practice 3";

type RawSession = {
  session_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
  meeting_key: number;
  circuit_short_name: string;
  country_name: string;
  country_code: string;
  location: string;
  year: number;
  is_cancelled?: boolean;
};
type RawMeeting = {
  meeting_key: number;
  meeting_name: string;
  meeting_official_name?: string;
  location: string;
  country_name: string;
  country_code: string;
  circuit_short_name: string;
  date_start: string;
  date_end: string;
  year: number;
  is_cancelled?: boolean;
};

export interface Meeting {
  key: number;
  name: string;
  round: number | null;
  location: string;
  country: string;
  countryCode: string;
  circuit: string;
  dateStart: string;
  dateEnd: string;
  year: number;
  cancelled: boolean;
  testing: boolean;
  sessions: Session[];
}

export interface Session {
  key: number;
  name: string;
  type: string;
  year: number;
  meetingKey: number;
  meetingName: string;
  round: number | null;
  circuit: string;
  location: string;
  country: string;
  dateStart: string;
  dateEnd: string;
  cancelled: boolean;
  /** Finished and settled: its data will not change. */
  final: boolean;
  /** Finished (may still be settling). */
  finished: boolean;
}

export function sessionLabel(s: Session) {
  return `${s.year} ${s.meetingName} · ${s.name}`;
}

/** Fetch options for a session's data: final sessions are cached forever, live ones briefly. */
export function cacheFor(s: Session, signal?: AbortSignal): FetchOptions {
  return s.final ? { final: true, signal } : { ttl: 20, signal };
}

const seasonCache = new Map<number, { at: number; meetings: Meeting[] }>();

export async function season(year = CURRENT_YEAR, signal?: AbortSignal): Promise<Meeting[]> {
  const hit = seasonCache.get(year);
  if (hit && Date.now() - hit.at < 5 * 60_000) return hit.meetings;
  const past = year < CURRENT_YEAR;
  const opts: FetchOptions = past ? { final: true, signal } : { ttl: 6 * 3600, signal };
  const [rawMeetings, rawSessions] = await Promise.all([
    openf1<RawMeeting>("meetings", { year }, opts),
    openf1<RawSession>("sessions", { year }, opts),
  ]);
  const now = Date.now();
  const meetings = rawMeetings
    .map(
      (m): Meeting => ({
        key: m.meeting_key,
        name: m.meeting_name,
        round: null,
        location: m.location,
        country: m.country_name,
        countryCode: m.country_code,
        circuit: m.circuit_short_name,
        dateStart: m.date_start,
        dateEnd: m.date_end,
        year: m.year,
        cancelled: !!m.is_cancelled,
        testing: /test/i.test(m.meeting_name),
        sessions: [],
      }),
    )
    .sort((a, b) => a.dateStart.localeCompare(b.dateStart));
  let round = 0;
  for (const m of meetings) if (!m.testing && !m.cancelled) m.round = ++round;
  const byKey = new Map(meetings.map((m) => [m.key, m]));
  for (const s of rawSessions.sort((a, b) => a.date_start.localeCompare(b.date_start))) {
    const m = byKey.get(s.meeting_key);
    if (!m) continue;
    const end = Date.parse(s.date_end);
    if (s.is_cancelled) m.cancelled = m.cancelled || m.sessions.every((x) => x.cancelled);
    m.sessions.push({
      key: s.session_key,
      name: s.session_name,
      type: s.session_type,
      year: s.year,
      meetingKey: m.key,
      meetingName: m.name,
      round: m.round,
      circuit: s.circuit_short_name,
      location: s.location,
      country: s.country_name,
      dateStart: s.date_start,
      dateEnd: s.date_end,
      cancelled: !!s.is_cancelled,
      finished: end < now,
      final: end + SETTLE_MS < now,
    });
  }
  // Rounds were numbered before cancellations were known from sessions; renumber.
  round = 0;
  for (const m of meetings) {
    m.cancelled = m.cancelled || (m.sessions.length > 0 && m.sessions.every((s) => s.cancelled));
    m.round = !m.testing && !m.cancelled ? ++round : null;
    for (const s of m.sessions) s.round = m.round;
  }
  seasonCache.set(year, { at: Date.now(), meetings });
  return meetings;
}

export async function allSessions(year = CURRENT_YEAR, signal?: AbortSignal) {
  return (await season(year, signal)).flatMap((m) => m.sessions);
}

// Place aliases for names that don't appear in OpenF1's meeting, location or circuit fields.
const ALIASES: Record<string, string[]> = {
  "monte carlo": ["monaco"],
  catalunya: ["barcelona", "montmelo"],
  madring: ["madrid"],
  spielberg: ["austria", "austrian", "red bull ring"],
  silverstone: ["britain", "british", "uk", "england"],
  "spa-francorchamps": ["spa", "belgium", "belgian"],
  hungaroring: ["hungary", "hungarian", "budapest"],
  zandvoort: ["netherlands", "dutch", "holland"],
  monza: ["italy", "italian"],
  imola: ["emilia", "romagna"],
  baku: ["azerbaijan"],
  montreal: ["canada", "canadian"],
  suzuka: ["japan", "japanese"],
  shanghai: ["china", "chinese"],
  melbourne: ["australia", "australian", "albert park"],
  austin: ["usa", "cota", "us gp", "americas"],
  "mexico city": ["mexico", "mexican"],
  interlagos: ["brazil", "brazilian", "sao paulo", "são paulo"],
  "las vegas": ["vegas"],
  lusail: ["qatar"],
  "yas marina circuit": ["abu dhabi", "yas marina", "yas"],
  jeddah: ["saudi", "saudi arabia"],
  sakhir: ["bahrain"],
  "kuala lumpur": ["malaysia", "malaysian", "sepang"],
  singapore: ["marina bay"],
  miami: ["florida"],
};

const TYPE_WORDS: Array<[RegExp, SessionType]> = [
  [/\b(sq|sprint[ -]?(quali\w*|shootout))\b/, "Sprint Qualifying"],
  [/\b(fp1|p1|practice ?1|first practice)\b/, "Practice 1"],
  [/\b(fp2|p2|practice ?2|second practice)\b/, "Practice 2"],
  [/\b(fp3|p3|practice ?3|third practice)\b/, "Practice 3"],
  [/\b(s|sprint)\b/, "Sprint"],
  [/\b(q|quali\w*|pole)\b/, "Qualifying"],
  [/\b(r|race|gp|grand prix)\b/, "Race"],
];

export interface ResolvedSession {
  session: Session;
  /** Set when the reference was interpreted loosely, e.g. fell back to last season. */
  note?: string;
}

/**
 * Resolve a session reference. Accepts "latest" / "last", "next", a session key, a round
 * ("round 5"), a slug like "2026-miami-R", or a place ("Baku", "Monaco qualifying", "2025 Spa").
 * The type defaults to `defaultType` (Race) unless the text names another.
 */
export async function resolveSession(
  ref: string | number | undefined,
  options: { defaultType?: SessionType; needFinished?: boolean; signal?: AbortSignal } = {},
): Promise<ResolvedSession> {
  const { defaultType = "Race", needFinished = true, signal } = options;
  const raw = String(ref ?? "latest").trim();
  const text = ` ${raw.toLowerCase().replace(/[-_/,]+/g, " ")} `;

  if (/^\d{4,6}$/.test(raw) && Number(raw) > 3000) {
    const key = Number(raw);
    for (const year of [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2]) {
      const found = (await allSessions(year, signal)).find((s) => s.key === key);
      if (found) return { session: found };
    }
    throw new RangeError(`No session with key ${key}.`);
  }

  const yearMatch = /\b(20[12]\d)\b/.exec(text);
  const year = yearMatch ? Number(yearMatch[1]) : CURRENT_YEAR;
  let rest = yearMatch ? text.replace(yearMatch[0], " ") : text;
  let type: SessionType | undefined;
  for (const [re, t] of TYPE_WORDS) {
    if (re.test(rest)) {
      type = t;
      rest = rest.replace(re, " ");
      break;
    }
  }
  const wanted = type ?? defaultType;
  const now = Date.now();
  const ofType = (sessions: Session[]) =>
    sessions.filter((s) => s.name === wanted && !s.cancelled);

  const relative = /\b(latest|last|previous|most recent|recent|current|this)\b/.test(rest)
    ? "latest"
    : /\b(next|upcoming|coming)\b/.test(rest)
      ? "next"
      : null;
  rest = rest
    .replace(
      /\b(latest|last|previous|most recent|recent|current|this|next|upcoming|coming|weekend|session|the|of|in|at|round)\b/g,
      " ",
    )
    .trim();

  const roundMatch = /^(?:r)?(\d{1,2})$/.exec(rest);
  const sessions = await allSessions(year, signal);

  if (roundMatch) {
    const round = Number(roundMatch[1]);
    const s = ofType(sessions).find((x) => x.round === round);
    if (!s) throw new RangeError(`No ${wanted} in round ${round} of ${year}.`);
    return { session: s };
  }

  if (!rest || relative) {
    if (relative === "next") {
      const s = ofType(sessions).find((x) => Date.parse(x.dateStart) > now);
      if (!s) throw new RangeError(`No upcoming ${wanted} in ${year}.`);
      if (needFinished)
        throw new RangeError(`The next ${wanted} is ${sessionLabel(s)} on ${s.dateStart.slice(0, 16).replace("T", " ")} UTC; there is no data for it yet. Use get_schedule for upcoming events.`);
      return { session: s };
    }
    // "latest": the most recent finished one (the season default when nothing is named).
    const done = ofType(sessions).filter((x) => x.finished);
    let s = done.at(-1);
    if (!s && !yearMatch) s = ofType(await allSessions(year - 1, signal)).filter((x) => x.finished).at(-1);
    if (!s) throw new RangeError(`No finished ${wanted} yet in ${year}.`);
    return { session: s };
  }

  const words = rest.split(/\s+/).filter(Boolean);
  // Meeting name beats place names, which beat the country ("United States" is three races).
  const phrase = fold(words.join(" "));
  const score = (s: Session) => {
    const tiers: Array<[number, string]> = [
      [12, s.meetingName],
      [10, [s.location, s.circuit, ...(ALIASES[s.circuit.toLowerCase()] ?? [])].join(" | ")],
      [6, s.country],
    ];
    // Whole words only: "spa" must not match "Spanish".
    const has = (text: string, word: string) =>
      new RegExp(`(^|[^a-z])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z])`).test(fold(text));
    for (const [points, text] of tiers) if (has(text, phrase)) return points;
    const hay = tiers.map(([, text]) => text).join(" | ");
    return words.filter((w) => w.length > 2 && has(hay, fold(w))).length;
  };
  const pick = (list: Session[]) => {
    const scored = ofType(list)
      .map((s) => ({ s, n: score(s) }))
      .filter((x) => x.n > 0)
      // Ties (e.g. a country with two races) go to the most recent finished one.
      .sort((a, b) => b.n - a.n || Number(b.s.finished) - Number(a.s.finished) || b.s.dateStart.localeCompare(a.s.dateStart));
    return scored[0]?.s;
  };
  let s = pick(sessions);
  let note: string | undefined;
  // A place named without a year that has no data this season falls back to last season's
  // race, with a note the prompt tells the model to pass on, rather than an error.
  if (s && needFinished && !s.finished && !yearMatch) {
    const prev = pick(await allSessions(year - 1, signal));
    if (prev) {
      note = `The ${year} ${s.meetingName} ${wanted} has not happened yet (${s.dateStart.slice(0, 10)}), so this is ${year - 1}.`;
      s = prev;
    }
  }
  if (!s && !yearMatch) {
    s = pick(await allSessions(year - 1, signal));
    if (s) note = `No ${year} ${wanted} matched "${raw}", so this is ${year - 1}.`;
  }
  if (!s) throw new RangeError(`No ${wanted} matched "${raw}" in ${year}.`);
  if (needFinished && !s.finished)
    throw new RangeError(`${sessionLabel(s)} starts ${s.dateStart.slice(0, 16).replace("T", " ")} UTC; there is no data yet.`);
  return { session: s, note };
}

// ── Drivers ──────────────────────────────────────────────────────────────

export interface Driver {
  number: number;
  code: string;
  name: string;
  firstName: string;
  lastName: string;
  team: string;
  teamColour: string;
}

type RawDriver = {
  driver_number: number;
  name_acronym: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  broadcast_name?: string;
  team_name: string | null;
  team_colour: string | null;
};

export async function sessionDrivers(s: Session, signal?: AbortSignal): Promise<Driver[]> {
  const raw = await openf1<RawDriver>("drivers", { session_key: s.key }, cacheFor(s, signal));
  const seen = new Set<number>();
  return raw
    .filter((d) => !seen.has(d.driver_number) && seen.add(d.driver_number))
    .map((d) => ({
      number: d.driver_number,
      code: d.name_acronym,
      name: [d.first_name, d.last_name].filter(Boolean).join(" ") || d.full_name,
      firstName: d.first_name ?? "",
      lastName: d.last_name ?? d.full_name,
      team: d.team_name ?? "",
      teamColour: d.team_colour ? `#${d.team_colour.replace("#", "")}` : "#888888",
    }))
    .sort((a, b) => a.number - b.number);
}

const fold = (x: string) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Resolve driver references (codes, numbers, names) against a session's entry list. */
export function resolveDrivers(refs: Array<string | number>, drivers: Driver[]): Driver[] {
  return refs.map((ref) => {
    const r = fold(String(ref).trim());
    const found =
      drivers.find((d) => String(d.number) === r) ??
      drivers.find((d) => d.code.toLowerCase() === r) ??
      drivers.find((d) => fold(d.lastName) === r) ??
      drivers.find((d) => fold(d.name) === r) ??
      drivers.find((d) => fold(d.firstName) === r) ??
      drivers.find((d) => r.length > 2 && fold(d.name).includes(r));
    if (!found)
      throw new RangeError(
        `Unknown driver "${ref}" for this session. Entrants: ${drivers.map((d) => d.code).join(", ")}.`,
      );
    return found;
  });
}

export function driverMap(drivers: Driver[]) {
  return new Map(drivers.map((d) => [d.number, d]));
}
