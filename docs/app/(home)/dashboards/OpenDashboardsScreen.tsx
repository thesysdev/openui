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
import styles from "./OpenDashboardsScreen.module.css";

/* The Open Dashboards app, drawn rather than captured so it follows the site
   theme: sidebar, the Revenue board, and the chat that asked for it. One SVG
   at a fixed 1200 x 760 canvas, scaled by whatever holds it. Every colour is a
   class in the module, so dark mode is a variable swap. */

const W = 1200;
const H = 760;
const SIDEBAR = 200;
const CHAT = 960;

const NAV = [
  { label: "Revenue", Icon: CircleDollarSign },
  { label: "Sales", Icon: BriefcaseBusiness },
  { label: "Marketing", Icon: Megaphone },
  { label: "Conversion", Icon: Filter },
  { label: "Retention", Icon: Repeat },
];

const KPIS = [
  { label: "MRR", value: "$412.6K", delta: "+3.6%", base: "vs $398.2K" },
  { label: "Net new MRR", value: "$14.4K", delta: "+28.6%", base: "vs $11.2K" },
  { label: "Net revenue retention", value: "112.4%", delta: "+2.6 pts", base: "vs 109.8%" },
  { label: "Logo churn", value: "1.8%", delta: "-0.5 pts", base: "vs 2.3%" },
];

/* Shares add to 100; the gauge and the legend read from the same rows. */
const PLANS = [
  { name: "Enterprise", share: 40.8, value: "$168.4K", tone: styles.s1 },
  { name: "Business", share: 29.4, value: "$121.3K", tone: styles.s2 },
  { name: "Team", share: 20.5, value: "$84.6K", tone: styles.s3 },
  { name: "Starter", share: 9.3, value: "$38.3K", tone: styles.s4 },
];

/* MRR by month, in $K, ending on November's $412.6K. */
const MONTHS = [302, 309, 317, 324, 332, 341, 350, 360, 371, 384, 398, 412.6];

