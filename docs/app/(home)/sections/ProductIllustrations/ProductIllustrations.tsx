"use client";

import { failureTaxonomy } from "@/lib/benchmark-data";
import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./ProductIllustrations.module.css";

export { OpenSourceIllustration } from "./OpenSourceIllustration";

export function GatewayReliabilityDashboardIllustration({
  inverted = false,
  alt = "OpenUI Gateway reliability dashboard showing successful renders, errors, sanitizer triggers, and model fallbacks",
}: {
  inverted?: boolean;
  alt?: string;
}) {
  return (
    <div
      className={`${styles.reliabilityDashboardIllustration} ${
        inverted ? styles.reliabilityDashboardIllustrationInverted : ""
      }`.trim()}
    >
      <span className={styles.reliabilityDashboardWide}>
        <Image
          className={`${styles.reliabilityDashboardImage} ${styles.reliabilityDashboardImageLight}`}
          src="/homepage/gateway-light.webp"
          alt={alt}
          width={2240}
          height={880}
          quality={95}
          sizes="(max-width: 1023px) calc(100vw - 64px), 1120px"
        />
        <Image
          className={`${styles.reliabilityDashboardImage} ${styles.reliabilityDashboardImageDark}`}
          src="/homepage/gateway-dark.webp"
          alt=""
          aria-hidden="true"
          width={2240}
          height={880}
          quality={95}
          sizes="(max-width: 1023px) calc(100vw - 64px), 1120px"
        />
      </span>
      <span className={styles.reliabilityDashboardCompact}>
        <Image
          className={`${styles.reliabilityDashboardImage} ${styles.reliabilityDashboardImageLight}`}
          src="/homepage/gateway-mobile-light.webp"
          alt={alt}
          width={1440}
          height={1200}
          quality={95}
          sizes="calc(100vw - 32px)"
        />
        <Image
          className={`${styles.reliabilityDashboardImage} ${styles.reliabilityDashboardImageDark}`}
          src="/homepage/gateway-mobile-dark.webp"
          alt=""
          aria-hidden="true"
          width={1440}
          height={1200}
          quality={95}
          sizes="calc(100vw - 32px)"
        />
      </span>
    </div>
  );
}

type ResponseTone = "valid" | "root" | "reference" | "type" | "truncation";

const responseLanes = [
  {
    path: "M 96 96 H 164 C 196 96 204 106 220 128 S 248 160 276 160 H 296 C 322 160 324 190 344 204 S 388 218 405 222",
  },
  {
    path: "M 111 176 H 170 C 204 176 210 188 228 206 S 256 226 284 226 H 304 C 330 226 348 238 405 242",
  },
  { path: "M 97 260 H 188 C 222 260 230 244 256 244 H 286 C 312 244 338 260 405 260" },
  {
    path: "M 83 344 H 170 C 204 344 210 332 228 314 S 256 294 284 294 H 304 C 330 294 348 282 405 280",
  },
] as const;

const openResponseLanes = [
  {
    path: "M 96 109 H 174 C 204 109 210 134 228 164 S 258 198 286 198 H 304 C 330 198 344 216 405 222",
  },
  {
    path: "M 111 210 H 174 C 206 210 214 220 232 232 S 260 246 288 246 H 306 C 332 246 350 246 405 246",
  },
  { path: "M 97 310 H 174 C 206 310 214 300 232 288 S 260 274 288 274 H 306 C 332 274 350 274 405 274" },
  {
    path: "M 83 411 H 174 C 204 411 210 386 228 356 S 258 322 286 322 H 304 C 330 322 344 304 405 298",
  },
] as const;

const validatedLanes = [
  { path: "M 616 236 H 690 C 724 236 724 186 758 186 H 1120" },
  { path: "M 616 260 H 706 C 730 260 736 260 758 260 H 1120" },
  { path: "M 616 284 H 690 C 724 284 724 334 758 334 H 1120" },
] as const;

const responseModels = [
  { name: "OpenAI", provider: "openai", src: "/brand-icons/openai.svg" },
  { name: "Anthropic", provider: "anthropic", src: "/brand-icons/anthropic.svg" },
  { name: "Gemini", provider: "gemini", src: "/brand-icons/gemini.svg" },
  { name: "Meta", provider: "meta", src: "/brand-icons/meta.svg" },
  { name: "xAI", provider: "xai", src: "/brand-icons/xai.svg" },
  { name: "DeepSeek", provider: "deepseek", src: "/brand-icons/deepseek.svg" },
  { name: "Qwen", provider: "qwen", src: "/brand-icons/qwen.svg" },
  { name: "Kimi", provider: "kimi", src: "/brand-icons/kimi.svg" },
] as const;

const mobileResponseLanes = [
  { path: "M 58 84 C 58 120 72 128 100 140 S 130 160 164 168" },
  { path: "M 161 84 C 161 116 168 138 180 168" },
  { path: "M 261 84 C 261 116 244 138 210 168" },
  { path: "M 348 84 C 348 120 326 128 296 140 S 260 160 226 168" },
] as const;

