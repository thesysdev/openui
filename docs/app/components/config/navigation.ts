import type { NavGroup, NavItem } from "@components/types";

export const TOP_NAV_ITEMS: NavItem[] = [
  { id: "customize", label: "Customize", href: "/components/customize" },
  { id: "compose", label: "Compose", href: "/components/compose" },
  { id: "blocks", label: "Blocks", href: "/components/blocks" },
  { id: "foundation", label: "Foundation", href: "/components/foundation" },
  { id: "theme-builder", label: "Theme Builder", href: "/components/theme-builder" },
];

export const FOUNDATION_NAV_ITEMS: NavGroup[] = [
  {
    id: "foundation-group",
    label: "",
    items: [
      { id: "introduction", label: "Introduction", href: "/components/foundation" },
      { id: "colors", label: "Colors", href: "/components/foundation/colors" },
      { id: "spacing", label: "Spacing", href: "/components/foundation/spacing" },
      { id: "typography", label: "Typography", href: "/components/foundation/typography" },
      { id: "radius", label: "Radius", href: "/components/foundation/radius" },
      { id: "shadows", label: "Shadows", href: "/components/foundation/shadows" },
    ],
  },
];

export const BLOCKS_NAV_ITEMS: NavGroup[] = [
  {
    id: "overview-group",
    label: "",
    items: [{ id: "introduction", label: "Introduction", href: "/components/blocks" }],
  },
  {
    id: "navigation",
    label: "Navigation",
    items: [{ id: "tabs", label: "Tabs", href: "/components/blocks/tabs" }],
  },
  {
    id: "individual-blocks",
    label: "Individual blocks",
    items: [
      {
        id: "accordian",
        label: "Accordian",
        href: "/components/blocks/accordian",
        badgeText: "Fixing",
      },
      { id: "button-group", label: "Buttons", href: "/components/blocks/button-group" },
      { id: "callout", label: "Callout", href: "/components/blocks/callout" },
      { id: "image-items", label: "Image", href: "/components/blocks/image-items" },
      { id: "lists", label: "Lists", href: "/components/blocks/lists" },
      { id: "tables", label: "Tables", href: "/components/blocks/tables", badgeText: "Fixing" },
      {
        id: "text-items",
        label: "Text items",
        href: "/components/blocks/text-items",
        badgeText: "Fixing",
      },
      { id: "tag-item", label: "Tag item", href: "/components/blocks/tag-item" },
    ],
  },
  {
    id: "charts",
    label: "Charts",
    items: [
      { id: "bar-chart", label: "Bar", href: "/components/blocks/charts/bar" },
      { id: "line-chart", label: "Line", href: "/components/blocks/charts/line" },
      { id: "area-chart", label: "Area", href: "/components/blocks/charts/area" },
      { id: "pie-chart", label: "Pie", href: "/components/blocks/charts/pie" },
      { id: "donut-chart", label: "Donut", href: "/components/blocks/charts/donut" },
      { id: "scatter-chart", label: "Scatter", href: "/components/blocks/charts/scatter" },
      { id: "radial-chart", label: "Radial chart", href: "/components/blocks/charts/radial" },
    ],
  },
  {
    id: "forms",
    label: "Forms",
    items: [
      { id: "checkbox-group", label: "Checkbox group", href: "/components/blocks/checkbox-group" },
      { id: "date-picker", label: "Date picker", href: "/components/blocks/date-picker" },
      { id: "input-field", label: "Input field", href: "/components/blocks/input-field" },
      { id: "toggle-group", label: "Toggle group", href: "/components/blocks/toggle-group" },
      {
        id: "radio-button-group",
        label: "Radio button group",
        href: "/components/blocks/radio-button-group",
      },
      { id: "select", label: "Select", href: "/components/blocks/select" },
    ],
  },
];
