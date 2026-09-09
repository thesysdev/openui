import { ArrowRight, EqualNot } from "lucide-react";
import Image from "next/image";
import agentLogo from "./assets/trace-agent.svg";
import failedStatus from "./assets/trace-fail.svg";
import passedStatus from "./assets/trace-pass.svg";
import userAvatar from "./assets/trace-user.png";
import styles from "./TraceGapDiagram.module.css";

const TRACE_STEPS = [
  { title: "Tool calls succeeded", description: "Every call completed" },
  { title: "The model responded", description: "No generation errors" },
  { title: "The request completed", description: "Response returned 200" },
];

const BLIND_SPOTS = [
  {
    title: "Did the user get what they needed?",
    description: "The trace looks successful even when the answer is useless",
  },
  {
    title: "What did the user actually experience?",
    description: "It records the response, not the UI they saw or how they used it",
  },
  {
    title: "What should we build next?",
    description: "Errors and latency don’t show what users tried to do but couldn’t",
  },
];

function StatusMark({ failed = false }: { failed?: boolean }) {
  return (
    <Image
      src={failed ? failedStatus : passedStatus}
      className={styles.statusIcon}
      width={24}
      height={24}
      alt={failed ? "Not captured" : "Passed"}
    />
  );
}

export function TraceGapDiagram() {
  return (
    <figure
      className={styles.diagram}
      aria-label="A successful trace does not mean a successful outcome"
    >
      <ol className={styles.conversation} aria-label="A conversation with an unmet user goal">
        <li className={styles.message} aria-label="User query">
          <div className={styles.avatar} aria-hidden="true">
            <Image src={userAvatar} width={40} height={40} alt="" />
          </div>
          <p className={styles.bubble}>
            Compare revenue by <strong>region.</strong>
          </p>
          <ArrowRight className={styles.arrow} size={20} strokeWidth={1.5} aria-hidden="true" />
        </li>
        <li className={styles.message} aria-label="Agent response">
          <div className={`${styles.avatar} ${styles.agentAvatar}`}>
            <Image src={agentLogo} width={24} height={24} alt="OpenUI" />
          </div>
          <p className={`${styles.bubble} ${styles.agentBubble}`}>Revenue is up 17% this month.</p>
          <ArrowRight className={styles.arrow} size={20} strokeWidth={1.5} aria-hidden="true" />
        </li>
        <li className={styles.message} aria-label="User follow-up">
          <div className={styles.avatar} aria-hidden="true">
            <Image src={userAvatar} width={40} height={40} alt="" />
          </div>
          <p className={`${styles.bubble} ${styles.failure}`}>
            But which <strong>region</strong> is driving it?
          </p>
        </li>
      </ol>
      <div className={styles.comparison} aria-label="Technical success compared with user failure">
        <div className={`${styles.panel} ${styles.tracePanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelLabel}>Execution</span>
              <h3>Tracing says everything worked</h3>
            </div>
            <span className={`${styles.resultBadge} ${styles.passedBadge}`}>All checks passed</span>
          </div>
          <ol className={styles.checklist} aria-label="Passed trace checks">
            {TRACE_STEPS.map((step) => (
              <li key={step.title}>
                <div className={styles.checkCopy}>
                  <span>{step.title}</span>
                  <p>{step.description}</p>
                </div>
                <StatusMark />
              </li>
            ))}
          </ol>
        </div>
        <div className={styles.notEqual} role="img" aria-label="does not mean">
          <EqualNot size={36} strokeWidth={1.5} aria-hidden="true" />
        </div>
        <div className={`${styles.panel} ${styles.outcomePanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelLabel}>User outcome</span>
              <h3>But tracing can’t tell you…</h3>
            </div>
            <span className={`${styles.resultBadge} ${styles.failedBadge}`}>Not captured</span>
          </div>
          <ul className={styles.checklist} aria-label="User outcomes not captured by trace status">
            {BLIND_SPOTS.map((point) => (
              <li key={point.title}>
                <div className={styles.checkCopy}>
                  <span>{point.title}</span>
                  <p>{point.description}</p>
                </div>
                <StatusMark failed />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </figure>
  );
}
