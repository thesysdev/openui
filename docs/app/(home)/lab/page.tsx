import { labProjects } from "@/lib/lab-projects";
import { ArrowUpRight, Plus } from "lucide-react";
import type { Metadata } from "next";
import { BevelButton } from "../components/Button/BevelButton";
import { PageHero, PageHeroAccent } from "../components/PageHero/PageHero";
import { Footer } from "../sections/Footer/Footer";
import styles from "./page.module.css";

const TYPE_ACCENT: Record<string, "blue" | "green" | "purple" | "orange" | "slate"> = {
  Tool: "purple",
  Plugin: "blue",
  Provider: "green",
  App: "green",
  Extension: "blue",
  Package: "purple",
  Framework: "orange",
  Example: "slate",
  Article: "purple",
};

const DISCORD_URL = "https://discord.gg/suzHfJnpw";

export const metadata: Metadata = {
  title: "OpenUI Lab",
  description: "Official and community projects built around OpenUI.",
  alternates: { canonical: "/lab" },
  openGraph: {
    title: "OpenUI Lab",
    description: "Discover official and community projects built around OpenUI.",
    url: "/lab",
    type: "website",
  },
  twitter: {
    title: "OpenUI Lab",
    description: "Discover official and community projects built around OpenUI.",
    card: "summary_large_image",
  },
};

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export default function LabPage() {
  return (
    <main className={styles.page}>
      <PageHero
        smallSubtitle
        title={
          <>
            OpenUI <PageHeroAccent>Lab</PageHeroAccent>
          </>
        }
        subtitle={
          <>
            Tools, packages, plugins, and examples
            <br />
            for building with OpenUI across the stack.
          </>
        }
        actions={
          <>
            <BevelButton
              variant="primary"
              href="https://github.com/thesysdev/openui/issues"
              external
              label="Submit a project"
              badge={<Plus className={styles.actionIcon} strokeWidth={2.25} aria-hidden="true" />}
            />
            <BevelButton
              variant="secondary"
              href={DISCORD_URL}
              external
              label="Share on Discord"
              badge={<DiscordIcon className={styles.actionIcon} />}
            />
          </>
        }
      />

      <div className={styles.contentSection}>
        <section className={styles.directorySection} id="directory">
          <div className={styles.grid}>
            {labProjects.map((item) => {
              return (
                <article
                  className={styles.card}
                  data-accent={TYPE_ACCENT[item.type] ?? "slate"}
                  key={item.name}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderContent}>
                      <h3 className={styles.cardTitle}>{item.name}</h3>
                      <div className={styles.tags}>
                        <span className={styles.typeTag}>{item.type}</span>
                        <span className={styles.statusMeta}>by {item.status}</span>
                      </div>
                    </div>
                  </div>
                  <p className={styles.cardDescription}>{item.description}</p>
                  <div className={styles.cardLinks}>
                    {item.links.map((link) => (
                      <a
                        className={styles.cardLink}
                        href={link.href}
                        key={`${item.name}-${link.label}`}
                        {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      >
                        {link.label}
                        <ArrowUpRight
                          className={styles.cardLinkArrow}
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />
                      </a>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <section className={styles.submitSection}>
        <div className={styles.submitCopy}>
          <h2 className={styles.sectionTitle}>Add your project</h2>
          <p className={styles.submitDescription}>
            Open an issue or PR with the items below, or share it in our Discord.
          </p>
          <ol className={styles.submitSteps}>
            <li>Package link &amp; description</li>
            <li>Install steps</li>
            <li>Maintainer contact &amp; license</li>
            <li>
              Status:&nbsp;
              <span className={styles.stepDetail}>Official, Community, or Experimental</span>
            </li>
          </ol>
        </div>
        <div className={styles.submitActions}>
          <BevelButton
            variant="primary"
            href="https://github.com/thesysdev/openui/issues"
            external
            label="Submit a project"
            badge={<Plus className={styles.actionIcon} strokeWidth={2.25} aria-hidden="true" />}
          />
          <BevelButton
            variant="secondary"
            href={DISCORD_URL}
            external
            label="Share on Discord"
            badge={<DiscordIcon className={styles.actionIcon} />}
          />
        </div>
      </section>

      <Footer />
    </main>
  );
}
