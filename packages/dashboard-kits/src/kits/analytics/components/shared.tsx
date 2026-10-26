// Prop types shared by the analytics components, inferred from the tool schemas.
//
// Props reuse the tool schemas, so a Query result plugs in without reshaping:
// LifecycleChart(life.labels, life.newUsers, life.returning, life.resurrecting, life.dormant, life.quickRatio).

import { z } from "zod/v4";
import type {
  accountSchema,
  commitSchema,
  experimentSchema,
  featureSchema,
  pathSchema,
  paywallSchema,
  reviewMetricSchema,
  trackedEventSchema,
} from "../tools";

export type Feature = z.infer<typeof featureSchema>;
export type TrackedEvent = z.infer<typeof trackedEventSchema>;
export type UserPath = z.infer<typeof pathSchema>;
export type Experiment = z.infer<typeof experimentSchema>;
export type Account = z.infer<typeof accountSchema>;
export type Paywall = z.infer<typeof paywallSchema>;
export type Commit = z.infer<typeof commitSchema>;
export type ReviewMetric = z.infer<typeof reviewMetricSchema>;
