import {
  ArrowUp,
  BriefcaseBusiness,
  Check,
  CircleDollarSign,
  Database,
  Filter,
  Megaphone,
  PanelRightClose,
  Plus,
  Repeat,
} from "lucide-react";
import type { CSSProperties } from "react";
import styles from "./OpenDashboardsApp.module.css";

/* The OpenDashboards hero, rebuilt here so the tile shows the whole app and
   not the board alone: the sidebar, the open dashboard, and the Build thread
   that asked for it. The board itself is the capture opendashboards.com
   serves; everything around it is drawn. Laid out at the hero's own pixel
   size (1434 x 789) and scaled by whatever holds it. */

export const OPENDASHBOARDS_APP = { width: 1434, height: 789 };

const NAV = [
  { label: "Revenue", Icon: CircleDollarSign },
  { label: "Sales", Icon: BriefcaseBusiness },
  { label: "Marketing", Icon: Megaphone },
  { label: "Conversion", Icon: Filter },
  { label: "Retention", Icon: Repeat },
];

/* When the i-th source lands, in the top bar and in the thread. The whole
   run is short: the tile replays it every time the pointer arrives. */
const sourceAt = (i: number) => `${(0.12 + i * 0.08).toFixed(2)}s`;

/* Each source's mark, white on its own colour, as the app draws it. */
const SOURCES = [
  { name: "Stripe", mask: "url(/brand-icons/stripe.svg)", color: "#635bff" },
  { name: "PostgreSQL", mask: "url(/brand-icons/postgresql.png)", color: "#2f6feb" },
];

function SourceMark({ source }: { source: (typeof SOURCES)[number] }) {
  return (
    <span className={styles.mark} style={{ background: source.color }}>
      <i style={{ "--mask": source.mask } as CSSProperties} />
    </span>
  );
}

export function OpenDashboardsApp() {
  return (
    <div className={styles.app}>
      <div className={styles.sidebar}>
        <span className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/shiro-logo.svg" alt="" width={28} height={28} />
          OpenDashboards
        </span>
        <span className={styles.new}>
          <Plus strokeWidth={2.75} />
          New
        </span>
        {NAV.map(({ label, Icon }) => (
          <span
            key={label}
            className={`${styles.nav} ${label === "Revenue" ? styles.navOn : ""}`.trim()}
          >
            <Icon />
            {label}
          </span>
        ))}
        <span className={styles.sidebarFoot}>
          <span className={styles.nav}>
            <Database />
            Data connections
          </span>
        </span>
      </div>

      <div className={styles.main}>
        <div className={styles.sourceBar}>
          {SOURCES.map((source, i) => (
            <span
              key={source.name}
              className={styles.chip}
              style={{ "--d": sourceAt(i) } as CSSProperties}
            >
              <SourceMark source={source} />
              {source.name}
            </span>
          ))}
          <span className={styles.addSource}>
            <Plus />
            Add data source
          </span>
        </div>
        <div className={styles.boardClip}>
          {/* The revenue board as opendashboards.com serves it. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.board}
            src="/dashboards/opendashboards-revenue.png"
            alt="The revenue dashboard OpenDashboards builds from Stripe and Postgres: MRR, net new MRR, net revenue retention and logo churn, where revenue comes from, and MRR by plan and by month."
            width={1900}
            height={2856}
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <div className={styles.thread}>
        <span className={styles.threadHead}>
          <span className={styles.collapse}>
            <PanelRightClose />
          </span>
        </span>
        <div className={styles.turns}>
          <span className={styles.ask}>How was revenue this month?</span>
          <span className={styles.reads}>
            {SOURCES.map((source, i) => (
              <span
                key={source.name}
                className={styles.read}
                style={{ "--d": sourceAt(i) } as CSSProperties}
              >
                <SourceMark source={source} />
                Read {source.name}
                <Check className={styles.tick} />
              </span>
            ))}
          </span>
          <span className={styles.reply}>
            MRR grew $14.4K. New business and expansion more than covered churn.
          </span>
        </div>
        <span className={styles.composer}>
          Ask anything…
          <i>
            <ArrowUp />
          </i>
        </span>
      </div>
    </div>
  );
}
