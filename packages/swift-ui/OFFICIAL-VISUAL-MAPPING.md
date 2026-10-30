# Official visual mapping and native exceptions

## Baseline and ownership

The reference is thesysdev/openui `f08a660535e55b5b2a24a0eb68568edaf9e4fe4b`,
`packages/react-ui`. The component implementation, its genui wrapper and the
shared theme must be read together: a React prop is not automatically a Lang
parameter. The separate open-intelligent-ui example is not this visual baseline.

Task: make a generated assistant response easy to read, compare and act on, with
stable geometry while it streams. The focus is the recommendation or answer;
images support identification, and the object's action remains nearby. Secondary
labels and containers must not compete with the content.

- SDK: shared visual roles, component presentation, responsive placement,
  resource states, stable mounted controls and action readiness.
- Authored examples/caller prompt: recommendation order, explanation, amount of
  content, supplied facts and selection of legal components.
- Client: conversation bubble, outer reading width/insets, app navigation and
  overall scroll container. This work does not add a Host fallback.
- Language core: unchanged by this visual convergence. No new grammar,
  component registration, positional argument, enum or prompt restriction.

## Foundation mapping

Logical point values below correspond to the reference's default CSS values;
they scale through the receiving SwiftUI environment. This is a default visual
mapping, not a claim that a CSS pixel equals a physical display pixel.

| Role | Reference | Native default | Owner |
| --- | --- | --- | --- |
| Body / supporting / caption | 16 / 14 / 12 | 16 / 14 / 12 pt | OpenUITypography |
| Card header / inline header | heading-small 18 / body-heavy 16 | 18 / 16 pt | NativeHeading |
| Body large and large-heavy | both 18, weight differs | both 18, weight differs | NativeRichTextStyle |
| Text xs / sm / md / lg | 14 / 16 / 16 / 18 | 14 / 16 / 16 / 18 pt | OpenUITypography.inline |
| Text subtext xs,sm / md,lg | 14 / 16 | 14 / 16 pt | NativeInlineText |
| Tag text | label-small 14 at all densities | 14 pt, padding changes | NativeTagPill |
| Action small / regular | label-small 14 / default 16 | 14 / 16 pt | NativeActionButtonStyle |
| MetricIndicator value | number-heavy 16 | 16 pt, tabular digits | NativeMetric |
| Code | code-default 14 | 14 pt, native monospace | NativeCodeBlockContent |
| Gap xs / s / m / l / xl / 2xl | 6 / 8 / 12 / 18 / 24 / 36 | same logical values | OpenUITheme.spacing |
| Neutral ink | neutral-1000 light / neutral-50 dark | #030303 / #FAFAFA | OpenUITheme |
| Secondary ink | primary at 60% | same opacity | OpenUITheme |
| Recessed / subtle surface | overlay at 4% / 2% | same opacity | OpenUITheme |
| Default / interactive border | overlay at 6% / 12% | same opacity | OpenUITheme |
| Accent | official brand is configurable; default blue-600 | native neutral brand / host override | OpenUITheme.accent |
| Surface border | 1 | 1 pt | OpenUITheme.cardBorderWidth |
| Composite padding / radius | 12 / 16 | 12 / 16 pt | NativeCardItem |
| Overview, Snippet padding / radius | 10 / 14 | 10 / 14 pt | NativeCardItem |
| Context padding / radius | 12 / 12 | 12 / 12 pt | NativeCardItem |
| Media corner | radius-m 8 | 8 pt | OpenUITheme.mediaCornerRadius |

Neutral and semantic swatches are converted from the pinned OKLCH source to
8-bit sRGB. Semantic tint backgrounds follow the host's semantic color at a
shared low opacity; they are not claimed to reproduce every upstream source
swatch/alpha combination. Theme overrides continue to work. An unrelated
semantic color must not silently become the chart series palette.

## Component presentation

