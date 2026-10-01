# F1 tools

One registry of F1 data tools over [OpenF1](https://openf1.org), exposed two ways:

- **Chat function tools**: `src/app/api/chat/route.ts` registers every tool with the tool loop (`f1FunctionTools()` / `f1Executors()`).
- **`POST /api/f1/[tool]`**: the same tools as JSON endpoints, which the F1 charts and dashboards fetch their rows from, so numbers never pass through the model. `GET /api/f1` lists the tools with input schemas and example outputs.

| Tool | OpenF1 source | Returns |
| --- | --- | --- |
| `get_schedule` | meetings, sessions | One row per Grand Prix with status; the next race |
| `get_standings` | championship_drivers / championship_teams (else summed session_result) | Table after a race, or `view: "progression"` with a chart |
| `get_results` | session_result, starting_grid, laps | Race/sprint classification with grid and fastest laps; Q1–Q3; practice best laps |
| `get_drivers` | drivers | Entry list with team colours |
| `get_lap_times` | laps, pit | `laps` (per lap + deltas), `fastest`, `pace`, `sectors` |
| `get_gaps` | intervals (fallback: lap end times) | Gap to leader, to a driver, or interval, one row per lap |
| `get_positions` | position, starting_grid, overtakes | Position per lap (lap 0 = grid), places gained, overtakes |
| `get_stints` | stints, pit, laps | Stints with average representative lap, pit stops, strategy lines |
| `get_race_control` | race_control | Messages filtered by category/driver; SC, VSC, red flag and penalty counts |
| `get_timing_tower` | laps, intervals, position, stints, pit | The order at the end of a lap |
| `get_telemetry` | car_data, location | One lap (or two compared) on a distance grid, with time delta |
| `get_weather` | weather | Up to 40 rows plus a summary |
| `get_team_radio` | team_radio | Clip links by lap (no transcripts) |

Every `session` argument takes words (`"latest"`, `"Baku"`, `"2025 Spa"`, `"Miami sprint"`, `"round 5"`, `"2026-miami-R"`), resolved in `resolve.ts`. Driver arguments take codes, numbers or surnames.

## Cache and snapshot

`openf1.ts` throttles requests (3/s, 28/min) and caches every response under `data/openf1/`. Finished sessions are cached forever; calendar lists for 6 hours. If OpenF1 is unreachable, a stale copy is served.

```bash
npm run snapshot:f1                        # 2026: every finished session's endpoints
npm run snapshot:f1 -- --year 2025 --light # 2025 races: results, standings, stints
```

Telemetry is not snapshotted; each requested lap is fetched once and cached.
