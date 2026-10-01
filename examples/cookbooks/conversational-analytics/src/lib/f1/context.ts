import { CURRENT_YEAR, resolveSession, season, sessionDrivers, sessionLabel } from "./resolve";

// A few lines of season context for the system prompt: progress, the latest and next race,
// and the current entry list. Served from the cache; returns nothing if OpenF1 is unreachable.
export async function f1PromptContext(signal?: AbortSignal) {
  try {
    const meetings = (await season(CURRENT_YEAR, signal)).filter((m) => !m.testing && !m.cancelled);
    const races = meetings.map((m) => m.sessions.find((s) => s.name === "Race")).filter((s) => !!s);
    const done = races.filter((s) => s.finished);
    const next = races.find((s) => !s.finished);
    const { session: latest } = await resolveSession("latest", { signal });
    const drivers = await sessionDrivers(latest, signal);
    return {
      season: `${CURRENT_YEAR}: ${done.length} of ${races.length} races completed; the latest race is ${sessionLabel(latest)} (round ${latest.round}, ${latest.dateStart.slice(0, 10)})${next ? `, and the next is the ${next.meetingName} in ${next.location} (round ${next.round}, ${next.dateStart.slice(0, 10)})` : ""}.`,
      entrants: drivers.map((d) => `${d.code} ${d.number} ${d.name} (${d.team})`),
    };
  } catch {
    return {};
  }
}