| Family | Reference relationship adopted | Native boundary / remaining review |
| --- | --- | --- |
| Stack, Card | declared direction/alignment/wrap; Card default open, clear side insets, sunk recessed | measured native Layout; rounded background/media do not mask text; existing legal parameters preserved |
| TextContent, Markdown, Text, BoldText | shared type hierarchy, small does not imply gray, emphasis does not change reading size | system font metrics, MarkdownUI block layout |
| CardHeader, InlineHeader, Label | role-specific typography, description priority and spacing | full text may grow at larger type |
| Image, ImageBlock, ImageGallery, ImageTextLarge | shared media radius and stable slots | user-approved 3:2 photo covers instead of fixed 180px banner |
| ImageText, IconText, Icon | reference compact type and neutral/semantic badge treatment; pinned Lucide artwork | icon-size parameters and nearest-view scaling retained |
| Tag, TagBlock | informational tint, primary neutral ink, label-small across sizes | complete long labels can wrap instead of being ellipsized |
| Button, IconButton, Buttons | primary/secondary/tertiary hierarchy; transparent bordered secondary, shared native button corner and density | native hit target, focus, press/Reduce Motion; flat neutral assistant treatment |
| EntityList | reference body roles, header priority, tabular amounts and row rhythm | measured label/value reflow remains; open rows keep separators for header/total |
| ListBlock, ListItem, Steps | common reading roles, media/text gap, number and action hierarchy | width-derived photo previews, complete text and scalable step marker |
| CompositeCardItem/Block | 12pt inset, 16pt corner, quiet surface, measured amount/action relationship | full-bleed 3:2 cover; amount/action share a row when they fit, otherwise stack; one mounted action remains inside card |
| Overview, Snippet, Context, Visual cards | family-specific radius/inset from the same scale | photo cards use width-derived extent; native collection measurement retained; compact facts stack before splitting values |
| Tabs | open labels with selected underline and neutral divider | native horizontal scrolling and focus; long accessibility labels wrap within the viewport |
| Accordion | continuous clear disclosure list, no separate card per item | native DisclosureGroup affordance; streaming open-selection behavior retained |
| Form, FormControl | open vertical flow, 16pt form gap, 8pt control gap | one input subtree; native field/picker interaction retained |
| Input, TextArea, Select, DatePicker | shared reading role, subtle surface, interactive/error border | native keyboard, date sheet, text editor and minimum targets |
| CheckBoxGroup, RadioGroup, SwitchGroup | shared labels, descriptions, spacing and semantic colors | platform controls and affordances retained |
| Chips, OptionCards | reference selection border/tint, density and corners | native targets; card columns adapt to complete copy without duplicate controls |
| Slider | same field/text/spacing language | native track, discrete picker and draft behavior retained |
| Table, EditableTable | shared borders, insets and reading hierarchy | horizontal data-preserving overflow and native editing retained |
| MetricIndicator family | 16pt numeric emphasis; units and old value stay secondary | native number formatting and responsive reflow; oversized amounts scroll intact |
| CodeBlock | shared mono role, header, surface and padding | native copy action and pinned syntax tokenizer retained |
| Chart family | shared surrounding text and colors with existing series palette | native axis measurement, legend balance and canvas scaling; radar uses numbered axes plus complete category key |
| Map | shared typography/surfaces and action hierarchy | native extension: map gestures, pins, local selection and resource lifecycle |
| Modal, Popover | shared content roles, overlay surface and spacing | native presentation, safe area, dismissal and focus |
| SVG, WebView | shared boundary, state and surface presentation | opt-in extensions in OpenUISwiftUI; authored web content owns its internal CSS |
| Loading, unavailable, empty | same visual tokens; localized user-facing state | preserve adjacent facts/actions and reserved media frame; diagnostics separate |

Data-only registrations (Col, Series, ScatterSeries, Point, Slice, TabItem,
AccordionItem, StepsItem, SelectItem and selection option nodes) are inspected in
their consuming component. A blank standalone screenshot is not visual approval.

## Approved exceptions

1. Native system fonts and nearest-view Dynamic Type replace bundled Inter.
   Native font metrics/leading and semibold emphasis approximate the reference;
   the 440/560 variable axes and CSS line boxes are not reproduced. The existing
   host-adjustable extra line-spacing factor remains 0.20.
2. Photo covers use available width / 1.5 and crop proportionally before pixels
   arrive. Original-image viewers and document images preserve full source
   geometry. Square avatar/icon roles remain square. Content and actions are
   never cropped just to equalize complete card heights.
