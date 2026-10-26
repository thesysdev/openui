"use client";

// EventTable: the top tracked events with volume, users, and change.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { ScrollRegion } from "../../../components/ScrollRegion";
import { formatChange, formatNumber } from "../../../core/format";
import { passed } from "../../../core/schemas";
import { Pending } from "../../../library/Pending";
import type { TrackedEvent } from "./shared";

export const EventTable = defineComponent({
  name: "EventTable",
  description:
    "Top tracked events as a table: event name, volume with a bar against the largest, unique users, events per user, and change against the prior period.",
  props: z.object({
    events: z.array(passed("An event from get_top_events")).default([]),
  }),
  component: ({ props }) => {
    const events = (props.events ?? []) as unknown as TrackedEvent[];
    if (events.length === 0) return <Pending kind="table" rows={8} />;
    const max = Math.max(1, ...events.map((e) => e.count));
    return (
      <ScrollRegion label="Events table">
        <table className="kit-table kit-events">
          <thead>
            <tr>
              <th>Event</th>
              <th className="kit-num">Events</th>
              <th aria-hidden />
              <th className="kit-num">Users</th>
              <th className="kit-num">Per user</th>
              <th className="kit-num">Change</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.name}>
                <td>
                  <code className="kit-step">{e.name}</code>
                </td>
                <td className="kit-num kit-cell-title">{formatNumber(e.count)}</td>
                <td className="kit-events__bar">
                  <span className="kit-meter">
                    <span
                      className="kit-meter__fill"
                      style={{ width: `${(e.count / max) * 100}%` }}
                    />
                  </span>
                </td>
                <td className="kit-num">{formatNumber(e.users)}</td>
                <td className="kit-num">{e.perUser.toFixed(1)}</td>
                <td className={`kit-num kit-text-${e.change >= 0 ? "good" : "bad"}`}>
                  {formatChange(e.change)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
    );
  },
});
