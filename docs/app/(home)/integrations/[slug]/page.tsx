import { Footer } from "@/app/(home)/sections/Footer/Footer";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyCommand } from "../copy-command";
import {
  getIntegrationCategory,
  getRelatedIntegrations,
  integrationBySlug,
  integrations,
} from "../data";
import { IntegrationLogo } from "../integration-logo";
import styles from "../page.module.css";

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return integrations.map((integration) => ({ slug: integration.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const integration = integrationBySlug.get(slug);
  if (!integration) notFound();

  return {
    title: `${integration.name} integration`,
    description: integration.summary,
    alternates: { canonical: `/integrations/${integration.slug}` },
    openGraph: {
      title: `${integration.name} × OpenUI`,
      description: integration.summary,
      url: `/integrations/${integration.slug}`,
      type: "article",
    },
  };
}

export default async function IntegrationDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const integration = integrationBySlug.get(slug);
  if (!integration) notFound();

  const category = getIntegrationCategory(integration.category);
  const related = getRelatedIntegrations(integration);

  return (
    <main className={styles.detailPage}>
      <div className={styles.detailHero}>
        <div className={styles.detailHeroInner}>
          <Link className={styles.detailBackLink} href="/integrations">
            <ArrowLeft size={15} aria-hidden="true" />
            All integrations
          </Link>

          <div className={styles.detailLockup}>
            <div className={styles.detailHeadingRow}>
              <IntegrationLogo className={styles.detailMark} integration={integration} />
              <h1>{integration.name}</h1>
            </div>
            <p>{integration.summary}</p>
          </div>
        </div>
      </div>

      <div className={styles.detailBand}>
        <div className={styles.detailLayout}>
          <article className={styles.detailArticle}>
            <section>
              <h2>How it connects to OpenUI</h2>
              <p className={styles.detailLead}>{integration.howItWorks}</p>
            </section>

            {integration.install ? (
              <section className={styles.installSection}>
                <div>
                  <p className={styles.detailEyebrow}>Start here</p>
                  <h2>Install or scaffold</h2>
                </div>
                <div className={styles.codeBlock}>
                  <code>{integration.install}</code>
                  <CopyCommand command={integration.install} />
                </div>
              </section>
            ) : null}

            <section className={styles.flowSection}>
              <h2>Integration steps</h2>
              <ol className={styles.flowList}>
                {integration.steps.map((step, index) => (
                  <li key={step.title}>
                    <span className={styles.flowNumber}>{index + 1}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </article>

          <aside className={styles.resourceSidebar}>
            <div className={styles.resourceCard}>
              <p className={styles.resourceTitle}>Resources</p>
              <div className={styles.resourceLinks}>
                {integration.links.map((link) => {
                  const external = link.href.startsWith("http");
                  const content = (
                    <>
                      <span>
                        <small>{link.kind}</small>
                        {link.label}
                      </span>
                      {external ? (
                        <ArrowUpRight size={15} aria-hidden="true" />
                      ) : (
                        <ArrowRight size={15} aria-hidden="true" />
                      )}
                    </>
                  );

                  return external ? (
                    <a
                      href={link.href}
                      key={`${link.kind}-${link.href}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {content}
                    </a>
                  ) : (
                    <Link href={link.href} key={`${link.kind}-${link.href}`}>
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className={styles.resourceCard}>
              <p className={styles.resourceTitle}>Related {category.shortTitle.toLowerCase()}</p>
              <div className={styles.relatedLinks}>
                {related.map((item) => (
                  <Link href={`/integrations/${item.slug}`} key={item.slug}>
                    <IntegrationLogo className={styles.relatedMark} integration={item} />
                    <span>{item.name}</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <div className={styles.detailBackRow}>
          <Link href={`/integrations#${category.id}`}>
            Browse {category.shortTitle.toLowerCase()}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
