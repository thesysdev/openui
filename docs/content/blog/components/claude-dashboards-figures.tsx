import styles from "./claude-dashboards.module.css";

const BUILD_STEPS = [
  {
    time: "0:00",
    title: "Reads the instructions",
    tools: ["list_types", "describe_type"],
    note: "The Dashboard type's instructions, plus 2 of its 14 reference files.",
  },
  {
    time: "~0:20",
    title: "Creates the dashboard and attaches the data",
    tools: ["create_from_type", "upload_asset"],
    note: "The side panel opens, empty. The pasted numbers become a 147-byte CSV.",
    key: true,
  },
  {
    time: "",
    title: "Writes the page in its sandbox",
    tools: [],
    note: "About a minute for 12 KB of HTML and JavaScript. Nothing renders yet.",
  },
  {
    time: "~2:45",
    title: "Writes every document at once",
    tools: ["db_write"],
    note: "3 documents, 13,226 bytes. The dashboard is on screen about 3 seconds after approval.",
    key: true,
  },
  {
    time: "",
    title: "Reads the check",
    tools: ["db_get"],
    note: "Later edits, like the Total signups tile, are db_str_replace patches.",
  },
];

export function BuildTimeline() {
  return (
    <figure
      className={`${styles.card} not-prose`}
      aria-label="Timeline of the signups build. Claude reads the instructions, creates the dashboard and attaches the CSV at about 20 seconds, writes the page for about a minute, writes all three documents at about 2 minutes 45 seconds, and the dashboard appears about 3 seconds later. Claude then reads the check."
    >
      <p className={styles.eyebrow}>Build time</p>
      <p className={styles.title}>The signups build, turn 1</p>

      <ol className={styles.timeline}>
        {BUILD_STEPS.map((step) => (
          <li key={step.title} className={styles.step} data-key={step.key ? "true" : undefined}>
            <span className={styles.time}>{step.time}</span>
            <div className={styles.stepBody}>
              <div className={styles.stepTitle}>{step.title}</div>
              {step.tools.length > 0 && (
                <div className={styles.stepTools}>
                  {step.tools.map((tool) => (
                    <span key={tool} className={styles.attr}>
                      {tool}
                    </span>
                  ))}
                </div>
              )}
              <div className={styles.stepNote}>{step.note}</div>
            </div>
          </li>
        ))}
      </ol>

      <p className={styles.footnote}>
        Times are approximate, from screenshots taken every 6 to 10 seconds.
      </p>
    </figure>
  );
}
