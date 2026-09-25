import { production } from "@/lib/benchmark-data";
import Image from "next/image";
import { ExternalTextLink } from "../../components/ExternalTextLink/ExternalTextLink";
import {
  FeatureGridSection,
  type GridFeature,
} from "../../sections/FeatureGridSection/FeatureGridSection";
import { GatewayReliabilityDashboardIllustration } from "../../sections/ProductIllustrations/ProductIllustrations";
import styles from "./sections.module.css";

const STACK_FEATURES: GridFeature[] = [
  {
    icon: "chart",
    title: "Provider pricing",
    description: "Tokens are billed at provider rates, with no Gateway markup.",
  },
  {
    icon: "cloud",
    title: "SDK support",
    description: "Chat Completions and Responses endpoints work with your existing SDKs.",
  },
  {
    icon: "key",
    title: "Bring your own keys",
    description:
      "Use your existing OpenAI, Anthropic, or Google Vertex credentials and commitments.",
  },
  {
    icon: "handshake",
    title: "Works with other gateways",
    description: "Run Gateway behind any OpenAI-compatible gateway, including Portkey.",
  },
  {
    icon: "database",
    title: "Keep your cache",
    description: "Add Gateway without changing your upstream cache configuration.",
  },
  {
    icon: "signal",
    title: "Broad model support",
    description: (
      <>
        Use any model through one OpenAI-compatible API.{" "}
        <ExternalTextLink href="/docs/gateway/models">View routing</ExternalTextLink>
        {"."}
      </>
    ),
  },
];

/* The answer to the section above, and only that. It states the outcome and the
   one reason a general-purpose gateway cannot reach it; how the repair is built
   — the parser, the validator, the model that patches the node — is a docs
   concern and used to live here at three times this length.

   The heading mirrors WhySection's: that one names the failure, this one names
   what happens to it. Self-contained on purpose — people land here from anchors
   and scrolls, so it cannot lean on the section above for its subject. */
export function RepairSection() {
  return (
    <section
      className={`${styles.section} ${styles.repairSection}`}
      aria-labelledby="gateway-repair"
    >
      <div className={styles.sectionLockup}>
        <div>
          <h2 id="gateway-repair" className={styles.heading}>
            Fix invalid output before users see it
          </h2>
        </div>
        <p className={styles.lead}>
          Every response is validated against your component library. Invalid ones are repaired in
          the streaming path. Over {Math.floor(100 - production.userVisibleShare)}% render
          successfully.
        </p>
      </div>

      <div className={`${styles.diagram} ${styles.repairIllustrationSpace}`}>
        <GatewayReliabilityDashboardIllustration />
      </div>

      <aside className={styles.customerQuote}>
        <p className={styles.quoteSentence}>
          <a
            className={styles.quoteBrand}
            href="https://www.thesys.dev/customers/entelligence"
            target="_blank"
            rel="noreferrer"
          >
            <span className={styles.quoteLogo}>
              <Image src="/logos/entelligence-mark.svg" alt="" width={32} height={32} />
            </span>
            <span className={styles.quoteCompany}>Entelligence</span>
          </a>{" "}
          <span className={styles.quoteCopy}>
            uses Gateway to catch invalid model output and keep Ask Ellie dependable in production.
          </span>
        </p>
      </aside>

      <div className={styles.repairGrid}>
        <FeatureGridSection
          features={STACK_FEATURES}
          showHeader={false}
          showCompat={false}
          showBottomSeparator={false}
          flushSectionPadding
          flushOuterCards
        />
      </div>
    </section>
  );
}
