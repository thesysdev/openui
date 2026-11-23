"use client";

import {
  ArrowUpRight,
  Check,
  CircleDot,
  Layers3,
  Link2,
  LockKeyhole,
  Pause,
  Play,
  RotateCcw,
  UserRound,
  UserRoundPlus,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import styles from "./LaunchIllustrations.module.css";

const SOURCE_MARKS = {
  posthog: 'url("/integration-logos/posthog.svg")',
  postgres: 'url("/integration-logos/postgresql.svg")',
};

function SourceMark({ source }: { source: keyof typeof SOURCE_MARKS }) {
  return (
    <span
      className={styles.sourceMark}
      data-source={source}
      style={{ "--source-mark": SOURCE_MARKS[source] } as CSSProperties}
    />
  );
}

const BARS = [24, 35, 29, 49, 45, 39, 63, 57, 73, 68, 82, 77, 91, 87, 100, 96];

const SHARE_TIMINGS = [1150, 220, 1000, 1150, 1300] as const;
const BUILD_TIMINGS = [950, 1050, 1150, 1250, 220] as const;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeToMotion(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function Scene({
  label,
  timings,
  children,
}: {
  label: string;
  timings: readonly number[];
  children: (phase: number) => ReactNode;
}) {
  const view = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useSyncExternalStore(
    subscribeToMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
  const complete = phase === timings.length;

  useEffect(() => {
    const target = view.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.4,
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || paused || reduced || complete) return;
    const timer = window.setTimeout(() => setPhase((current) => current + 1), timings[phase]);
    return () => window.clearTimeout(timer);
  }, [phase, paused, reduced, visible, complete, timings]);

  const action = complete ? "Replay" : paused ? "Resume" : "Pause";

  return (
    <div
      ref={view}
      className={styles.scene}
      data-resting={!visible || paused || reduced || undefined}
    >
      <div className={styles.sceneArt} aria-hidden="true">
        {children(reduced ? timings.length : phase)}
      </div>
      {!reduced && (
        <button
          className={styles.playback}
          type="button"
          aria-label={`${action} ${label} animation`}
          onClick={() => {
            if (complete) setPhase(0);
            setPaused(!complete && !paused);
          }}
        >
          {complete ? <RotateCcw /> : paused ? <Play /> : <Pause />}
        </button>
      )}
    </div>
  );
}

function Bars() {
  return (
    <div className={styles.bars}>
      {BARS.map((height, index) => (
        <i key={height} data-recent={index >= 12 || undefined} style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

export function SharingIllustration() {
  return (
    <Scene label="sharing" timings={SHARE_TIMINGS}>
      {(phase) => (
        <div className={styles.shareScene} data-modal={phase >= 2 || undefined}>
          <div className={styles.preview}>
            <div className={styles.previewValue}>
              <span>Paid conversions</span>
              <strong>1,284</strong>
            </div>
            <span className={styles.change}>
              <ArrowUpRight /> 12.8%
            </span>
            <Bars />
          </div>
          <div className={styles.shareCard}>
            <div className={styles.shareHeader}>
              <span className={styles.dashboardName}>Growth overview</span>
              <span className={styles.shareButton} data-pressed={phase === 1 || undefined}>
                <UserRoundPlus /> Share
              </span>
            </div>
            <div className={styles.shareFooter}>
              <div className={styles.people}>
                <span>
                  <UserRound />
                </span>
                <span>
                  <UserRound />
                </span>
                <span>
                  <UserRound />
                </span>
              </div>
              <div className={styles.shareMarks}>
                <SourceMark source="posthog" />
                <SourceMark source="postgres" />
              </div>
            </div>
          </div>
          <div className={styles.scrim} data-open={phase >= 2 || undefined} />
          <div className={styles.dialog} data-open={phase >= 2 || undefined}>
            <strong className={styles.dialogTitle}>Share dashboard</strong>
            <span className={styles.dialogContext}>Growth overview</span>
            <div className={styles.passwordRow}>
              <LockKeyhole />
              <span>Require a password</span>
              <i className={styles.passwordSwitch} data-checked={phase >= 3 || undefined} />
            </div>
            <div className={styles.passwordValue} data-revealed={phase >= 3 || undefined}>
              <span>Password</span>
              <span>••••••••</span>
            </div>
            <div className={styles.copyLink}>
              {phase === 5 ? (
                <>
                  <Check /> Link copied
                </>
              ) : (
                <>
                  <Link2 /> Copy link
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Scene>
  );
}

const BUILD_STEPS = [
  "Check available data",
  "Query signups and orders",
  "Build the dashboard",
] as const;

export function SourcesIllustration() {
  return (
    <Scene label="dashboard build and sources" timings={BUILD_TIMINGS}>
      {(phase) => (
        <div className={styles.sourcesScene}>
          <div className={styles.dashboard}>
            <div className={styles.dashboardTop}>
              <span>Growth overview</span>
              <span
                className={styles.sourcesTrigger}
                data-ready={phase >= 3 || undefined}
                data-pressed={phase === 4 || undefined}
              >
                <Layers3 /> Sources
              </span>
            </div>
            <div className={styles.dashboardBody}>
              <div className={styles.skeleton} data-loaded={phase >= 3 || undefined}>
                <div className={styles.skeletonMetrics}>
                  <i />
                  <i />
                  <i />
                </div>
                <div className={styles.skeletonPlot}>
                  <i />
                  <Bars />
                </div>
              </div>
              <div className={styles.dashboardData} data-loaded={phase >= 3 || undefined}>
                <div className={styles.dashboardMetrics}>
                  <div>
                    <span>Paid conversions</span>
                    <strong>1,284</strong>
                  </div>
                  <div>
                    <span>Signups</span>
                    <strong>26,750</strong>
                  </div>
                  <div>
                    <span>Conversion rate</span>
                    <strong>4.8%</strong>
                  </div>
                </div>
                <div className={styles.dashboardPlot}>
                  <span>Paid conversions over time</span>
                  <Bars />
                </div>
              </div>
            </div>
          </div>
          <div className={styles.buildStatus} data-open={phase < 3 || undefined}>
            <strong className={styles.dialogTitle}>Building dashboard</strong>
            <ol className={styles.buildSteps}>
              {BUILD_STEPS.map((step, index) => (
                <li
                  key={step}
                  data-visible={index <= phase || undefined}
                  data-current={index === phase || undefined}
                >
                  <span>
                    {index < phase ? <Check /> : <CircleDot />}
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className={styles.scrim} data-open={phase === 5 || undefined} />
          <div className={styles.dialog} data-open={phase === 5 || undefined}>
            <strong className={styles.dialogTitle}>
              <Layers3 /> Sources
            </strong>
            <span className={styles.dialogContext}>Paid conversions</span>
            <div className={styles.sourceRow}>
              <div className={styles.source}>
                <SourceMark source="posthog" />
                <div>
                  <strong>Signups</strong>
                  <span>PostHog</span>
                </div>
              </div>
              <div className={styles.source}>
                <SourceMark source="postgres" />
                <div>
                  <strong>Orders</strong>
                  <span>PostgreSQL</span>
                </div>
              </div>
            </div>
            <div className={styles.analysis}>
              <strong>Data analysis</strong>
              <span>Matched signups with paid orders.</span>
            </div>
          </div>
        </div>
      )}
    </Scene>
  );
}
