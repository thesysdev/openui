"use client";

import { defineComponent } from "@openuidev/react-lang";
import { MapMarkerSchema } from "./schema";

export * from "./schema";

export const MapMarker = defineComponent({
  name: "MapMarker",
  props: MapMarkerSchema,
  description: "A place on a Map; icon is one emoji, else the pin shows its number.",
  component: () => null,
});
