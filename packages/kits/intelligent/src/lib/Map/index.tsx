"use client";

import { defineComponent, useIsStreaming, useStateField } from "@openuidev/react-lang";
import { useId } from "react";
import { MapView as StreetMap } from "../../components/Map";
import { placesOf } from "../mapPlaces";
import { createMapSchema, MapMarkerSchema } from "./schema";

export * from "./schema";

export const MapMarker = defineComponent({
  name: "MapMarker",
  props: MapMarkerSchema,
  description: "A place on a Map; icon is one emoji, else the pin shows its number.",
  component: () => null,
});

export const MapView = defineComponent({
  name: "Map",
  props: createMapSchema(MapMarker),
  description: "Street map fitted to its markers. route draws the road path in marker order; selected holds the clicked marker's label.",
  component: function MapBinding({ props, statementId }) {
    const streaming = useIsStreaming();
    const fallbackId = useId();
    const selection = useStateField(statementId ?? `map-${fallbackId}`, props.selected);
    return (
      <StreetMap
        places={placesOf(props.markers, streaming)}
        route={props.route}
        height={props.height}
        selected={typeof selection.value === "string" ? selection.value : null}
        onSelect={(label) => selection.setValue(label)}
        pending={streaming}
      />
    );
  },
});
