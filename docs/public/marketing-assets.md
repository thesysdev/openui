# Marketing illustration exports

Updated 2026-09-07 from [the approved Figma section](https://www.figma.com/design/0C0QQKeArzbSXeGTuhjwj3?node-id=433-18560).
The checked-in files use the manual exports in `~/Downloads/illus`: the 1440px
Observability frames are 2× exports (4× their 720px website slot), while the
1120px homepage and Gateway frames are 3× exports. All are lossless WebP.

Paths below are relative to `docs/public`. Each `{theme}` is `light` or `dark`.

| Artwork        | File                                                 | Pixels      | Light / dark Figma node |
| -------------- | ---------------------------------------------------- | ----------- | ----------------------- |
| Framework      | `openui-illustrations/home-open-source-{theme}.webp` | 3360 × 1320 | 433:17783 / 433:18172   |
| Gateway repair | `images/gateway/reliability-{theme}@4x.webp`         | 3360 × 1320 | 433:14059 / 433:14618   |
| Session replay | `openui-observability/session-replay-{theme}.webp`   | 2880 × 1804 | 381:2274 / 381:1719     |
| Triage         | `openui-observability/triage-figma-{theme}.webp`     | 2880 × 1600 | 381:4327 / 381:2829     |
| Annotations    | `openui-observability/annotations-{theme}.webp`      | 2880 × 1600 | 381:5083 / 381:5057     |
| Evals          | `openui-observability/evals-figma-{theme}.webp`      | 2880 × 1600 | 433:17412 / 433:17594   |

The homepage and Gateway reuse the same repair files. Both framework and repair
use a 1120:440 desktop frame and the existing 4:2.4 mobile crop. Observability
keeps its existing responsive focal crops. Replace both theme files together.

The annotations frames contain embedded raster screenshots in Figma. Their
internal screenshot radius is doubled in the 1440px source so it lands at the
intended size when the artwork is rendered in the 720px website slot.
