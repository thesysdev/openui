import {
  ArrowRight,
  ChartLine,
  Check,
  Code,
  ShieldCheck,
  Wrench,
  X,
} from "@phosphor-icons/react/dist/ssr";
import styles from "./GatewayDiagram.module.css";

function StateIcon({ ok }: { ok: boolean }) {
  return (
    <span className={ok ? styles.okIcon : styles.errorIcon} aria-hidden="true">
      {ok ? <Check size={12} weight="bold" /> : <X size={12} weight="bold" />}
    </span>
  );
}

export function GatewayDiagram() {
  return (
    <div
      className={styles.stage}
      role="img"
      aria-label="Gateway detects an invalid series reference in a streaming chart component, repairs only that chunk, and lets the valid interface continue rendering."
    >
      <div className={styles.streamColumn}>
        <div className={styles.columnLabel}>
          <Code size={18} weight="light" />
          <span>Model stream</span>
        </div>
        <div className={styles.codeWindow}>
          <div className={styles.windowDots} aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <code>&lt;Dashboard&gt;</code>
          <code>&nbsp;&nbsp;&lt;Metric value=&quot;$2.15M&quot; /&gt;</code>
          <code className={styles.invalidLine}>
            &nbsp;&nbsp;&lt;LineChart series=&quot;revenue&quot; /&gt;
          </code>
          <code>&nbsp;&nbsp;&lt;Select action=&quot;filter&quot; /&gt;</code>
          <code>&lt;/Dashboard&gt;</code>
        </div>
        <span className={styles.failureLabel}>
          <StateIcon ok={false} />
          Invalid reference
        </span>
      </div>

      <span className={styles.flowArrow} aria-hidden="true">
        <ArrowRight size={18} weight="bold" />
      </span>

      <div className={styles.gatewayColumn}>
        <div className={styles.gatewayHeader}>
          <span className={styles.gatewayMark}>O</span>
          <span>
            <strong>OpenUI Gateway</strong>
            <small>Checks each streamed node</small>
          </span>
          <ShieldCheck size={20} weight="light" />
        </div>
        <div className={styles.checkList}>
          <span>
            <StateIcon ok />
            <b>Component exists</b>
          </span>
          <span>
            <StateIcon ok={false} />
            <b>Reference resolves</b>
          </span>
          <span>
            <StateIcon ok />
            <b>Arguments match</b>
          </span>
        </div>
        <div className={styles.patch}>
          <div className={styles.patchLabel}>
            <Wrench size={16} weight="light" />
            Repair only the invalid chunk
          </div>
          <code>
            <del>series=&quot;revenue&quot;</del>
          </code>
          <code>
            <ins>series=&#123;revenue&#125;</ins>
          </code>
        </div>
      </div>

      <span className={styles.flowArrow} aria-hidden="true">
        <ArrowRight size={18} weight="bold" />
      </span>

      <div className={styles.resultColumn}>
        <div className={styles.columnLabel}>
          <ChartLine size={18} weight="light" />
          <span>Interface keeps rendering</span>
        </div>
        <div className={styles.resultWindow}>
          <div className={styles.metric}>
            <small>Revenue</small>
            <strong>$2.15M</strong>
          </div>
          <div className={styles.chart} aria-hidden="true">
            <span />
            <svg viewBox="0 0 280 100" preserveAspectRatio="none">
              <path d="M0 76 C42 68 55 43 94 50 S146 72 180 45 S235 37 280 16" />
            </svg>
          </div>
          <div className={styles.filterRow}>
            <span>Region</span>
            <b>All regions</b>
          </div>
        </div>
        <span className={styles.successLabel}>
          <StateIcon ok />
          Valid UI delivered
        </span>
      </div>

      <div className={styles.timeline} aria-hidden="true">
        <span>
          <i />
          Stream starts
        </span>
        <span className={styles.repairMoment}>
          <i />
          Invalid chunk repaired
        </span>
        <span>
          <i />
          Stream continues
        </span>
      </div>
    </div>
  );
}
