// Loading and empty states for every kit component. While the dashboard streams
// in or a Query runs, a component shows a skeleton shaped like itself, so the
// page keeps its layout. Only once loading has settled does an empty result
// show a message instead.

export type SkeletonKind =
  "hero" | "trend" | "columns" | "list" | "share" | "tiles" | "table" | "funnel" | "grid" | "cards";

/** Fixed bar heights and widths, so skeletons look like data but never jump. */
const HEIGHTS = [52, 64, 48, 70, 58, 76, 62, 84, 66, 72, 54, 80, 68, 60, 74, 88, 70, 64];
const WIDTHS = [92, 74, 61, 48, 39, 30, 24, 18];

function Block({ w, h, r }: { w?: number | string; h?: number; r?: number }) {
  return <span className="kit-skel__block" style={{ width: w, height: h, borderRadius: r }} />;
}

function TrendSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="kit-skel__plot" style={{ height }}>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="kit-skel__grid" style={{ top: `${8 + i * 26}%` }} />
      ))}
      <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="kit-skel__wave">
        <path d="M0,62 C40,58 60,48 100,52 S160,66 200,50 S260,30 300,40 S360,52 400,34 V100 H0 Z" />
      </svg>
    </div>
  );
}

export function Skeleton({ kind, rows = 5 }: { kind: SkeletonKind; rows?: number }) {
  const lines = Array.from({ length: rows }, (_, i) => i);
  let body;
  switch (kind) {
    case "hero":
      body = (
        <>
          <Block w={120} h={12} />
          <Block w={240} h={46} r={10} />
          <Block w={200} h={12} />
          <TrendSkeleton height={240} />
        </>
      );
      break;
    case "trend":
      body = <TrendSkeleton />;
      break;
    case "columns":
      body = (
        <div className="kit-skel__columns">
          {HEIGHTS.map((h, i) => (
            <span key={i} className="kit-skel__block" style={{ height: `${h}%` }} />
          ))}
        </div>
      );
      break;
    case "list":
    case "share":
      body = (
        <>
          {kind === "share" && (
            <>
              <Block w={110} h={26} r={8} />
              <Block w="100%" h={10} r={999} />
            </>
          )}
          {lines.map((i) => (
            <div key={i} className="kit-skel__row">
              <Block w={`${WIDTHS[i % WIDTHS.length]}%`} h={kind === "share" ? 12 : 28} r={6} />
              <Block w={56} h={12} />
            </div>
          ))}
        </>
      );
      break;
    case "tiles":
      body = (
        <div className="kit-skel__tiles">
          {lines.map((i) => (
            <div key={i} className="kit-skel__tile">
              <Block w="60%" h={11} />
              <Block w="70%" h={26} r={8} />
              <Block w="45%" h={14} r={999} />
              <Block w="100%" h={30} r={6} />
            </div>
          ))}
        </div>
      );
      break;
    case "table":
      body = (
        <>
          <div className="kit-skel__row">
            <Block w="22%" h={10} />
            <Block w="12%" h={10} />
          </div>
          {lines.map((i) => (
            <div key={i} className="kit-skel__row kit-skel__row--table">
              <Block w={28} h={28} r={8} />
              <Block w={`${30 + ((i * 17) % 25)}%`} h={12} />
              <Block w="14%" h={12} />
              <Block w="10%" h={12} />
            </div>
          ))}
        </>
      );
      break;
    case "funnel":
      body = lines.map((i) => (
        <div key={i} className="kit-skel__row">
          <Block w={110} h={14} />
          <Block w={`${Math.max(8, 100 - i * 22)}%`} h={22} r={6} />
        </div>
      ));
      break;
    case "grid":
      body = (
        <div className="kit-skel__grid-cells">
          {lines.map((r) => (
            <div key={r} className="kit-skel__cells">
              {Array.from({ length: 8 }, (_, c) => (
                <span
                  key={c}
                  className="kit-skel__block"
                  style={{ opacity: c < 8 - r ? 1 - c * 0.08 : 0 }}
                />
              ))}
            </div>
          ))}
        </div>
      );
      break;
    case "cards":
      body = lines.map((i) => (
        <div key={i} className="kit-skel__card">
          <Block w={30} h={30} r={8} />
          <div className="kit-skel__stack">
            <Block w="40%" h={10} />
            <Block w="80%" h={14} />
            <Block w="95%" h={10} />
          </div>
        </div>
      ));
      break;
  }
  return (
    <div className={`kit-skel kit-skel--${kind}`} role="status" aria-label="Loading">
      {body}
    </div>
  );
}

export function EmptyState({ message = "No data for this period." }: { message?: string }) {
  return (
    <p className="kit-empty kit-empty--state">
      <svg viewBox="0 0 16 16" aria-hidden>
        <path d="M2.5 11.5h11M4 9l2.5-3 2.5 2 3-4" />
      </svg>
      {message}
    </p>
  );
}
