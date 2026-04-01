"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { AccordionItem, AccordionPanel } from "../Accordion/Accordion";
import styles from "./StepsAccordion.module.css";

export interface StepsAccordionItem {
  number: number;
  title: string;
  description: string;
  detailsTitle?: string;
  details: string[];
  Illustration: ComponentType;
}

interface StepsAccordionProps {
  steps: StepsAccordionItem[];
}

const EXPANDED_HEIGHT = 480;
const COLLAPSED_HEIGHT = 84;
const ACTIVE_STEP_SHADOW = "0px 1px 3px rgba(22,34,51,0.08), 0px 10px 20px rgba(22,34,51,0.03)";

const TRANSITION = {
  expand: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const },
  content: { duration: 0.3, delay: 0.15 },
  preview: { duration: 0.4, delay: 0.1 },
  mobile: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
} as const;

function StepBadge({ num, isActive }: { num: number; isActive: boolean }) {
  return (
    <div
      className={`${styles.stepBadge} ${isActive ? styles.stepBadgeActive : styles.stepBadgeInactive}`}
    >
      <span className={styles.stepBadgeLabel}>{num}</span>
    </div>
  );
}

function Divider() {
  return <div className={styles.divider} />;
}

function StepDetails({ step, hideDetails }: { step: StepsAccordionItem; hideDetails?: boolean }) {
  return (
    <div className={styles.stepDetails}>
      <p className={styles.stepDescription}>{step.description}</p>
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

function StepIllustration({ step, mobile }: { step: StepsAccordionItem; mobile?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!mobile || !containerRef.current) return;

    const updateScale = () => {
      if (containerRef.current) {
        setScale(containerRef.current.offsetWidth / 610);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [mobile]);

  useEffect(() => {
    if (!mobile || !scaleRef.current) return;
    scaleRef.current.style.setProperty("--mobile-illustration-scale", String(scale));
  }, [mobile, scale]);

  const Illustration = step.Illustration;

  if (!Illustration) {
    return <div className={styles.illustrationFallback} />;
  }

  if (mobile) {
    return (
      <div ref={containerRef} className={styles.mobileIllustrationFrame}>
        <div ref={scaleRef} className={styles.mobileIllustrationScale}>
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

function DesktopStep({
  step,
  isActive,
  onActivate,
}: {
  step: StepsAccordionItem;
  isActive: boolean;
  onActivate: () => void;
}) {
  return (
    <AccordionItem
      open={isActive}
      expandedHeight={EXPANDED_HEIGHT}
      collapsedHeight={COLLAPSED_HEIGHT}
      className={styles.desktopStep}
      activeShadow={ACTIVE_STEP_SHADOW}
      transition={TRANSITION.expand}
      onActivate={onActivate}
    >
      <div className={styles.desktopStepLead}>
        <StepBadge num={step.number} isActive={isActive} />

        <div className={styles.desktopStepCopy}>
          <h3 className={styles.desktopStepTitle}>{step.title}</h3>

          <AccordionPanel
            open={isActive}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={TRANSITION.content}
          >
            <StepDetails step={step} />
          </AccordionPanel>
        </div>
      </div>

      <AccordionPanel
        open={isActive}
        className={styles.desktopStepPreview}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={TRANSITION.preview}
      >
        <StepIllustration step={step} />
      </AccordionPanel>
    </AccordionItem>
  );
}

function MobileStep({
  step,
  isActive,
  onToggle,
}: {
  step: StepsAccordionItem;
  isActive: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button className={styles.mobileStepButton} onClick={onToggle}>
        <StepBadge num={step.number} isActive={isActive} />
        <span className={styles.mobileStepTitle}>{step.title}</span>
      </button>

      <AccordionPanel
        open={isActive}
        className={styles.mobileStepPanel}
        transition={TRANSITION.mobile}
      >
        <div className={styles.mobileStepContent}>
          <div className={styles.mobileStepDetails}>
            <StepDetails step={step} hideDetails />
          </div>
          <div className={styles.mobileStepIllustrationWrap}>
            <StepIllustration step={step} mobile />
          </div>
        </div>
      </AccordionPanel>
    </div>
  );
}

export function StepsAccordion({ steps }: StepsAccordionProps) {
  const [activeStep, setActiveStep] = useState(1);
  const lastStepIndex = steps.length - 1;
  const activate = useCallback((stepNumber: number) => setActiveStep(stepNumber), []);

  return (
    <div className={styles.card}>
      <div className={styles.desktopSteps}>
        {steps.map((step, index) => (
          <div key={step.number}>
            <DesktopStep
              step={step}
              isActive={activeStep === step.number}
              onActivate={() => activate(step.number)}
            />
            {index < lastStepIndex && <Divider />}
          </div>
        ))}
      </div>

      <div className={styles.mobileSteps}>
        {steps.map((step, index) => (
          <div key={step.number}>
            <MobileStep
              step={step}
              isActive={activeStep === step.number}
              onToggle={() => activate(step.number)}
            />
            {index < lastStepIndex && <Divider />}
          </div>
        ))}
      </div>
    </div>
  );
}
