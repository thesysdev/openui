# F1 colour and typography reference

Pulled from the live CSS of [formula1.com](https://www.formula1.com/) and [formula1.com/en/teams](https://www.formula1.com/en/teams) on 30 Sep 2026. The site's own design system is prefixed `f1rd` (CSS variables `--f1rd-colour-*` and Tailwind classes like `bg-brand-hot-red`). Names below are F1's; values are exactly what their stylesheets serve.

This is a reference to pick from. Nothing here is wired into the app as tokens.

## Brand

| Name | Hex | RGB | Where F1 uses it |
| --- | --- | --- | --- |
| Hot Red | `#E10600` | 225 6 0 | Primary buttons, Subscribe, active states, the F1 logo |
| Carbon Black | `#15151E` | 21 21 30 | Dark surfaces, text on light |
| Warm White | `#F7F4F1` | 247 244 241 | Page background in light mode, text on dark |
| Shift Green | `#71CC98` | 113 204 152 | Brand accent |
| Spark Yellow | `#E6F854` | 230 248 84 | Brand accent |
| Bright Blue 50 | `#0076CC` | 0 118 204 | Links and info accents |
| Bright Blue 60 | `#0463A9` | 4 99 169 | Link hover |

## Neutrals (static scale)

| Step | Hex | Notes |
| --- | --- | --- |
| static-1 | `#FFFFFF` | White |
| surface-2 | `#F3F3F4` | Light card |
| static-3 / surface-3 | `#F7F4F1` | Warm White |
| surface-4 | `#E0DEDC` | Tonal button, light divider |
| surface-5 | `#CDCDCD` | |
| static-5 / surface-6 | `#AAAAAA` | Secondary button hover, dividers |
| surface-7 | `#606066` | Secondary text on light |
| surface-8 | `#47464C` | Tonal hover on dark |
| static-8 / surface-9 | `#303037` | Card on dark |
| — | `#26262B` | Tertiary hover on dark |
| — | `#1C1C25` | Body text on light |
| static-10 | `#15151E` | Carbon Black |
| static-11 | `#000000` | Black |

## Light and dark surfaces

F1 flips the same scale between modes. Pairs are light / dark.

| Role | Light | Dark |
| --- | --- | --- |
| surface-1 (base) | `#FFFFFF` | `#000000` |
| surface-2 | `#F3F3F4` | `#26262B` |
| surface-3 (page) | `#F7F4F1` | `#15151E` |
| surface-4 | `#E0DEDC` | `#303037` |
| surface-5 | `#CDCDCD` | `#47464C` |
| surface-6 | `#AAAAAA` | `#606066` |
| text-3 (muted) | `#606066` | `#AAAAAA` |
| text-4 (body) | `#1C1C25` | `#FFFFFF` |
| button secondary | `#000000` | `#FFFFFF` |
| button tonal | `#E0DEDC` | `#303037` |

## System

| Name | Light | Dark |
| --- | --- | --- |
| Positive | `#1A8930` | `#28973E` |
| Negative | `#E91711` | `#FF2D27` |
| Neutral | `#606066` | `#CDCDCD` |
| Error (orange) | `#E66700` | |
| Warning | `#FFD100` | |
| Hot Red 20 | `#F6B4B2` | `#710E10` |
| Sector Purple 70 | `#5300A6` | `#370969` |
| Sector Purple 80 | `#370969` | `#5300A6` |

Sector purple is the timing-screen "fastest overall" colour.

## Teams (2026)

The main colour is what F1 uses for team cards and standings bars; the dark shade is the card's gradient end.

| Team | Main | Dark |
| --- | --- | --- |
| Mercedes | `#27F4D2` | `#067E6A` |
| Ferrari | `#E8002D` | `#5C0012` |
| McLaren | `#FF8000` | `#804000` |
| Red Bull Racing | `#3671C6` | `#142948` |
| Aston Martin | `#229971` | `#0F4331` |
| Alpine | `#00A1E8` | `#004E70` |
| Williams | `#1868DB` | `#082145` |
| Racing Bulls | `#6692FF` | `#0038C2` |
| Haas F1 Team | `#DEE1E2` | `#667175` |
| Audi | `#FF2D00` | `#751500` |
| Cadillac | `#AAAAAD` | `#58585B` |

## Typefaces

Two open-licence fonts only. Different uses come from weights and variation settings, not more families. F1's own fonts are proprietary, so we don't use them.

| Family | Range | Role | Licence | File |
| --- | --- | --- | --- | --- |
| Titillium Web | Weights 200–900 (+ italics) | Body copy, nav, tables, UI. It is the font formula1.com itself uses for body text. | SIL OFL 1.1 | `public/fonts/titillium-web/` |
| Saira (variable) | `wght` 100–900, `wdth` 50–125 (+ italic) | Headlines, wide display, labels, timing numbers. Its squared, technical shapes are the closest open match to F1's display face. | SIL OFL 1.1 | `public/fonts/saira/saira-variable.ttf` |

## Type scale

Sizes measured on formula1.com. Saira roles are set with `font-variation-settings: "wght" …, "wdth" …`.

| Role | Family | Size / line height | wght | wdth | Other |
| --- | --- | --- | --- | --- | --- |
| Display | Saira | 40 / 44px | 900 | 100 | |
| Page title (H1) | Saira | 32 / 38px | 900 | 100 | Uppercase |
| Section title (H2) | Saira | 24 / 28px | 800 | 100 | Uppercase |
| Wide display | Saira | 24 / 32px | 600 | 125 | Uppercase |
| Hero italic | Saira | 40 / 44px | 900 | 112 | Uppercase, italic |
| Card title | Saira | 20 / 24px | 500 | 100 | |
| Label | Saira | 16 / 22px | 600 | 110 | Uppercase |
| Timing number | Saira | 28 / 28px | 700 | 87 | `tabular-nums` |
| Caption | Saira | 12 / 16px | 400 | 100 | |
| Article body | Titillium Web | 17 / 28px | 400 | | |
| UI body | Titillium Web | 16 / 24px | 600 | | |
| Nav / table head | Titillium Web | 14 / 16px | 700 | | Uppercase |

Letter spacing is `normal` everywhere we measured.
