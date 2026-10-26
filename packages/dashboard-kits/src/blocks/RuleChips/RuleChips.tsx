export interface RuleChipsProps {
  rules: string[];
}

/** How a dashboard's numbers are counted, one rule per chip, so nobody has to guess. */
export function RuleChips({ rules }: RuleChipsProps) {
  return (
    <div className="kit-rules">
      <span className="kit-rules__lead">Counted as</span>
      <ul className="kit-rules__list">
        {rules.map((rule) => (
          <li key={rule} className="kit-rules__chip">
            {rule}
          </li>
        ))}
      </ul>
    </div>
  );
}