/* A point on the gauge: t runs 0 (left) to 1 (right) over the top. */
function gaugePoint(cx: number, cy: number, r: number, t: number) {
  const a = Math.PI * (1 - t);
  return [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const;
}

function gaugeArcs(cx: number, cy: number, r: number, gap = 0.018) {
  let start = 0;
  return PLANS.map((plan) => {
    const end = start + plan.share / 100;
    const [x0, y0] = gaugePoint(cx, cy, r, start + (start === 0 ? 0 : gap / 2));
    const [x1, y1] = gaugePoint(cx, cy, r, end - (end >= 0.999 ? 0 : gap / 2));
    start = end;
    return { tone: plan.tone, d: `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}` };
  });
}

/* `visibleHeight` crops the canvas from below, so a holder can let the window
   run off its bottom edge. */
export function OpenDashboardsScreen({
  className = "",
  visibleHeight = H,
}: {
  className?: string;
  visibleHeight?: number;
}) {
  /* Board column */
  const left = 240;
  const right = CHAT - 40;
  const kpiW = (right - left) / KPIS.length;

  /* Chart cards */
  const cardTop = 298;
  const cardBottom = 612;
  const cardGap = 12;
  const cardW = (right - left - cardGap) / 2;
  const plotLeft = left + cardW + cardGap + 52;
  const plotRight = right - 24;
  const plotTop = 380;
  const plotBottom = 584;
  const yFor = (k: number) => plotBottom - (k / 600) * (plotBottom - plotTop);
  const slot = (plotRight - plotLeft) / MONTHS.length;

  const gaugeCx = left + cardW / 2;
  const gaugeCy = 460;

  return (
    <svg
      viewBox={`0 0 ${W} ${visibleHeight}`}
      className={`${styles.screen} ${className}`}
      role="img"
      aria-label="Open Dashboards showing a revenue dashboard built from Stripe and PostgreSQL, with the chat that asked for it"
    >
      <defs>
        <clipPath id="od-window">
          <rect width={W} height={H} rx={16} />
        </clipPath>
      </defs>

      <g clipPath="url(#od-window)">
        <rect width={W} height={H} className={styles.surface} />

        {/* Sidebar */}
        <rect width={SIDEBAR} height={H} className={styles.sunk} />
        <line x1={SIDEBAR} y1={0} x2={SIDEBAR} y2={H} className={styles.line} />
        <image
          href="/shiro-logo.svg"
          x={16}
          y={19}
          width={24}
          height={20}
          className={styles.logo}
        />
        <text x={46} y={34} className={`${styles.text} ${styles.brand}`}>
          OpenDashboards
        </text>
        <rect x={14} y={56} width={172} height={32} rx={8} className={styles.button} />
        <Plus x={74} y={65} width={14} height={14} className={styles.icon} />
        <text x={92} y={76} className={`${styles.text} ${styles.small}`}>
          New
        </text>
        {NAV.map(({ label, Icon }, i) => {
          const y = 104 + i * 36;
          return (
            <g key={label}>
              {i === 0 && (
                <rect x={10} y={y} width={180} height={32} rx={8} className={styles.fill} />
              )}
              <Icon
                x={22}
                y={y + 9}
                width={14}
                height={14}
                className={i === 0 ? styles.icon : styles.iconMuted}
              />
              <text
                x={46}
                y={y + 21}
                className={`${styles.small} ${i === 0 ? styles.text : styles.muted}`}
              >
                {label}
              </text>
            </g>
          );
        })}

        {/* Sources */}
        <rect x={216} y={14} width={78} height={28} rx={14} className={styles.chip} />
        <circle cx={232} cy={28} r={9} className={styles.stripe} />
        <text x={232} y={32} textAnchor="middle" className={styles.markText}>
          S
        </text>
        <text x={247} y={32} className={`${styles.text} ${styles.small}`}>
          Stripe
        </text>
        <rect x={302} y={14} width={110} height={28} rx={14} className={styles.chip} />
        <circle cx={318} cy={28} r={9} className={styles.postgres} />
        <Database x={313} y={23} width={10} height={10} className={styles.markIcon} />
        <text x={333} y={32} className={`${styles.text} ${styles.small}`}>
          PostgreSQL
        </text>
        <Plus x={424} y={22} width={12} height={12} className={styles.iconMuted} />
        <text x={440} y={32} className={`${styles.muted} ${styles.small}`}>
          Add data source
        </text>

        {/* Board */}
        <text x={left} y={104} className={`${styles.text} ${styles.title}`}>
          Revenue
        </text>
        <text x={left} y={128} className={`${styles.muted} ${styles.small}`}>
          November from Stripe and PostgreSQL
        </text>

        <rect x={left} y={148} width={right - left} height={92} rx={12} className={styles.card} />
        {KPIS.map((kpi, i) => {
          const x = left + i * kpiW + 20;
          return (
            <g key={kpi.label}>
              {i > 0 && (
                <line
                  x1={left + i * kpiW}
                  y1={162}
                  x2={left + i * kpiW}
                  y2={226}
                  className={styles.line}
                />
              )}
              <text x={x} y={172} className={`${styles.muted} ${styles.tiny}`}>
                {kpi.label}
              </text>
              <text x={x} y={202} className={`${styles.text} ${styles.value}`}>
                {kpi.value}
              </text>
              <text x={x} y={224} className={styles.tiny}>
                <tspan className={styles.up}>{kpi.delta}</tspan>
                <tspan className={styles.faint} dx={6}>
                  {kpi.base}
                </tspan>
              </text>
            </g>
          );
        })}

        <rect x={left} y={254} width={right - left} height={30} rx={8} className={styles.fill} />
        <text x={left + 14} y={274} className={`${styles.text} ${styles.label}`}>
          Where revenue comes from
        </text>

        {/* MRR by plan */}
        <rect
          x={left}
          y={cardTop}
          width={cardW}
          height={cardBottom - cardTop}
          rx={12}
          className={styles.card}
        />
        <text x={left + 20} y={cardTop + 28} className={`${styles.text} ${styles.label}`}>
          MRR by plan
        </text>
        <text x={left + 20} y={cardTop + 46} className={`${styles.muted} ${styles.tiny}`}>
          November · USD
        </text>
        {gaugeArcs(gaugeCx, gaugeCy, 92).map((arc) => (
          <path key={arc.d} d={arc.d} className={`${styles.arc} ${arc.tone}`} />
        ))}
        <text
          x={gaugeCx}
          y={gaugeCy - 8}
          textAnchor="middle"
          className={`${styles.text} ${styles.value}`}
        >
          $412.6K
        </text>
        <text
          x={gaugeCx}
          y={gaugeCy + 10}
          textAnchor="middle"
          className={`${styles.muted} ${styles.tiny}`}
        >
          MRR
        </text>
        {PLANS.map((plan, i) => {
          const y = 500 + i * 26;
          return (
            <g key={plan.name}>
              <rect x={left + 20} y={y - 8} width={8} height={8} rx={2} className={plan.tone} />
              <text x={left + 36} y={y} className={`${styles.muted} ${styles.tiny}`}>
                {plan.name}
              </text>
              <text
                x={left + cardW - 84}
                y={y}
                textAnchor="end"
                className={`${styles.faint} ${styles.tiny}`}
              >
                {plan.share}%
              </text>
              <text
                x={left + cardW - 20}
                y={y}
                textAnchor="end"
                className={`${styles.text} ${styles.tinyStrong}`}
              >
                {plan.value}
              </text>
            </g>
          );
        })}

        {/* MRR by month */}
        <rect
          x={left + cardW + cardGap}
          y={cardTop}
          width={cardW}
          height={cardBottom - cardTop}
          rx={12}
          className={styles.card}
        />
        <text
          x={left + cardW + cardGap + 20}
          y={cardTop + 28}
          className={`${styles.text} ${styles.label}`}
        >
          MRR by month
        </text>
        <text
          x={left + cardW + cardGap + 20}
          y={cardTop + 46}
          className={`${styles.muted} ${styles.tiny}`}
        >
          Last 12 months · USD thousands
        </text>
        <rect
          x={left + cardW + cardGap + 20}
          y={cardTop + 58}
          width={8}
          height={8}
          rx={2}
          className={styles.s1}
        />
        <text
          x={left + cardW + cardGap + 34}
          y={cardTop + 66}
          className={`${styles.muted} ${styles.tiny}`}
        >
          MRR
        </text>
        {[600, 450, 300, 150, 0].map((k) => (
          <g key={k}>
            <line x1={plotLeft} y1={yFor(k)} x2={plotRight} y2={yFor(k)} className={styles.grid} />
            <text
              x={plotLeft - 10}
              y={yFor(k) + 3}
              textAnchor="end"
              className={`${styles.faint} ${styles.tiny}`}
            >
              ${k}K
            </text>
          </g>
        ))}
        {MONTHS.map((k, i) => (
          <rect
            key={i}
            x={plotLeft + i * slot + (slot - 10) / 2}
            y={yFor(k)}
            width={10}
            height={plotBottom - yFor(k)}
            rx={2}
            className={styles.s1}
          />
        ))}

        {/* The next section, starting below the fold */}
        <rect x={left} y={630} width={right - left} height={30} rx={8} className={styles.fill} />
        <text x={left + 14} y={650} className={`${styles.text} ${styles.label}`}>
          How customers grow
        </text>
        {[
          { title: "Expansion by plan", sub: "Last 6 months · USD" },
          { title: "Churned MRR", sub: "Last 6 months · USD" },
        ].map((card, i) => {
          const x = left + i * (cardW + cardGap);
          return (
            <g key={card.title}>
              <rect x={x} y={674} width={cardW} height={140} rx={12} className={styles.card} />
              <text x={x + 20} y={702} className={`${styles.text} ${styles.label}`}>
                {card.title}
              </text>
              <text x={x + 20} y={720} className={`${styles.muted} ${styles.tiny}`}>
                {card.sub}
              </text>
            </g>
          );
        })}

        {/* Chat */}
        <line x1={CHAT} y1={0} x2={CHAT} y2={H} className={styles.line} />
        <rect x={976} y={14} width={28} height={28} rx={7} className={styles.fill} />
        <PanelRightClose x={983} y={21} width={14} height={14} className={styles.iconMuted} />
        <rect x={1010} y={62} width={174} height={50} rx={14} className={styles.fill} />
        <text x={1024} y={83} className={`${styles.text} ${styles.small}`}>
          How was revenue this
        </text>
        <text x={1024} y={100} className={`${styles.text} ${styles.small}`}>
          month?
        </text>
        {[
          { name: "Read Stripe", tone: styles.stripe, mark: "S" },
          { name: "Read PostgreSQL", tone: styles.postgres, mark: "" },
        ].map((step, i) => {
          const y = 136 + i * 22;
          return (
            <g key={step.name}>
              <circle cx={984} cy={y - 4} r={7} className={step.tone} />
              {step.mark ? (
                <text x={984} y={y - 1} textAnchor="middle" className={styles.markTextSmall}>
                  {step.mark}
                </text>
              ) : (
                <Database x={980} y={y - 8} width={8} height={8} className={styles.markIcon} />
              )}
              <text x={998} y={y} className={`${styles.muted} ${styles.tiny}`}>
                {step.name}
              </text>
              <Check
                x={i === 0 ? 1064 : 1095}
                y={y - 9}
                width={11}
                height={11}
                className={styles.check}
              />
            </g>
          );
        })}
        {["MRR grew $14.4K. New business", "and expansion more than", "covered churn."].map(
          (line, i) => (
            <text key={line} x={976} y={196 + i * 18} className={`${styles.text} ${styles.small}`}>
              {line}
            </text>
          ),
        )}
        <rect x={976} y={708} width={208} height={38} rx={19} className={styles.input} />
        <text x={992} y={731} className={`${styles.faint} ${styles.small}`}>
          Ask anything…
        </text>
        <circle cx={1165} cy={727} r={13} className={styles.send} />
        <ArrowUp x={1159} y={721} width={12} height={12} className={styles.sendIcon} />
      </g>

      <rect x={0.5} y={0.5} width={W - 1} height={H - 1} rx={16} className={styles.frame} />
    </svg>
  );
}
