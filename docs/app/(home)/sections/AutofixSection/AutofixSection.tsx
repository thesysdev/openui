import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import type { ReactNode } from "react";
import { BevelButton } from "../../components/Button/BevelButton";
import styles from "./AutofixSection.module.css";

const PROVIDERS = [
  {
    name: "OpenRouter",
    icon: "/brand-icons/openrouter-glyph.svg",
    darkIcon: "/brand-icons/openrouter-glyph-dark.svg",
    markClass: styles.openRouterMark,
  },
  { name: "Microsoft Azure", icon: "/brand-icons/azure.svg", markClass: styles.azureMark },
  { name: "Amazon Bedrock", icon: "/brand-icons/bedrock.svg", markClass: styles.bedrockMark },
  {
    name: "Vercel AI Gateway",
    icon: "/brand-icons/vercel.svg",
    markClass: styles.vercelMark,
  },
] as const;

export function AutofixSection({
  tone = "page",
  headingLevel = "h2",
  content,
  actionOnRight = false,
}: {
  actionOnRight?: boolean;
  tone?: "page" | "cloud";
  headingLevel?: "h2" | "h3";
  content?: {
    title: ReactNode;
    description: ReactNode;
    action: { label: string; href: string };
    visual?: ReactNode;
  };
}) {
  const Heading = headingLevel;

  return (
    <section
      className={`${styles.section} ${tone === "cloud" ? styles.cloud : ""} ${actionOnRight ? styles.actionOnRight : ""}`.trim()}
    >
      <div className={styles.banner}>
        <div className={styles.copy}>
          <Heading className={styles.title}>
            {content?.title ?? (
              <>
                <span className={styles.providerLine}>
                  <span>Keep your existing model provider,</span>
                  <span
                    className={styles.providerStack}
                    aria-label="Works with leading model providers and AI gateways"
                  >
                    {PROVIDERS.map((provider) => (
                      <span
                        className={styles.providerLogo}
                        key={provider.name}
                        data-tooltip={provider.name}
                        aria-label={provider.name}
                        tabIndex={0}
                      >
                        <Image
                          className={`${provider.markClass} ${"darkIcon" in provider ? styles.providerLogoLight : ""}`.trim()}
                          src={provider.icon}
                          alt={`${provider.name} logo`}
                          width={18}
                          height={18}
                        />
                        {"darkIcon" in provider ? (
                          <Image
                            className={`${provider.markClass} ${styles.providerLogoDark}`}
                            src={provider.darkIcon}
                            alt={`${provider.name} logo`}
                            width={18}
                            height={18}
                          />
                        ) : null}
                      </span>
                    ))}
                  </span>
                </span>
                <span className={styles.titleLine}>Add reliability with Autofix.</span>
              </>
            )}
          </Heading>
          <p className={styles.description}>
            {content?.description ??
              "Keep your existing model calls, direct or through AI gateways. Add one Autofix API call to repair invalid generations before users see them."}
          </p>
          {!actionOnRight && (
            <BevelButton
              className={styles.cta}
              variant="secondary"
              href={content?.action.href ?? "/docs/autofix"}
              label={content?.action.label ?? "View docs"}
              badge={<ArrowRight size={16} weight="bold" />}
            />
          )}
        </div>

        {actionOnRight ? (
          <div className={styles.bannerAction}>
            <BevelButton
              className={styles.cta}
              variant="secondary"
              href={content?.action.href ?? "/docs/autofix"}
              label={content?.action.label ?? "View docs"}
              badge={<ArrowRight size={16} weight="bold" />}
            />
          </div>
        ) : content ? (
          <div className={styles.visual}>{content.visual}</div>
        ) : (
          <div
            className={styles.visual}
            role="img"
            aria-label="Invalid generated output corrected into valid UI by Autofix"
          >
            <div className={styles.illustration} aria-hidden="true">
              <Image
                className={`${styles.illustrationImage} ${styles.illustrationImageLight}`}
                src="/images/gateway/autofix-illustration-light.webp"
                alt="Invalid generated output corrected into valid UI by Autofix"
                width={1940}
                height={636}
                unoptimized
              />
              <Image
                className={`${styles.illustrationImage} ${styles.illustrationImageDark}`}
                src="/images/gateway/autofix-illustration-dark.webp"
                alt="Invalid generated output corrected into valid UI by Autofix"
                width={1940}
                height={636}
                unoptimized
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
