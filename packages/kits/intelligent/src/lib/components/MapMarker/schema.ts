import { z } from "zod/v4";

export const MapMarkerSchema = z.object({
  label: z.string(),
  lat: z.number(),
  lng: z.number(),
  category: z.string().optional(),
  icon: z.string().optional(),
});

export type MapMarkerProps = z.infer<typeof MapMarkerSchema>;
