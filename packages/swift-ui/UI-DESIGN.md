# Native visual and layout contract

The native renderer preserves OpenUI component names and language contracts.
Visual defaults map to the pinned react-ui reference (f08a6605); native interaction,
font metrics and resource geometry use the documented platform adaptations.
See [the official-to-native mapping](OFFICIAL-VISUAL-MAPPING.md) for the source,
exceptions and acceptance status. This is not a claim of pixel-identical CSS.
`OpenUITheme` supplies shared typography, colors, spacing, surfaces and motion.
Hosts may replace theme values without redefining components or rewriting programs.

## Composition

- The parent proposes available space; containers measure their children. Text wraps
  and contributes its natural height. Missing optional content consumes no space.
- `Stack` and `Card` respect explicit direction, alignment, justification and wrap.
  A row with `wrap=true` flows when its children no longer fit. The renderer does
  not infer a layout from destination names, image counts or business categories.
- Responsive grids derive columns from their available width and declared settings.
  An explicit nonresponsive layout keeps its declaration and remains scrollable.
- Tables preserve column alignment and measured row heights. Wider content scrolls
  horizontally rather than turning the table into an unrelated card template.
- Carousel and map pages use the same native pager and current container width.
  A page selection survives appends; removing a selected page clamps the selection.
- Stable statement and component identities preserve local UI during streaming,
  state updates and theme changes. Replacing a program resets that program only.

## Visual hierarchy

Use the shared semantic text roles instead of local font constants. Titles, body
text and supporting details retain a clear hierarchy across standard components.
Semantic surface and text colors support light and dark appearances. Chart colors
come from a shared data palette rather than a single host accent. A compact
chart omits left-axis ticks when its measured gutter cannot fit complete labels;
the plot, inspection values and accessible dataset remain available.

Body variants follow the upstream semantic relationship: `large` and
`large-heavy` share a reading size and differ by weight; `small` does not imply
secondary ink. Native defaults use the reference's 16pt body, 14pt supporting reading/neutral label,
12pt caption, 18pt card title and 24pt Markdown display heading. MetricIndicator
uses the reference's 16pt emphasized numeric role instead of a separate giant number.
Inline headers use the body-heading role, card headers the title role. Neutral
tags stay regular-weight so they do not dominate explanations. These are native
platform defaults with Dynamic Type, not a conversion of CSS pixels into points.

Buttons use semantic variants, declared sizes and native hit targets. Cards provide
compact action density by default; an explicitly declared size still takes priority.
Do not enlarge a local action merely to fill a row or add a separate action below a
whole-card button. A clickable card label must not contain another button.

Object-card titles retain their natural line count. The first title line keeps
its normal image inset; short names do not reserve an invisible second line.
Grid peers align within measured rows, while carousel items retain their own
natural content extent. Explicit text-size variants remain intact.

Photo covers and gallery preview tiles use the existing `coverAspectRatio`
(3:2 by default), calculated from their available width before the resource loads.
The standard `Image` component also follows the pinned reference's 3:2/fill
default. Loading, loaded and unavailable states occupy that same frame. Photos fill the
frame proportionally and are clipped at its boundary; their source dimensions
do not resize the frame. Original-image viewing and document illustrations in
Markdown retain their complete source proportions. Photo navigation thumbnails
use the same cover ratio; square icon/thumbnail roles remain square. These are
native visual defaults, not additional language rules. Resource state,
retry and previews share `OpenUIResourceContext`. A missing or failed image must
not erase adjacent text or actions. Loading and failure retain the declared media
slot and show a neutral placeholder; detailed failure controls live in optional
diagnostics. Do not assume every horizontal composition has one image and one
fixed-width text column.

Background-photo cards use the same width-derived photo frame. Copy overlays the
photo when its complete measured content fits; larger copy and accessibility text
move below that unchanged photo. This is a placement change of the same mounted
children, not a new image instance. A responsive block with one recommendation
uses one full-width column instead of leaving a second column empty. Explicit
nonresponsive column declarations keep their existing meaning.

Card collections use one mounted subtree for grid and carousel placement. A
positional layout argument can arrive after a large inline item array; until it
is known, a browsable card viewport avoids temporarily stacking every card into
a tall document. Resolving the mode changes placement without remounting card
content. Grid rows measure complete text, share the tallest cell height and keep
their declared responsive or fixed-column behavior. A width or layout declaration
that has not arrived cannot establish final geometry in advance; the provisional
viewport is local to that collection and does not wait for the whole response.

On platforms using SwiftUI Layout (iOS 16+/macOS 13+), rows negotiate their
available width and measured content. Photo previews retain the common cover
ratio, including in stretched rows; they no longer introduce a separate 4:5
image rule. Preferred thumbnail widths, column minimums and carousel maximums
are measurement hints or bounds, not fixed photo heights. An ordinary Image in a
container whose positional direction has not arrived uses the existing compact
preferred width as a provisional proposal, retaining the same photo aspect. This
local structural guard does not affect declared card covers, gallery slots or
other media, and a resolved inner row does not wait for an unfinished outer row.

