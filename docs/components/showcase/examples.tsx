import { EXAMPLE_CATEGORIES, type ExampleCategoryId } from "@/lib/example-categories";
import { getExamplesInCategory, type RepoExample } from "@/lib/examples-catalog";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { CardLink, CardTags } from "./cards";
import { RunLocally } from "./run-locally";
import styles from "./showcase.module.css";

/** One section of the Integrations page. Its `##` heading lives in the MDX, so it shows in the TOC. */
export function ExampleCategory({ id }: { id: ExampleCategoryId }) {
  const category = EXAMPLE_CATEGORIES.find((c) => c.id === id);
  // First-party cards lead each section. Within each group, longest description first, so cards
  // sharing a row have similar heights.
  // Official first, then featured, then the rest of the community.
  const rank = (example: RepoExample) => (!example.community ? 0 : example.featured ? 1 : 2);
  const examples = getExamplesInCategory(id).sort(
    (a, b) =>
      rank(a) - rank(b) ||
      Number(b.firstParty) - Number(a.firstParty) ||
      b.description.length - a.description.length,
  );
  if (!category || examples.length === 0) return null;

  return (
    <>
      <p className={styles.categoryDescription}>{category.description}</p>
      <div className={styles.grid}>
        {examples.map((example) => (
          <article key={example.name} className={`${styles.card} ${styles.exampleCard}`}>
            <div className={styles.cardIdentity}>
              {/* Brand marks keep their intrinsic aspect ratio, as on the integrations page. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={`${example.name} logo`}
                src={example.logo}
                className={example.logoIsDark ? styles.cardLogoDark : styles.cardLogo}
              />
              <h4 className={styles.cardTitle}>{example.title}</h4>
              <CardTags
                className={styles.identityTag}
                tags={[
                  example.featured ? "Featured" : null,
                  example.community ? "Community" : null,
                ]}
              />
            </div>
            <p className={styles.cardDescription}>{example.description}</p>
            <div className={styles.cardLinks}>
              {example.runnable ? (
                <RunLocally title={example.title} name={example.name} env={example.env} />
              ) : null}
              <CardLink label="Source" href={example.sourceUrl} external />
              {example.guideUrl ? (
                <Link className={styles.cardLink} href={example.guideUrl}>
                  <BookOpen aria-hidden className={styles.cardLinkIcon} />
                  Guide
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
