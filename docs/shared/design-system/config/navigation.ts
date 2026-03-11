import type { NavGroup, NavItem } from "@design-system/types";

const BASE = "/docs/design-system";

export const TOP_NAV_ITEMS: NavItem[] = [
  { id: "customize", label: "Customize", href: `${BASE}/customize` },
  { id: "compose", label: "Compose", href: `${BASE}/compose` },
  { id: "blocks", label: "Blocks", href: `${BASE}/blocks` },
  { id: "foundation", label: "Foundation", href: `${BASE}/foundation` },
  { id: "theme-builder", label: "Theme Builder", href: `${BASE}/theme-builder` },
];

export const FOUNDATION_NAV_ITEMS: NavGroup[] = [
  {
    id: "foundation-group",
    label: "",
    items: [
      { id: "introduction", label: "Introduction", href: `${BASE}/foundation` },
      { id: "colors", label: "Colors", href: `${BASE}/foundation/colors` },
      { id: "spacing", label: "Spacing", href: `${BASE}/foundation/spacing` },
      { id: "typography", label: "Typography", href: `${BASE}/foundation/typography` },
      { id: "radius", label: "Radius", href: `${BASE}/foundation/radius` },
      { id: "shadows", label: "Shadows", href: `${BASE}/foundation/shadows` },
      { id: "motion", label: "Motion", href: `${BASE}/foundation/motion` },
    ],
  },
];

export const BLOCKS_NAV_ITEMS: NavGroup[] = [
  {
    id: "overview-group",
    label: "",
    items: [{ id: "overview", label: "Overview", href: `${BASE}/blocks` }],
  },
  {
    id: "navigation",
    label: "Navigation",
    items: [{ id: "tabs", label: "Tabs", href: `${BASE}/blocks/tabs` }],
  },
  {
    id: "individual-blocks",
    label: "Individual blocks",
    items: [
      { id: "accordian", label: "Accordian", href: `${BASE}/blocks/accordian` },
      { id: "button-group", label: "Buttons", href: `${BASE}/blocks/button-group` },
      { id: "callout", label: "Callout", href: `${BASE}/blocks/callout` },
      { id: "image-items", label: "Image items", href: `${BASE}/blocks/image-items` },
      { id: "lists", label: "Lists", href: `${BASE}/blocks/lists` },
      { id: "tables", label: "Tables", href: `${BASE}/blocks/tables` },
      { id: "text-items", label: "Text items", href: `${BASE}/blocks/text-items` },
      { id: "tag-item", label: "Tag item", href: `${BASE}/blocks/tag-item` },
    ],
  },
  {
    id: "charts",
    label: "Charts",
    items: [
      { id: "bar-chart", label: "Bar", href: `${BASE}/blocks/charts/bar` },
      { id: "line-chart", label: "Line", href: `${BASE}/blocks/charts/line` },
      { id: "area-chart", label: "Area", href: `${BASE}/blocks/charts/area` },
      { id: "pie-chart", label: "Pie", href: `${BASE}/blocks/charts/pie` },
      { id: "donut-chart", label: "Donut", href: `${BASE}/blocks/charts/donut` },
      { id: "scatter-chart", label: "Scatter", href: `${BASE}/blocks/charts/scatter` },
      { id: "radial-chart", label: "Radial chart", href: `${BASE}/blocks/charts/radial` },
    ],
  },
  {
    id: "forms",
    label: "Forms",
    items: [
      { id: "checkbox-group", label: "Checkbox group", href: `${BASE}/blocks/checkbox-group` },
      { id: "date-picker", label: "Date picker", href: `${BASE}/blocks/date-picker` },
      { id: "input-field", label: "Input field", href: `${BASE}/blocks/input-field` },
      { id: "toggle-group", label: "Toggle group", href: `${BASE}/blocks/toggle-group` },
      {
        id: "radio-button-group",
        label: "Radio button group",
        href: `${BASE}/blocks/radio-button-group`,
      },
      { id: "select", label: "Select", href: `${BASE}/blocks/select` },
    ],
  },
];
