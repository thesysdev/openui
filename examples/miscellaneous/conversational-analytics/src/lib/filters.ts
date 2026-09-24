import { z } from "zod/v4";

// December 2010 is the comparison baseline. December 2011 is incomplete.
export const months = Array.from(
  { length: 11 },
  (_, i) => `2011-${String(i + 1).padStart(2, "0")}`,
);
export const filterSchema = z
  .object({
    month: z
      .string()
      .refine((value) => months.includes(value), "Choose January through November 2011."),
    country: z.string().min(1).max(80),
  })
  .strict();
export type Filters = z.infer<typeof filterSchema>;
export const defaultFilters: Filters = { month: "2011-02", country: "All countries" };

export function periodFor(month: string) {
  const [year, index] = month.split("-").map(Number);
  const iso = (offset: number) =>
    new Date(Date.UTC(year, index - 1 + offset, 1)).toISOString().slice(0, 10);
  return { previous: iso(-1), start: iso(0), end: iso(1) };
}
