import type { Driver, Why } from "../../core/schemas";

export interface DriverCardsProps {
  why: Why;
  /** Show at most this many drivers (and this many offsetting ones). */
  limit?: number;
}

const LEVEL_TONE = { High: "strong", Medium: "medium", Low: "calm" } as const;

function DriverRow({ driver, against }: { driver: Driver; against: string }) {
  const width = Math.min(100, Math.abs(driver.share) * 100);
  return (
    <li className={`kit-driver kit-driver--${driver.tone}`}>
      <div className="kit-driver__name">
        <span className="kit-driver__dimension">{driver.dimension}</span>
        <span className="kit-driver__label">{driver.name}</span>
      </div>
      <div
        className="kit-driver__share"
        title={`${Math.round(Math.abs(driver.share) * 100)}% of the change`}
      >
        <span className="kit-driver__track">
          <span className="kit-driver__bar" style={{ width: `${width}%` }} />
        </span>
        <span className="kit-driver__pct">{Math.round(Math.abs(driver.share) * 100)}%</span>
      </div>
      <div className="kit-driver__figures">
        <span className={`kit-driver__delta kit-text-${driver.tone}`}>{driver.delta}</span>
        <span className="kit-driver__from">
          {driver.current} vs {driver.comparison} {against.toLowerCase()}
        </span>
      </div>
      {driver.detail && <span className="kit-driver__detail">{driver.detail}</span>}
    </li>
  );
}

/**
 * Why a metric moved, computed rather than guessed: the summary sentence, how
 * sure the numbers are (a change inside the normal range gets no drivers),
 * any tracking change behind it, then the drivers that pushed the metric with
 * their share of the change, and what pushed the other way.
 */
export function DriverCards({ why, limit = 4 }: DriverCardsProps) {
  const level = why.confidence.level;
  return (
    <div className="kit-why">
      <p className="kit-why__summary">{why.summary}</p>
      <div className="kit-why__meta">
        <span className={`kit-why__confidence kit-why__confidence--${LEVEL_TONE[level]}`}>
          {level} confidence
        </span>
        <span className="kit-why__note">{why.confidence.note}</span>
      </div>
      {why.drivers.length === 0 ? (
        <p className="kit-why__calm">
          {level === "Low"
            ? "Nothing stands out: the change is within what this metric usually does, so no driver is singled out."
            : "No single part moved enough to call out."}
        </p>
      ) : (
        <>
          <span className="kit-why__heading">Drove the change</span>
          <ul className="kit-why__list">
            {why.drivers.slice(0, limit).map((d) => (
              <DriverRow
                key={`${d.dimension}-${d.name}`}
                driver={d}
                against={why.comparisonLabel}
              />
            ))}
          </ul>
        </>
      )}
      {why.offsetting.length > 0 && (
        <>
          <span className="kit-why__heading">Pushed the other way</span>
          <ul className="kit-why__list kit-why__list--offsetting">
            {why.offsetting.slice(0, limit).map((d) => (
              <DriverRow
                key={`${d.dimension}-${d.name}`}
                driver={d}
                against={why.comparisonLabel}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
