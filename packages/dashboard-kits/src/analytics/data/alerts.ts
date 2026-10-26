// Alerts: the metrics an alert can watch and a back-tested preview of a rule.

import { formatNumber } from "../../core/format";
import { dayLabels, dayOfWeek, mean, round } from "../../core/sample-data";
import { deliveries, nOfM, runsOf } from "../alerts";
import { PRODUCT_EVENTS } from "../calendar";
import { activationRate, dau, signups } from "./activity";

export const ALERT_METRICS = {
  dau: { label: "Daily active users", format: "number" as const },
  signups: { label: "New signups", format: "number" as const },
  activation: { label: "Activation", format: "percent" as const },
};

/**
 * An alert back-tested on the last 30 or 90 days: each day against its usual
 * level, the mean of the same weekday over the 4 weeks before (our rule),
 * below when it falls more than `drop` percent under it. The rule is on when
 * `need` of the last `of` days were below, consecutive days on are one alert,
 * and with quiet weekends an alert starting at the weekend waits for Monday
 * (alerts.ts). Holidays and tracking changes are called out so a noisy rule is
 * easy to spot.
 */
export function alertPreview(
  metric: keyof typeof ALERT_METRICS,
  drop: number,
  confirm: "1of1" | "2of3" | "3of5",
  quiet: boolean,
  days: number,
) {
  const span = days + 28;
  const values =
    metric === "dau"
      ? dau("all", "all", span)
      : metric === "signups"
        ? signups("all", "all", span)
        : Array.from({ length: span }, (_, i) => activationRate("all", "all", span - 1 - i) * 100);
  const actual = values.slice(28);
  const usual = actual.map((_, i) => mean([1, 2, 3, 4].map((w) => values[28 + i - 7 * w]!)));
  const line = usual.map((u) => u * (1 - drop / 100));
  const labels = dayLabels(days);
  const below = actual.map((v, i) => v < line[i]!);
  const [need, of] = { "1of1": [1, 1], "2of3": [2, 3], "3of5": [3, 5] }[confirm];
  const sent = deliveries(runsOf(nOfM(below, need!, of!)), (i) => dayOfWeek(days - 1 - i), quiet);
  const { label, format } = ALERT_METRICS[metric];
  const digits = format === "percent" ? 1 : 0;
  // A holiday or data problem that overlaps the alert, and could move this metric.
  const causeOf = ([first, last]: [number, number]) =>
    PRODUCT_EVENTS.find(
      (e) =>
        e.kind !== "launch" &&
        !e.anyEventOnly &&
        days - 1 - last <= e.from &&
        days - 1 - first >= e.to,
    );
  const events = sent.map(({ run, day, held }) => {
    const [first, last] = run;
    let worst = first;
    for (let i = first; i <= last; i++)
      if (actual[i]! / usual[i]! < actual[worst]! / usual[worst]!) worst = i;
    const why = causeOf(run);
    const when = held
      ? day < days
        ? ` · held to Monday ${labels[day]}`
        : " · held to Monday"
      : "";
    return {
      label: last > first ? `Alert · ${last - first + 1} days` : "Alert",
      start: labels[first]!,
      end: labels[last]!,
      detail: `${label} lowest on ${labels[worst]}: ${round(actual[worst]!, digits)} against a usual ${round(usual[worst]!, digits)}${why ? ` · ${why.label}` : ""}${when}`,
      kind:
        why?.kind === "holiday" || why?.kind === "measurement" ? why.kind : ("incident" as const),
    };
  });
  const noisy = events.filter((e) => e.kind !== "incident").length;
  const held = sent.filter((d) => d.held).length;
  const times = (n: number) => (n === 1 ? "once" : `${n} times`);
  const causes = [
    ...new Set(sent.flatMap(({ run }) => (causeOf(run) ? [causeOf(run)!.label] : []))),
  ];
  const daysBelow = below.filter(Boolean).length;
  // Each back-test day for a Tracker: alerting (confirmed), below but not confirmed, or clear.
  const fmt = (v: number) => (format === "percent" ? `${v.toFixed(1)}%` : formatNumber(v));
  const alerting = nOfM(below, need!, of!);
  const days_ = labels.map((day, i) => ({
    label: day,
    status: alerting[i] ? ("bad" as const) : below[i] ? ("warn" as const) : ("good" as const),
    value: `${fmt(actual[i]!)} against a usual ${fmt(usual[i]!)}`,
    detail: alerting[i] ? "Alerting" : below[i] ? "Below the line, not confirmed" : "Clear",
  }));
  const rule = `Fires ${of === 1 ? "on any day" : `when ${need} of ${of} days are`} more than ${drop}% under the same weekday's usual${quiet ? "; weekend alerts wait for Monday" : ""}`;
  return {
    labels,
    actual: actual.map((v) => round(v, digits)),
    threshold: line.map((v) => round(v, digits)),
    format,
    events,
    days: days_,
    fired: sent.length,
    rule,
    summary: sent.length
      ? `Would have fired ${times(sent.length)} in ${days} days (${daysBelow} days below the line)${held ? `, ${held} held to Monday` : ""}.${noisy ? ` ${noisy === events.length ? (events.length === 1 ? "It came" : "All came") : `${noisy} came`} during ${causes.join(" and ")}, not a real drop.` : ""}${sent.length > days / 15 ? " Too noisy: confirm over more days or raise the drop." : ""}`
      : `Would not have fired in ${days} days${daysBelow ? ` (${daysBelow} days below the line, never enough to confirm)` : ""}. A smaller drop catches more.`,
  };
}
