// Snapshots finished OpenF1 sessions into the tools' disk cache (data/openf1), so the F1 tools
// answer offline and without hitting OpenF1's rate limits. Finished sessions never change, so
// each file is fetched once; re-running only fetches what is missing.
//
//   npm run snapshot:f1                      # 2026: races, sprints, qualifying, practice
//   npm run snapshot:f1 -- --year 2025 --light   # 2025 races: results, standings, stints only
//
// Telemetry (car_data, location) is not snapshotted: it is fetched per lap on demand and cached.
import { SNAPSHOT_ENDPOINTS } from "../src/lib/f1/data";
import { openf1 } from "../src/lib/f1/openf1";
import { season } from "../src/lib/f1/resolve";

const args = process.argv.slice(2);
const year = Number(args[args.indexOf("--year") + 1]) || 2026;
const light = args.includes("--light");
const LIGHT = ["drivers", "session_result", "stints", "pit", "championship_drivers", "championship_teams"];

const meetings = await season(year);
const sessions = meetings
  .flatMap((m) => m.sessions)
  .filter((s) => s.final && !s.cancelled);
const priority = ["Race", "Sprint", "Qualifying", "Sprint Qualifying"];
const rank = (name: string) => (priority.includes(name) ? priority.indexOf(name) : priority.length);
sessions.sort((a, b) => rank(a.name) - rank(b.name) || b.dateStart.localeCompare(a.dateStart));

const jobs: Array<{ label: string; endpoint: string; key: number }> = [];
for (const s of sessions) {
  const kind = s.name.startsWith("Practice") ? "Practice" : s.name;
  if (light && s.name !== "Race") continue;
  const endpoints = light ? LIGHT : (SNAPSHOT_ENDPOINTS[kind] ?? []);
  for (const endpoint of endpoints)
    jobs.push({ label: `${s.meetingName} ${s.name}`, endpoint, key: s.key });
}

console.log(`${year}: ${sessions.length} finished sessions, ${jobs.length} endpoint files.`);
let done = 0;
let rows = 0;
const failures: string[] = [];
for (const job of jobs) {
  try {
    const data = await openf1(job.endpoint, { session_key: job.key }, { final: true });
    rows += data.length;
  } catch (error) {
    failures.push(`${job.label} ${job.endpoint}: ${error instanceof Error ? error.message : error}`);
  }
  if (++done % 10 === 0 || done === jobs.length)
    console.log(`  ${done}/${jobs.length} · ${rows.toLocaleString()} rows · last: ${job.label} ${job.endpoint}`);
}
console.log(`Done. ${rows.toLocaleString()} rows cached in data/openf1.`);
if (failures.length) console.log(`Failed (${failures.length}):\n  ${failures.join("\n  ")}`);
