import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";

type RefComponent = { ref: any };

export const MapMarkerSchema = z.object({
  label: z.string(),
  lat: z.number(),
  lng: z.number(),
  category: z.string().optional(),
  icon: z.string().optional(),
});

export type MapMarkerProps = z.infer<typeof MapMarkerSchema>;

export function createMapSchema(MapMarker: RefComponent) {
  return z.object({
    markers: z.array(MapMarker.ref),
    route: z.boolean().optional(),
    selected: reactive(z.string().optional()),
    height: z.number().optional(),
  });
}

export type MapProps = z.infer<ReturnType<typeof createMapSchema>>;
