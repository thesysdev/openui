import { z } from "zod/v4";

export const YouTubeSchema = z.object({ video: z.string(), title: z.string().optional() });

export type YouTubeProps = z.infer<typeof YouTubeSchema>;