The optional Map renders supplied coordinates and valid point facts. Its default
bottom cards are compact, internal to the map and synchronized with icon markers.
The bottom overlay requests the pager's intrinsic capped height: a short card
must not align to the top of an empty maximum-height frame. Inline cards keep an
18pt bottom inset for map attribution. Default place previews use ultra-thin
system material behind fully opaque content; Reduce Transparency uses the opaque
control surface. Fullscreen content continues to respect its safe-area inset.
Custom content uses ordinary registered components. No ratings, metadata or routes
are inferred from labels. SVG and WebView are opt-in registrations through
`OpenUIWebComponents.install(into:)` in `OpenUISwiftUI`.

## Platform boundaries

The SDK requires iOS 16/macOS 13 or later and uses one measured Layout
implementation. Pager height comes from the measured selected page and interpolates only during
a user-driven transition to its neighbor. Offscreen appends do not stretch the
current card. Grid rows still share their tallest cell height; both modes retain
the same mounted children without an asynchronous scroll-height cache. MarkdownUI manages its internal semantic font
roles; the SDK shares supported colors, spacing and media styling through its
public API rather than reflection.

The 82 standard registrations have upstream names and positional signatures.
Tabs follows the upstream content-growth selection rule until a user changes the
active value. Native presentation may differ: controls use Apple interaction
conventions, and web-specific styling is not a native API contract.
Optional native extensions are documented separately
in [the component catalog](NATIVE-COMPONENTS.md).

## Verification

A separate native acceptance application presents complete task scenes using
one request-to-stream-to-interaction chain. Its checks operate real SwiftUI views
in an owned iOS Simulator and record interaction, geometry and screenshots; the
SDK-only distribution includes SDK regressions, not those business scenes.
Capturing an image or covering a registration does not establish visual approval.
Approved pixel baselines, when present, are separate from structural assertions.


Grid peer cards accept their measured row extent, with object actions at the
bottom. Carousel cards keep their natural extent. EntityList uses the reference reading roles and row rhythm; Table retains its column grid. Supporting callout
copy uses the detail text role. These defaults preserve the supplied structure
and data rather than classifying business content or reordering a response.

Composite card footers measure one mounted price/action pair for a row when both
complete natural widths fit, otherwise a column. Missing slots reserve no gap;
width or text changes do not create alternate controls. The reference's always-
column treatment was rejected in native user review. Step badges use a scaled minimum extent
and retain the complete measured numeral rather than clipping it to a fixed box.

IconText's declared sizes select a base glyph and scale its container with the
same nearest-view text environment. The standard aliases remain supported.
Table carries Col's numeric type into trailing alignment and monospaced digits;
long text columns use the theme's reading-width hint instead of a scalar-only
minimum. Values are not reformatted or rewritten.
SDK-generated Context/Composite group actions are siblings of their independent
content controls inside the item surface; no nested Button is introduced.
Reading disclosure labels align with their body. Large failed media slots show
a brief localized status; small thumbnails retain a distinct status glyph.

### Density and mounted controls

OptionCards choose their column count from the current container and measured title/subtitle height. A narrower cell may add at most about one body line over the full-width copy; otherwise the group reduces its column count. Accessibility text sizes use a single column. These are density preferences, not truncation limits: complete copy remains visible. Copy-only probes never render topContent, load images, or create actions.

Buttons use one layout subtree across row/column reflow, preserving native control identity. The explicit column direction remains authoritative. Form and FormControl now use the reference's open vertical composition, without
a grouped outer card or a second inline/stacked field subtree. This removes the
previous adaptive branch; active editing continuity still requires native interaction proof.

Chart legends balance equally sized reading columns (four comparable entries become two plus two when three plus one would otherwise fit). Their complete labels wrap, while existing minimum control targets remain intact. Bar/Line/Area charts with up to four categories reserve a second label line before omitting ticks; dense axes and numeric axes retain sparse ticks. Explicit chart height remains authoritative, and crowded previews omit ticks rather than overlap axis titles. Inspection placement is unchanged and still requires visual review.

Chart default canvas height scales with the reading size, preserving space for plotted values when labels grow. Explicit authored height retains the existing bounds and takes priority. Short category labels use one line; a second line is reserved only when measured labels require it.


### Reference convergence

Spacing names resolve to the pinned reference values: xs=6, s=8, m=12, l=18,
xl=24 and 2xl=36. Native-only internal intermediate tokens do not add DSL enum
values. Explicit legal component parameters retain their meaning.

The default theme uses the reference neutral swatches and a neutral assistant
brand. The reference default blue, per-size button corners and button shadows
were rejected during user review; native controls keep one 10pt corner and a
flat primary/secondary hierarchy. Hosts
can still override semantic theme roles. Secondary actions have a transparent
surface, an interactive border and quiet elevation; tags are informational, not
secondary buttons. Tabs use the reference's open underline treatment. Accordion
is a continuous open disclosure list, not one card per section. Generic Card
follows its own reference variants: default is open, clear adds side insets, and
sunk owns a recessed surface. Composite object cards remain independent surfaces.

The baseline typeface remains the platform system face with nearest-view Dynamic
Type. CSS line-box height, variable Inter axes, inset shadows and hover are not
claimed as exact native equivalents. Fixed photo-height rules are intentionally
replaced by the user-approved width-derived 3:2 cover contract.


Compact fact cards reflow their complete value below the description before
compressing digits. MetricIndicator keeps oversized amounts on one horizontally
scrollable line. Long accessibility tab labels wrap within the viewport. Default
map cards give enlarged names more reading space and use a smaller thumbnail,
without changing the mounted image or declared map viewport. Radar axes use
short numbers and a native full-label key, sharing drawing/inspection geometry.