const mobileValidatedLanes = [
  { path: "M 160 380 C 160 402 150 410 140 418 S 128 434 128 448 V 520" },
  { path: "M 195 380 C 195 404 195 424 195 448 V 520" },
  { path: "M 230 380 C 230 402 240 410 250 418 S 262 434 262 448 V 520" },
] as const;

const incomingResponses: Array<{ lane: number; delay: number; tone: ResponseTone }> = [
  { lane: 0, delay: -0.2, tone: "valid" },
  { lane: 0, delay: -2.4, tone: "root" },
  { lane: 0, delay: -4.6, tone: "valid" },
  { lane: 1, delay: -0.8, tone: "reference" },
  { lane: 1, delay: -3, tone: "valid" },
  { lane: 1, delay: -5.2, tone: "type" },
  { lane: 2, delay: -1.4, tone: "type" },
  { lane: 2, delay: -3.6, tone: "valid" },
  { lane: 2, delay: -5.8, tone: "root" },
  { lane: 3, delay: -2, tone: "valid" },
  { lane: 3, delay: -4.2, tone: "reference" },
  { lane: 3, delay: -6.4, tone: "valid" },
];

type FailureTone = Exclude<ResponseTone, "valid">;

const failureTones: FailureTone[] = ["root", "reference", "type", "truncation"];

// Smooth weighted round-robin keeps the animated counters close to the
// observed 44 / 36 / 16 / 4 production split at every point in the cycle,
// instead of bunching the rare categories together.
const responseFailureSequence = (() => {
  const scores = failureTones.map(() => 0);

  return Array.from({ length: 25 }, () => {
    failureTaxonomy.forEach((entry, index) => {
      scores[index] += entry.share;
    });
    const selectedIndex = scores.indexOf(Math.max(...scores));
    scores[selectedIndex] -= 100;
    return failureTones[selectedIndex];
  });
})();

const initialDiagnostics = {
  checked: 147,
  root: 5,
  reference: 4,
  type: 2,
  truncation: 1,
};

const validatedResponses = incomingResponses.map((_, index) => ({
  lane: index % validatedLanes.length,
  delay: -index * 0.44,
}));

function GatewayReliabilityFlow({ openCanvas = false }: { openCanvas?: boolean }) {
  const [visibleModelIndexes, setVisibleModelIndexes] = useState([0, 1, 2, 3]);
  const [switchingSlot, setSwitchingSlot] = useState<number | null>(null);
  const [diagnostics, setDiagnostics] = useState(initialDiagnostics);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let failureIndex = 0;
    const counterTimer = window.setInterval(() => {
      setDiagnostics((current) => {
        if (current.checked >= 1000) {
          failureIndex = 0;
          return initialDiagnostics;
        }

        const checked = current.checked + 1;

        // Roughly 7% of checked generations enter the failure breakdown.
        if (checked % 14 !== 0) return { ...current, checked };

        const tone = responseFailureSequence[failureIndex % responseFailureSequence.length];
        failureIndex += 1;
        return { ...current, checked, [tone]: current[tone] + 1 };
      });
    }, 550);

    return () => window.clearInterval(counterTimer);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let slot = 0;
    let nextModel = 4;
    let swapTimer: number | undefined;
    const rotationTimer = window.setInterval(() => {
      const activeSlot = slot;
      const replacement = nextModel;
      setSwitchingSlot(activeSlot);
      swapTimer = window.setTimeout(() => {
        setVisibleModelIndexes((current) =>
          current.map((modelIndex, index) => (index === activeSlot ? replacement : modelIndex)),
        );
        setSwitchingSlot(null);
      }, 320);
      slot = (slot + 1) % 4;
      nextModel = (nextModel + 1) % responseModels.length;
    }, 4800);

    return () => {
      window.clearInterval(rotationTimer);
      if (swapTimer) window.clearTimeout(swapTimer);
    };
  }, []);

  const totalFixed =
    diagnostics.root + diagnostics.reference + diagnostics.type + diagnostics.truncation;

  return (
    <div
      className={`${styles.responseFlowHero} ${openCanvas ? styles.responseFlowHeroOpen : ""}`.trim()}
      role="img"
      aria-label="Model output streams through OpenUI Gateway. Gateway checks every response, shows fixes across no valid root, reference graph, enum, type and argument, and truncation errors, then delivers valid output to a rendered analytics interface."
    >
      <ResponsePaths openCanvas={openCanvas} />
      <ResponsePaths mobile />

      <div className={styles.modelSources} aria-hidden="true">
        {visibleModelIndexes.map((modelIndex, slot) => {
          const model = responseModels[modelIndex];
          return (
            <div
              className={styles.modelSource}
              data-provider={model.provider}
              data-switching={switchingSlot === slot ? "true" : undefined}
              key={`model-slot-${slot}`}
            >
              <span className={styles.modelSourceIcon}>
                <Image src={model.src} alt="" width={14} height={14} />
              </span>
              <span>{model.name}</span>
            </div>
          );
        })}
      </div>

      <div className={styles.responseGatewayNode} aria-hidden="true">
        <div className={styles.gatewayHeader}>
          <span>OPENUI GATEWAY</span>
          <span className={styles.responseCount}>
            <small>CHECKED/</small>
            <AnimatedNumber value={diagnostics.checked} />
          </span>
        </div>
        <div className={styles.gatewayMetrics}>
          <GatewayMetric label="No valid root" value={diagnostics.root} tone="root" />
          <GatewayMetric label="Reference graph" value={diagnostics.reference} tone="reference" />
          <GatewayMetric label="Enum, type & argument" value={diagnostics.type} tone="type" />
          <GatewayMetric label="Truncation" value={diagnostics.truncation} tone="truncation" />
          <div className={styles.gatewayMetricsFooter}>
            <span>TOTAL RESPONSES FIXED</span>
            <AnimatedNumber value={totalFixed} />
          </div>
        </div>
      </div>

      <div className={styles.renderedInterface} aria-hidden="true">
        <Image
          className={styles.renderedInterfaceLight}
          src="/images/gateway/rendered-ui-light@3x.png"
          alt=""
          width={1716}
          height={1367}
          unoptimized
        />
        <Image
          className={styles.renderedInterfaceDark}
          src="/images/gateway/rendered-ui-dark@3x.png"
          alt=""
          width={1716}
          height={1367}
          unoptimized
        />
      </div>
    </div>
  );
}

