# F1 asset data

Snapshots used by `src/components/f1-assets.tsx`, so the UI never needs the network.
Refresh with `npx tsx scripts/snapshot-f1-assets.ts`.

| File | Source | License |
| --- | --- | --- |
| `drivers.json` | [OpenF1](https://openf1.org) `/v1/drivers?session_key=latest` (names, numbers, team names, team colours) | OpenF1 open API. `headshotUrl` points at formula1.com images, which are F1-owned: only used behind an opt-in dev prop. |
| `circuits.json` | 2026 calendar from OpenF1 `/v1/meetings?year=2026` (includes cancelled rounds with `status: "cancelled"`), outlines from [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) GeoJSON | Outlines MIT, see `LICENSE-f1-circuits.md` |
| `cars.ts` | Side view: ["F1 car" by Skoll](https://game-icons.net/1x1/skoll/f1-car.html), game-icons.net. Top view: ["2D Race Cars" by looneybits](https://opengameart.org/content/2d-race-cars), OpenGameArt (pitstop_car_4). | Side: CC BY 3.0 (credit Skoll / game-icons.net). Top: CC0. |
| `helmet.ts` | ["Full motorcycle helmet" by Delapouite](https://game-icons.net/1x1/delapouite/full-motorcycle-helmet.html), game-icons.net, mirrored to face right | CC BY 3.0 (credit Delapouite / game-icons.net) |

Country flags come from the [flag-icons](https://github.com/lipis/flag-icons) package (MIT).
Team logos live apart from these open assets, in `src/components/f1-team-logos.tsx`. They are team
trademarks, hotlinked from formula1.com's media CDN and never stored here. No F1 logo or proprietary fonts are used.
