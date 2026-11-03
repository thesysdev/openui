"use client";

import { CaretRight } from "@phosphor-icons/react";
import { ChevronDown, Database, Globe, MousePointer2, Plug, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import appless from "../appless/AppLessFeatures.module.css";
import { StackChip } from "../components/StackChip/StackChip";
import oui from "../oui-1/OuiFeatures.module.css";
import { STACK_ROWS } from "../sections/CompatibilitySection/CompatibilitySection";
import styles from "./FeatureIllustrations.module.css";

/* The dashboard feature cards, drawn in the OUI-1 and AppLess illustration
   language: the same device, cards, type and accent, with scenes that show
   what each point says. */

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const useReducedMotion = () =>
  useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );

/* ---------- Hundreds of models: AppLess "Keep exploring" ---------- */

const MODEL_ROWS = [0, 1, 2, 3, 5].map((i) => STACK_ROWS[0].items[i]);
const MODEL_IDS = [
  "openai/gpt-5",
  "anthropic/claude-sonnet-4.5",
  "google/gemini-2.5-pro",
  "deepseek/deepseek-chat",
  "mistralai/mistral-large",
];

export function ModelsIllustration() {
  return (
    /* One API on the left edge, and the models behind it running off the right. */
    <div className={`${appless.scene} ${appless.sceneSmall}`} aria-hidden="true">
      {/* The extra right padding centres the label in the part of the button
          the stage leaves visible. */}
      <span className={appless.searchButton} style={{ paddingRight: 19.5 }}>
        One API
      </span>
      <span className={appless.exploreLink}>
        {Array.from({ length: 7 }, (_, i) => (
          <CaretRight key={i} size={8} weight="bold" style={{ opacity: 0.25 + i * 0.1 }} />
        ))}
      </span>
      <div className={appless.hotelScreen}>
        <span className={appless.screenTitle}>Models</span>
        {MODEL_ROWS.map((model, i) => (
          <div key={model.name} className={appless.hotel}>
            <span
              style={{ "--stack-logo-size": "36px", "--stack-logo-glyph": "18px" } as CSSProperties}
            >
              <StackChip item={model} iconOnly />
            </span>
            <span>
              <b>{model.name}</b>
              <small style={{ fontFamily: "var(--home-font-mono)", fontSize: 11 }}>
                {MODEL_IDS[i]}
              </small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Interactive by default: filters that redraw the dashboard ---------- */

type Range = "7" | "30";
type Region = "all" | "europe";

/* Fourteen bars per view, in $k. Each filter state has its own data. */
const VIEWS: Record<`${Range}-${Region}`, number[]> = {
  "7-all": [4.2, 5.1, 4.8, 6.3, 7.4, 8.1, 5.6, 4.6, 5.4, 5.0, 6.8, 7.9, 8.8, 6.1],
  "30-all": [6.1, 6.6, 7.2, 6.9, 7.8, 8.4, 7.6, 8.1, 8.9, 8.2, 9.1, 9.6, 8.8, 9.3],
  "7-europe": [2.1, 2.6, 2.2, 3.4, 4.1, 4.6, 3.0, 2.4, 2.9, 2.7, 3.8, 4.4, 5.1, 3.3],
  "30-europe": [3.2, 3.6, 3.9, 3.5, 4.4, 4.9, 4.1, 4.6, 5.3, 4.8, 5.5, 5.9, 5.2, 5.7],
};
const AXIS_MAX = 10;
const KPIS: Record<`${Range}-${Region}`, [string, string, string]> = {
  "7-all": ["1,284", "312", "$68"],
  "30-all": ["5,410", "1,206", "$71"],
  "7-europe": ["462", "118", "$64"],
  "30-europe": ["1,978", "441", "$66"],
};
const RANGE_LABEL: Record<Range, string> = { "7": "Last 7 days", "30": "Last 30 days" };
const REGION_LABEL: Record<Region, string> = { all: "All regions", europe: "Europe" };
/* Where the cursor rests between clicks, in scene pixels. */
const REST = { x: 470, y: 250 };

function FilterChip({
  label,
  on,
  onClick,
  chipRef,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  chipRef: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={chipRef}
      type="button"
      tabIndex={-1}
      className={styles.filter}
      data-on={on || undefined}
      onClick={onClick}
    >
      <span key={label} className={styles.filterLabel}>
        {label}
      </span>
      <ChevronDown size={12} strokeWidth={2.25} />
    </button>
  );
}

export function InteractiveIllustration() {
  const reduced = useReducedMotion();
  const [range, setRange] = useState<Range>("7");
  const [region, setRegion] = useState<Region>("all");
  const [cursor, setCursor] = useState({ ...REST, pressed: false });
  const scene = useRef<HTMLDivElement>(null);
  const rangeChip = useRef<HTMLButtonElement>(null);
  const regionChip = useRef<HTMLButtonElement>(null);
  /* A reader's own click holds the demo for a few seconds. */
  const heldUntil = useRef(0);
  const view = `${range}-${region}` as const;
  const bars = VIEWS[view];
  const total = bars.reduce((sum, v) => sum + v, 0).toFixed(1);
  const kpis = KPIS[view];

  const toggleRange = () => setRange((r) => (r === "7" ? "30" : "7"));
  const toggleRegion = () => setRegion((r) => (r === "all" ? "europe" : "all"));

  /* The demo: the cursor moves to a chip, clicks it, and the dashboard
     redraws. It alternates between the two chips, so every state shows. */
  useEffect(() => {
    if (reduced) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let step = 0;
    const run = () => {
      const chip = step % 2 === 0 ? rangeChip.current : regionChip.current;
      const box = scene.current?.getBoundingClientRect();
      const at = chip?.getBoundingClientRect();
      if (!chip || !box || !at || !box.width) return;
      const scale = box.width / 588;
      const target = {
        x: (at.left - box.left + at.width * 0.62) / scale,
        y: (at.top - box.top + at.height * 0.6) / scale,
      };
      const isRange = step % 2 === 0;
      setCursor({ ...target, pressed: false });
      timers.push(
        setTimeout(() => {
          setCursor((c) => ({ ...c, pressed: true }));
          if (Date.now() > heldUntil.current) {
            if (isRange) toggleRange();
            else toggleRegion();
          }
        }, 1000),
        setTimeout(() => setCursor((c) => ({ ...c, pressed: false })), 1180),
        setTimeout(() => {
          step += 1;
          run();
        }, 3000),
      );
    };
    timers.push(setTimeout(run, 600));
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  const hold = (toggle: () => void) => () => {
    heldUntil.current = Date.now() + 6000;
    toggle();
  };

  return (
    /* The OUI-1 device, set off-centre so the stage crops it. The dashboard
       runs on past the bottom edge: only the top of the blocks under the
       chart shows. */
    <div className={oui.streamScene} ref={scene}>
      <div className={oui.device}>
        <div className={`${oui.screen} ${styles.dashScreen}`}>
          <div className={styles.filters}>
            <FilterChip
              chipRef={rangeChip}
              label={RANGE_LABEL[range]}
              on={range !== "7"}
              onClick={hold(toggleRange)}
            />
            <FilterChip
              chipRef={regionChip}
              label={REGION_LABEL[region]}
              on={region !== "all"}
              onClick={hold(toggleRegion)}
            />
            <span className={styles.filterStatic}>Plan: All</span>
          </div>
          <div className={`${oui.chartCard} ${styles.dashCard}`} aria-hidden="true">
            <div className={oui.chartCardHead}>
              <span className={oui.chartCardTitle}>Revenue</span>
            </div>
            <div className={oui.chartCardTotal}>
              <b key={total} className={styles.swap}>
                ${total}k
              </b>
              <span className={oui.chartCardDelta}>+12%</span>
              <i>vs previous period</i>
            </div>
            <div className={`${oui.plot} ${styles.dashPlot}`}>
              <div className={oui.plotAxis}>
                {[AXIS_MAX, AXIS_MAX / 2, 0].map((tick) => (
                  <span key={tick}>${tick}k</span>
                ))}
              </div>
              <div className={styles.dashBars}>
                {bars.map((v, i) => (
                  <span key={i} className={styles.dashSlot}>
                    <span
                      className={styles.dashBar}
                      style={{ height: `${(v / AXIS_MAX) * 100}%`, "--i": i } as CSSProperties}
                    />
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className={styles.kpiRow} aria-hidden="true">
            {(["Orders", "Customers", "Avg order"] as const).map((label, i) => (
              <div key={label} className={styles.kpiCard}>
                <span>{label}</span>
                <b key={kpis[i]} className={styles.swap}>
                  {kpis[i]}
                </b>
              </div>
            ))}
          </div>
          <div className={styles.tableCard} aria-hidden="true">
            <span>Top products</span>
          </div>
        </div>
      </div>
      {!reduced && (
        <span
          className={styles.cursor}
          style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
          aria-hidden="true"
        >
          <MousePointer2 data-pressed={cursor.pressed || undefined} />
        </span>
      )}
    </div>
  );
}

/* ---------- Third-width scenes ---------- */

/* Abstract, monochrome scenes in the OUI-1 "single figure" language: tints of
   the ink, one solid element, short mono labels and the shared 2.4s beat. */
function Third({ children }: { children: ReactNode }) {
  return (
    <div className={styles.third} aria-hidden="true">
      {children}
    </div>
  );
}

/* Works with your agent: the stack stays, only the bottom layer is new. The
   kept layers carry a few examples of what they already are. */
const AGENT_MARKS = STACK_ROWS[1].items.slice(0, 3);
const TOOL_ICONS = [
  { Icon: Database, name: "Databases" },
  { Icon: Globe, name: "REST APIs" },
  { Icon: Plug, name: "MCP servers" },
];

export function AgentIllustration() {
  return (
    <Third>
      <div className={styles.layers}>
        <span className={styles.layer}>
          agent
          <span className={styles.layerMarks}>
            {AGENT_MARKS.map((item) => (
              <span key={item.name} className={styles.layerMark}>
                <StackChip item={item} iconOnly />
              </span>
            ))}
          </span>
        </span>
        <span className={styles.layer}>
          tools
          <span className={styles.layerMarks}>
            {TOOL_ICONS.map(({ Icon, name }) => (
              <span key={name} className={`${styles.layerMark} ${styles.layerIcon}`}>
                <Icon size={12} strokeWidth={2} />
              </span>
            ))}
          </span>
        </span>
        <span className={`${styles.layer} ${styles.layerHero}`}>
          render
          <span className={styles.layerTag}>OpenUI</span>
        </span>
      </div>
    </Third>
  );
}

/* Validated output: a stream with gaps passes a check and leaves whole. */
const TOKENS_IN = [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1];

export function ValidatedIllustration() {
  return (
    <Third>
      <div className={styles.flow}>
        <div className={`${styles.lane} ${styles.laneIn}`}>
          <div className={styles.tokens}>
            {[...TOKENS_IN, ...TOKENS_IN].map((ok, i) => (
              <span key={i} data-broken={!ok || undefined} />
            ))}
          </div>
        </div>
        <span className={styles.gate}>
          <i />
        </span>
        <div className={`${styles.lane} ${styles.laneOut}`}>
          <div className={styles.tokens}>
            {[...TOKENS_IN, ...TOKENS_IN].map((_, i) => (
              <span key={i} />
            ))}
          </div>
        </div>
        <span className={styles.flowLabel} data-side="in">
          output
        </span>
        <span className={styles.flowLabel} data-side="gate">
          repair
        </span>
        <span className={styles.flowLabel} data-side="out">
          users
        </span>
      </div>
    </Third>
  );
}

/* Safe by design: each request passes your registry only if you registered
   it. Chart and get_sales() carry on through and run; eval() stops at the
   line. The trail is the AppLess caret run, the gate the repair card's. */
const REQUESTS = [
  { name: "Chart", ok: true },
  { name: "get_sales()", ok: true },
  { name: "eval()", ok: false },
];

function Trail({ offset = 0 }: { offset?: number }) {
  return (
    <span className={styles.trail}>
      {Array.from({ length: 5 }, (_, i) => (
        <CaretRight key={i} size={9} weight="bold" style={{ "--t": i + offset } as CSSProperties} />
      ))}
    </span>
  );
}

export function SafetyIllustration() {
  return (
    <Third>
      <div className={styles.sieve}>
        <span className={styles.sieveGate} />
        <span className={styles.sieveLabel}>registry</span>
        {REQUESTS.map((request) => (
          <div
            key={request.name}
            className={styles.sieveRow}
            data-blocked={!request.ok || undefined}
          >
            <span className={styles.sievePill}>{request.name}</span>
            <Trail />
            <span className={styles.sieveStop}>
              {!request.ok && <X size={12} strokeWidth={2.5} />}
            </span>
            {request.ok ? <Trail offset={5} /> : <span />}
            <span className={styles.sieveTile}>{request.ok ? 1 : 0}</span>
          </div>
        ))}
      </div>
    </Third>
  );
}
