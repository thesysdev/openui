export const RANGE = /^(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})$/;

/* Days are local "YYYY-MM-DD" strings: they sort and compare as text. */
export const pad2 = (n: number) => String(n).padStart(2, "0");
export const isoDay = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
export const parseDay = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y!, m! - 1, d!);
};
export const shiftDay = (day: string, days: number) => {
  const date = parseDay(day);
  date.setDate(date.getDate() + days);
  return isoDay(date);
};
export const dayLabel = (day: string, withYear: boolean) =>
  parseDay(day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: withYear ? "numeric" : undefined,
  });

export function formatRange(value: string): string | null {
  const match = RANGE.exec(value);
  if (!match) return null;
  const sameYear = match[1]!.slice(0, 4) === match[2]!.slice(0, 4);
  return `${dayLabel(match[1]!, !sameYear)} – ${dayLabel(match[2]!, true)}`;
}

/** The days a relative preset covers, ending today: 7d, 30d, 90d, 12m, ytd. */
export function presetRange(value: string, today: string): [string, string] | null {
  const days = /^(\d+)d$/.exec(value);
  if (days) return [shiftDay(today, 1 - Number(days[1])), today];
  const months = /^(\d+)m$/.exec(value);
  if (months) {
    const start = parseDay(today);
    start.setMonth(start.getMonth() - Number(months[1]));
    return [shiftDay(isoDay(start), 1), today];
  }
  if (value === "ytd") return [`${today.slice(0, 4)}-01-01`, today];
  return null;
}