export function GatewayReliabilityIllustration() {
  return <GatewayReliabilityFlow />;
}

/** Open-stage alternative retained separately so the framed composition remains reusable. */
export function GatewayReliabilityOpenIllustration() {
  return <GatewayReliabilityFlow openCanvas />;
}

function ResponsePaths({
  mobile = false,
  openCanvas = false,
}: {
  mobile?: boolean;
  openCanvas?: boolean;
}) {
  const incomingLanes = mobile
    ? mobileResponseLanes
    : openCanvas
      ? openResponseLanes
      : responseLanes;
  const outgoingLanes = mobile ? mobileValidatedLanes : validatedLanes;

  return (
    <svg
      className={`${styles.gatewayPaths} ${
        mobile ? styles.gatewayPathsMobile : styles.gatewayPathsDesktop
      }`}
      viewBox={mobile ? "0 0 390 720" : "0 0 1280 520"}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {incomingLanes.map((lane, index) => (
        <path d={lane.path} key={`incoming-line-${index}`} />
      ))}
      {outgoingLanes.map((lane, index) => (
        <path d={lane.path} key={`outgoing-line-${index}`} />
      ))}
      {incomingResponses.map((response, index) => (
        <g
          className={styles.incomingResponse}
          data-tone={response.tone}
          key={`incoming-response-${index}`}
        >
          <ResponseMarker tone={response.tone} />
          <animateMotion
            begin={`${response.delay}s`}
            dur="6.6s"
            path={incomingLanes[response.lane].path}
            repeatCount="indefinite"
          />
        </g>
      ))}
      {validatedResponses.map((response, index) => (
        <circle className={styles.validatedResponse} key={`validated-response-${index}`} r="4.5">
          <animateMotion
            begin={`${response.delay}s`}
            dur="6.6s"
            path={outgoingLanes[response.lane].path}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  );
}

function GatewayMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value?: string | number;
  tone: "neutral" | "valid" | "root" | "reference" | "type" | "truncation";
}) {
  return (
    <div className={styles.gatewayMetric} data-tone={tone}>
      <i />
      <span>{label}</span>
      <AnimatedNumber value={value ?? ""} />
    </div>
  );
}

function AnimatedNumber({ value }: { value: string | number }) {
  return (
    <span className={styles.animatedNumber} aria-label={String(value)}>
      {String(value)
        .split("")
        .map((digit, index) => (
          <span className={styles.diagnosticDigit} key={`${index}-${digit}`} aria-hidden="true">
            {digit}
          </span>
        ))}
    </span>
  );
}

function ResponseMarker({ tone }: { tone: ResponseTone }) {
  if (tone === "root") {
    return (
      <path d="M 0 -6 Q .8 -6 1.25 -5.2 L 6 3.8 Q 6.5 5 5.1 5 H -5.1 Q -6.5 5 -6 3.8 L -1.25 -5.2 Q -.8 -6 0 -6 Z" />
    );
  }
  if (tone === "reference") return <rect x="-5" y="-5" width="10" height="10" rx="2" />;
  if (tone === "truncation") return <path d="M 0 -6 L 6 0 L 0 6 L -6 0 Z" />;
  if (tone === "type") return <circle r="5" />;
  return <circle r="5" />;
}
