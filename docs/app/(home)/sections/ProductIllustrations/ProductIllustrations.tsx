import Image from "next/image";
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
      <Image
        className={`${styles.reliabilityDashboardImage} ${styles.reliabilityDashboardImageLight}`}
        src="/images/gateway/reliability-light@4x.webp"
        alt={alt}
        width={3360}
        height={1320}
        unoptimized
      />
      <Image
        className={`${styles.reliabilityDashboardImage} ${styles.reliabilityDashboardImageDark}`}
        src="/images/gateway/reliability-dark@4x.webp"
        alt=""
        aria-hidden="true"
        width={3360}
        height={1320}
        unoptimized
      />
    </div>
  );
}

type ResponseTone = "valid" | "root" | "reference" | "type";

const responseLanes = [
  {
    path: "M 22 96 H 164 C 196 96 204 106 220 128 S 248 160 276 160 H 296 C 322 160 324 190 344 204 S 388 218 405 222",
  },
  {
    path: "M 22 176 H 170 C 204 176 210 188 228 206 S 256 226 284 226 H 304 C 330 226 348 238 405 242",
  },
  { path: "M 22 260 H 188 C 222 260 230 244 256 244 H 286 C 312 244 338 260 405 260" },
  {
    path: "M 22 344 H 170 C 204 344 210 332 228 314 S 256 294 284 294 H 304 C 330 294 348 282 405 280",
  },
  {
    path: "M 22 424 H 164 C 196 424 204 414 220 392 S 248 360 276 360 H 296 C 322 360 324 330 344 316 S 388 302 405 300",
  },
] as const;

const openResponseLanes = [
  {
    path: "M 22 58 H 174 C 204 58 210 84 228 112 S 258 154 286 154 H 304 C 330 154 344 202 405 222",
  },
  {
    path: "M 22 159 H 174 C 206 159 214 178 232 198 S 260 224 288 224 H 306 C 332 224 350 238 405 242",
  },
  { path: "M 22 260 H 190 C 224 260 230 244 256 244 H 286 C 312 244 338 260 405 260" },
  {
    path: "M 22 361 H 174 C 206 361 214 342 232 322 S 260 296 288 296 H 306 C 332 296 350 282 405 280",
  },
  {
    path: "M 22 462 H 174 C 204 462 210 436 228 408 S 258 366 286 366 H 304 C 330 366 344 318 405 300",
  },
] as const;

const validatedLanes = [
  { path: "M 656 236 H 690 C 724 236 724 186 758 186 H 1120" },
  { path: "M 656 260 H 706 C 730 260 736 260 758 260 H 1120" },
  { path: "M 656 284 H 690 C 724 284 724 334 758 334 H 1120" },
] as const;

const responseModels = [
  { name: "OpenAI", provider: "openai", src: "/brand-icons/openai.svg" },
  { name: "Anthropic", provider: "anthropic", src: "/brand-icons/anthropic.svg" },
  { name: "Gemini", provider: "gemini", src: "/brand-icons/gemini.svg" },
  { name: "Meta", provider: "meta", src: "/brand-icons/meta.svg" },
  { name: "xAI", provider: "xai", src: "/brand-icons/xai.svg" },
] as const;

const mobileResponseLanes = [
  { path: "M 42 -24 V 34 C 42 74 76 76 76 112 C 76 150 116 160 154 210" },
  { path: "M 116 -24 V 54 C 116 88 142 96 142 128 C 142 164 166 176 176 210" },
  { path: "M 195 -24 V 210" },
  { path: "M 274 -24 V 54 C 274 88 248 96 248 128 C 248 164 224 176 214 210" },
  { path: "M 348 -24 V 34 C 348 74 314 76 314 112 C 314 150 274 160 236 210" },
] as const;

const mobileValidatedLanes = [
  { path: "M 160 362 V 382 C 160 404 128 406 128 434 V 640" },
  { path: "M 195 362 V 640" },
  { path: "M 230 362 V 382 C 230 404 262 406 262 434 V 640" },
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
  { lane: 4, delay: -0.5, tone: "valid" },
  { lane: 4, delay: -2.7, tone: "root" },
  { lane: 4, delay: -4.9, tone: "valid" },
];

const validatedResponses = incomingResponses.map((_, index) => ({
  lane: index % validatedLanes.length,
  delay: -index * 0.44,
}));

const slotValues = {
  fixed: ["08", "09", "10", "11", "12", "13"],
  checked: ["143", "144", "145", "146", "147", "148"],
  delivered: ["143", "144", "145", "146", "147", "148"],
};

function GatewayReliabilityFlow({ openCanvas = false }: { openCanvas?: boolean }) {
  return (
    <div
      className={`${styles.responseFlowHero} ${openCanvas ? styles.responseFlowHeroOpen : ""}`.trim()}
      role="img"
      aria-label="Model output streams fifteen complete responses through OpenUI Gateway. Gateway checks every response, fixes four kinds of output errors, and delivers the same fifteen valid responses to a rendered analytics interface."
    >
      <ResponsePaths openCanvas={openCanvas} />
      <ResponsePaths mobile />

      <div className={styles.modelSources} aria-hidden="true">
        {responseModels.map((model) => (
          <div className={styles.modelSource} data-provider={model.provider} key={model.name}>
            <span className={styles.modelSourceIcon}>
              <Image src={model.src} alt="" width={14} height={14} />
            </span>
            <span>{model.name}</span>
          </div>
        ))}
      </div>

      <div className={styles.modelOutputLabel} aria-hidden="true">
        <span>Each marker is one response</span>
      </div>

      <div className={styles.responseGatewayNode} aria-hidden="true">
        <div className={styles.gatewayHeader}>
          <span>OPENUI GATEWAY</span>
          <span className={styles.fixedCount}>
            <Slot values={slotValues.fixed} />
            <small>FIXED</small>
          </span>
        </div>
        <div className={styles.gatewayMetrics}>
          <GatewayMetric label="RESPONSES CHECKED" values={slotValues.checked} tone="neutral" />
          <GatewayMetric label="ERROR TYPES FIXED" value="4" tone="error" />
          <GatewayMetric label="RESPONSES DELIVERED" values={slotValues.delivered} tone="valid" />
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
      viewBox={mobile ? "0 0 390 620" : "0 0 1280 520"}
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

function Slot({ values }: { values: string[] }) {
  return (
    <span className={styles.slotViewport}>
      <span className={styles.slotTrack}>
        {values.map((value) => (
          <b key={value}>{value}</b>
        ))}
      </span>
    </span>
  );
}

function GatewayMetric({
  label,
  value,
  values,
  tone,
}: {
  label: string;
  value?: string;
  values?: string[];
  tone: "neutral" | "error" | "valid";
}) {
  return (
    <div className={styles.gatewayMetric} data-tone={tone}>
      <i />
      <span>{label}</span>
      {values ? <Slot values={values} /> : <b>{value}</b>}
    </div>
  );
}

function ResponseMarker({ tone }: { tone: ResponseTone }) {
  if (tone === "root") {
    return (
      <path d="M 0 -6 Q .8 -6 1.25 -5.2 L 6 3.8 Q 6.5 5 5.1 5 H -5.1 Q -6.5 5 -6 3.8 L -1.25 -5.2 Q -.8 -6 0 -6 Z" />
    );
  }
  if (tone === "reference") return <rect x="-5" y="-5" width="10" height="10" rx="2" />;
  if (tone === "type") return <circle r="5" />;
  return <circle r="5" />;
}
