"use client";

// ReconciliationCard: store orders against ad-platform claims, per platform.

import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { Pending } from "../../blocks/Pending/Pending.definition";
import { formatCurrency } from "../../core/format";
import { passed } from "../../core/schemas";

interface PlatformClaim {
  platform: string;
  spend: number;
  storeRevenue: number;
  claimedRevenue: number;
  storeRoas: number;
  claimedRoas: number;
}

export const ReconciliationCard = defineComponent({
  name: "ReconciliationCard",
  description:
    "Store orders against ad-platform claims, per platform, with ROAS both ways and a summary: ReconciliationCard(recon).",
  props: z.object({
    recon: passed("get_reconciliation's result, passed whole"),
  }),
  component: ({ props }) => {
    const recon = props.recon as unknown as
      | { platforms: PlatformClaim[]; summary: string; storeTotal: number; claimedTotal: number }
      | undefined;
    const platforms = recon?.platforms ?? [];
    if (platforms.length === 0) return <Pending kind="list" rows={3} />;
    const max = Math.max(1, ...platforms.map((p) => Math.max(p.claimedRevenue, p.storeRevenue)));
    return (
      <div className="kit-recon">
        <ul className="kit-recon__list">
          {platforms.map((p) => (
            <li key={p.platform} className="kit-recon__row">
              <span className="kit-recon__name">{p.platform}</span>
              <span className="kit-recon__bars" aria-hidden>
                <span
                  className="kit-recon__claimed"
                  style={{ width: `${(p.claimedRevenue / max) * 100}%` }}
                />
                <span
                  className="kit-recon__store"
                  style={{ width: `${(p.storeRevenue / max) * 100}%` }}
                />
              </span>
              <span className="kit-recon__figures">
                <span>
                  <strong>{formatCurrency(p.storeRevenue)}</strong>
                  <span className="kit-muted"> store · </span>
                  {formatCurrency(p.claimedRevenue)}
                  <span className="kit-muted"> claimed</span>
                </span>
                <span className="kit-muted">
                  ROAS {p.storeRoas.toFixed(2)}x store · {p.claimedRoas.toFixed(2)}x claimed ·{" "}
                  {(p.claimedRevenue / p.storeRevenue).toFixed(2)}×
                </span>
              </span>
            </li>
          ))}
        </ul>
        <div className="kit-recon__legend" aria-hidden>
          <span>
            <i className="kit-recon__key kit-recon__key--store" /> Store orders
          </span>
          <span>
            <i className="kit-recon__key kit-recon__key--claimed" /> Platform claims
          </span>
        </div>
        <p className="kit-recon__summary">{recon?.summary}</p>
      </div>
    );
  },
});
