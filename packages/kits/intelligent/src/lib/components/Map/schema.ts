import { reactive } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { MapMarker } from "../MapMarker";

export const MapSchema = z.object({
  markers: z.array(MapMarker.ref),
  route: z.boolean().optional(),
  selected: reactive(z.string().optional()),
  height: z.number().optional(),
});

export type MapProps = z.infer<typeof MapSchema>;
