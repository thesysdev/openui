// Finding the aha moment: for each early behaviour, done at least k times
// within w days of signup, how well does it separate users who were still
// active in week 4 from those who were not? A behaviour is scored on the
// 2×2 table of did / didn't against retained / not retained:
//
//   a = did and retained      b = did, not retained
//   c = didn't, retained      d = didn't, not retained
//   precision = a ÷ (a + b)   recall = a ÷ (a + c)   reach = (a + b) ÷ n
//   phi = (a·d − b·c) ÷ √((a + b)(c + d)(a + c)(b + d))
//
// Candidates reaching under 5% or over 90% of users are left out: too rare to
// act on, or too common to tell anyone apart. The knee is the smallest count
// after which one more repetition adds under 2 points of retention (our rule).

export interface Table {
  a: number;
  b: number;
  c: number;
  d: number;
}

export interface Scores {
  reach: number;
  precision: number;
  recall: number;
  phi: number;
}

export function score({ a, b, c, d }: Table): Scores {
  const n = a + b + c + d || 1;
  const denominator = Math.sqrt((a + b) * (c + d) * (a + c) * (b + d));
  return {
    reach: (a + b) / n,
    precision: a + b ? a / (a + b) : 0,
    recall: a + c ? a / (a + c) : 0,
    phi: denominator ? (a * d - b * c) / denominator : 0,
  };
}

/**
 * The 2×2 table for a behaviour when users fall into two latent groups (those
 * who reached the real aha moment and those who did not), each with its own
 * chance of doing the behaviour and of being retained, and the behaviour
 * tells nothing more about retention than the group does.
 */
export function tableFor(
  n: number,
  share: number,
  did: { activated: number; rest: number },
  retained: { activated: number; rest: number },
): Table {
  const groups = [
    { size: n * share, did: did.activated, kept: retained.activated },
    { size: n * (1 - share), did: did.rest, kept: retained.rest },
  ];
  const t = { a: 0, b: 0, c: 0, d: 0 };
  for (const g of groups) {
    t.a += g.size * g.did * g.kept;
    t.b += g.size * g.did * (1 - g.kept);
    t.c += g.size * (1 - g.did) * g.kept;
    t.d += g.size * (1 - g.did) * (1 - g.kept);
  }
  return t;
}

export const MIN_REACH = 0.05;
export const MAX_REACH = 0.9;
/** One more repetition adding less than this much retention (0–1) marks the knee. */
export const KNEE_GAIN = 0.02;

/** The smallest count after which one more adds under 2 points of retention. */
export function knee(retentionByCount: number[]): number {
  for (let k = 0; k < retentionByCount.length - 1; k++) {
    if (retentionByCount[k + 1]! - retentionByCount[k]! < KNEE_GAIN) return k + 1;
  }
  return retentionByCount.length;
}
