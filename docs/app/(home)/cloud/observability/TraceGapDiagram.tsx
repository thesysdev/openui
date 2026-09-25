/* ssr entry: this stays a server component, so the icons cannot come from the
   main entry, which ships client code. */
import { Check, X } from "@phosphor-icons/react/dist/ssr";
import styles from "./TraceGapDiagram.module.css";

/* Kept as pairs rather than two independent lists: each line sits opposite the
   one it answers, and the cards give their rows equal heights so the pairing
   survives the split. Editing one side means editing its partner.

   The broadest pair, what the agent did against what the user experienced, is
   not in here: it sits in the two headings as their second line, where it
   states the contrast the rest of the rows then work through. */
const ROWS = [
  { trace: "The request succeeded", outcome: "Did the user get what they needed?" },
  { trace: "No errors occurred", outcome: "Did the experience actually work?" },
  { trace: "The model and tools worked", outcome: "Why did the user retry or leave?" },
  { trace: "The system behaved as expected", outcome: "What needs to improve for the user?" },
];

export function TraceGapDiagram() {
  return (
    <figure
      className={styles.diagram}
      aria-label="What traces record compared with what users experience"
    >
      <div className={styles.half}>
        <p className={styles.eyebrow}>Execution : Successful</p>
        <h3 className={styles.heading}>
          Traces can tell you
          <span className={styles.headingGloss}>What the agent did</span>
        </h3>
        <ul className={styles.list}>
          {ROWS.map(({ trace }) => (
            <li key={trace}>
              {/* The heading already says which side of the argument this is, so
                  the mark repeats it for the eye only. */}
              <span aria-hidden="true" className={`${styles.mark} ${styles.markPass}`}>
                <Check size={13} weight="bold" />
              </span>
              {trace}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.half}>
        <p className={styles.eyebrow}>Outcome : Failed</p>
        <h3 className={styles.heading}>
          But traces can’t tell you
          <span className={styles.headingGloss}>What the user experienced</span>
        </h3>
        <ul className={styles.list}>
          {ROWS.map(({ outcome }) => (
            <li key={outcome}>
              <span aria-hidden="true" className={`${styles.mark} ${styles.markFail}`}>
                <X size={13} weight="bold" />
              </span>
              {outcome}
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}
