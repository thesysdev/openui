"use client";

import LlmRespondsInOpenUiLang from "@/imports/LlmRespondsInOpenUiLang";
import OpenUiGeneratesSchema from "@/imports/OpenUiGeneratesSchema";
import OpenUiRendererRendersIt from "@/imports/OpenUiRendererRendersIt-43-427";
import YouRegisterComponents from "@/imports/YouRegisterComponents-43-365";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import styles from "./StepsSection.module.css";

// ---------------------------------------------------------------------------
// Types & data
// ---------------------------------------------------------------------------

interface Step {
  number: number;
  title: string;
  description: string;
  detailsTitle?: string;
  details: string[];
}

const STEPS: Step[] = [
  {
    number: 1,
    title: "You define your library",
    description: "Register components with defineComponent and createLibrary.",
    details: [],
  },
  {
    number: 2,
    title: "OpenUI generates system prompt",
    description:
      "Generate a system prompt from your library with OpenUI SDK and send it to the LLM.",
    details: [],
  },
  {
    number: 3,
    title: "LLM responds in OpenUI Lang",
    description: "The model returns token-efficient, line-oriented OpenUI Lang (not markdown).",
    details: [],
  },
  {
    number: 4,
    title: "Renderer parses and renders UI",
    description: "Renderer parses the output and renders interactive UI in real time.",
    details: [],
  },
];

/** Maps step number → Figma illustration component */
const STEP_ILLUSTRATIONS: Record<number, ComponentType> = {
  1: YouRegisterComponents,
  2: OpenUiGeneratesSchema,
  3: LlmRespondsInOpenUiLang,
  4: OpenUiRendererRendersIt,
};

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const EXPANDED_HEIGHT = 480;
const COLLAPSED_HEIGHT = 84;
const LAST_STEP_INDEX = STEPS.length - 1;
const TOTAL_DESKTOP_HEIGHT = EXPANDED_HEIGHT + LAST_STEP_INDEX * COLLAPSED_HEIGHT + LAST_STEP_INDEX;

const CARD_SHADOW = "0px 1px 3px 0px rgba(22,34,51,0.08), 0px 12px 24px 0px rgba(22,34,51,0.04)";
const CARD_BORDER = "0.391px solid rgba(0,0,0,0.08)";

// ---------------------------------------------------------------------------
// Animation presets
// ---------------------------------------------------------------------------

const TRANSITION = {
  expand: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
  content: { duration: 0.3, delay: 0.15 },
  preview: { duration: 0.4, delay: 0.1 },
  mobile: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
} as const;

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function StepBadge({ num, isActive }: { num: number; isActive: boolean }) {
  return (
    <div
      className={`${styles.stepBadge} ${isActive ? styles.stepBadgeActive : styles.stepBadgeInactive}`}
    >
      <span className={styles.stepBadgeLabel}>
        {num}
      </span>
    </div>
  );
}

function Divider() {
  return <div className={styles.divider} />;
}

function StepDetails({ step, hideDetails }: { step: Step; hideDetails?: boolean }) {
  return (
    <div className={styles.stepDetails}>
      <p className={styles.stepDescription}>
        {step.description}
      </p>
      {!hideDetails && step.details.length > 0 && (
        <div className={styles.stepDescription}>
          {step.detailsTitle && <p className={styles.stepDetailsTitle}>{step.detailsTitle}</p>}
          <ul className={styles.stepDetailsList}>
            {step.details.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StepIllustration({ stepNumber, mobile }: { stepNumber: number; mobile?: boolean }) {
  const Illustration = STEP_ILLUSTRATIONS[stepNumber];
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!mobile || !containerRef.current) return;
    const updateScale = () => {
      if (containerRef.current) {
        setScale(containerRef.current.offsetWidth / 610);
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [mobile]);

  if (!Illustration) return <div className={styles.illustrationFallback} />;

  if (mobile) {
    return (
      <div
        ref={containerRef}
        className={styles.mobileIllustrationFrame}
      >
        <div
          className={styles.mobileIllustrationScale}
          style={{ width: 610, height: 432, transform: `scale(${scale})` }}
        >
          <Illustration />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.desktopIllustrationFrame}>
      <Illustration />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop step row
// ---------------------------------------------------------------------------

function DesktopStep({
  step,
  isActive,
  onActivate,
}: {
  step: Step;
  isActive: boolean;
  onActivate: () => void;
}) {
  return (
    <motion.div
      className={styles.desktopStep}
      animate={{
        height: isActive ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
        boxShadow: isActive
          ? "0px 1px 3px rgba(22,34,51,0.08), 0px 10px 20px rgba(22,34,51,0.03)"
          : "0px 0px 0px rgba(0,0,0,0)",
        zIndex: isActive ? 2 : 1,
      }}
      transition={TRANSITION.expand}
      onClick={onActivate}
      onMouseEnter={onActivate}
    >
      {/* Left: number + text */}
      <div className={styles.desktopStepLead}>
        <StepBadge num={step.number} isActive={isActive} />

        <div className={styles.desktopStepCopy}>
          <h3 className={styles.desktopStepTitle}>
            {step.title}
          </h3>

          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={TRANSITION.content}
              >
                <StepDetails step={step} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: illustration preview */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            className={styles.desktopStepPreview}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={TRANSITION.preview}
          >
            <StepIllustration stepNumber={step.number} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Mobile step row
// ---------------------------------------------------------------------------

function MobileStep({
  step,
  isActive,
  onToggle,
}: {
  step: Step;
  isActive: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button className={styles.mobileStepButton} onClick={onToggle}>
        <StepBadge num={step.number} isActive={isActive} />
        <span className={styles.mobileStepTitle}>
          {step.title}
        </span>
      </button>

      <AnimatePresence>
        {isActive && (
          <motion.div
            className={styles.mobileStepPanel}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={TRANSITION.mobile}
          >
            <div className={styles.mobileStepContent}>
              <div className={styles.mobileStepDetails}>
                <StepDetails step={step} hideDetails />
              </div>
              <div className={styles.mobileStepIllustrationWrap}>
                <StepIllustration stepNumber={step.number} mobile />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function StepsSection() {
  const [activeStep, setActiveStep] = useState(1);
  const activate = useCallback((n: number) => setActiveStep(n), []);

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div
          className={styles.card}
          style={{ border: CARD_BORDER, boxShadow: CARD_SHADOW }}
        >
          {/* Desktop */}
          <div className={styles.desktopSteps} style={{ height: TOTAL_DESKTOP_HEIGHT }}>
            {STEPS.map((step, i) => (
              <div key={step.number}>
                <DesktopStep
                  step={step}
                  isActive={activeStep === step.number}
                  onActivate={() => activate(step.number)}
                />
                {i < LAST_STEP_INDEX && <Divider />}
              </div>
            ))}
          </div>

          {/* Mobile */}
          <div className={styles.mobileSteps}>
            {STEPS.map((step, i) => (
              <div key={step.number}>
                <MobileStep
                  step={step}
                  isActive={activeStep === step.number}
                  onToggle={() => activate(step.number)}
                />
                {i < LAST_STEP_INDEX && <Divider />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
