import { Database, Share2 } from "lucide-react";
import styles from "./LaunchIllustrations.module.css";

export function SharingIllustration() {
  return (
    <div className={styles.panel} aria-hidden="true">
      <div className={styles.title}>
        <Share2 /> Share a dashboard
      </div>
      <pre className={styles.code}>
        <code>{`await openui.artifacts.share(id, {
  type: "group",
  id: "team:sales",
  access: "view",
});`}</code>
      </pre>
    </div>
  );
}

export function SourcesIllustration() {
  return (
    <div className={styles.panel} aria-hidden="true">
      <div className={styles.title}>
        <Database /> Sources
      </div>
      <dl className={styles.sources}>
        <div>
          <dt>Metric</dt>
          <dd>Net revenue</dd>
        </div>
        <div>
          <dt>Data tools</dt>
          <dd>
            <code>get_orders</code> and <code>get_refunds</code>
          </dd>
        </div>
        <div>
          <dt>Calculation</dt>
          <dd>Order total less refunds</dd>
        </div>
      </dl>
    </div>
  );
}