3. Input, focus, touch, keyboard, gestures and platform presentation are native.
   Compact visible controls retain the larger native hit region.
4. Native chart geometry and palette remain. Labels, legends and inspection must
   stay legible at large type and cannot borrow fixed web heights blindly.
5. The assistant uses a neutral brand, one 10pt button corner and flat controls.
   The reference's blue default, per-size corners and button shadows are not
   the native skin; the first blue candidate was rejected in user review.
   Object footers share a row when both complete values fit and stack when they do
   not. The always-column first candidate was rejected in user review.
   Card/overlay elevation approximates CSS multi-layer shadows. This does not
   authorize new local colors, font sizes or ornamental shadows.
6. Tags use a shared capsule shape following the later explicit user request.
   This replaces the earlier small-corner native badge mapping; parameters and
   text/density roles remain unchanged.

Explicitly supplied legal parameters take priority over defaults. Defaults are
not an allowlist; this document does not narrow the standard Lang contract.

## Runtime adaptations that remain native

The shared Lang core is pinned, not an unmodified byte copy. `core-manifest.json`
and its adapter hash track the runtime and build inputs. The explicit
`retainedPatches` list covers serializer precedence/lossless keys, materialization
budgets, and bounded native pattern validation. In addition,
`scripts/readiness.ts` and `scripts/readiness-compat.mjs` instrument the lexer,
expression/parser, materialization and evaluation paths to carry source-complete
metadata. That metadata and per-card action gating are native presentation
behavior; no additional Lang syntax or business-scene dispatch is introduced.
The three-item retained-patch list alone is not a complete customization inventory.

Stable element/control identity, prepared schema caches, request coalescing,
resource ownership, cancellation and execution budgets are SDK runtime policy.
They must remain independent of hotel/travel/example content. The optional Map,
Popover, SVG and WebView definitions are declared component extensions; the
standard catalog retains 82 definitions, with 86 in the current review registry.

The 50 imported scenes, their synthetic data, calculator functions, timers and
fixed web-game scripts live under `Tests/Review`, and are not production SDK
components or default prompt additions. UI verification of the review shell does
not establish the consuming client's bubble, lifecycle or transport behavior.

## Acceptance and change control

The implementation is a candidate until reviewed in real native views. Required
artifacts are the same-source component gallery, six complete authored scenes,
representative narrow/wide/large-type/dark layouts, and offline streaming checks.
Button/field/media identity and user selections must survive layout changes.
A successful parser test, build or screenshot export is not visual acceptance.
Client-bubble acceptance is separate from the SDK review shell.

Record each deviation as: reference source -> native mapping -> reason -> proof.
Change a shared role first; add a component exception only when its semantic role
requires one. Preserve earlier dirty work and distinguish this batch's diff.

## Theme convergence

Spacing and radius tokens follow the pinned `ThemeProvider/types.ts` and
`defaultTheme.ts`; component gap mappings follow `genui-lib/Stack/index.tsx` and
`genui-lib/Card/index.tsx`. Existing native overrides retain precedence. Literal
spacing in metrics, chart details, citations, embedded fallbacks and map controls
now reads those shared tokens with the same default values. Platform/control
geometry is retained.

`ImageTextLarge.tsx` selects `TextBlockView` with `highlight-text` and `sm`;
`TextBlock/textBlock.scss` maps this to `body/heavy`. The native banner previously
used `.medium`; it now uses the configurable `bodyHeavy` role (body size, native
semibold). This is the intended default visual correction. Image cropping and
footer composition are outside this change. Font-specific extra line spacing
is optional; the existing global fallback remains unchanged.

### Source organization and theme inheritance

The native module separates Components, GenUILib, Context, Theme and internal
helpers, while retaining its existing renderer/state entry files. This is a source-organization change, with no new
products or component definitions. Local theme updates use SwiftUI
`transformEnvironment`, preserving inherited values without a second resolver.
The complete-value API still replaces its scope. TextContent, Text, BoldText and
Markdown emphasis now select body typography rather than borrowing heading
weights/sizes; defaults are retained. The reference Stack/Card gap map uses a
literal zero for `none`, which is kept independent of `space000`.
