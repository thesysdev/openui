import { EXAMPLE_CATEGORIES } from "@/lib/example-categories";
import { EXAMPLES_REPO_URL, getExamplesInCategory } from "@/lib/examples-catalog";
import { labProjects } from "@/lib/lab-projects";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { CardLink, LinkCardGrid, ShowcaseGrid, type ShowcaseItem } from "./cards";
import { RunLocally } from "./run-locally";
import styles from "./showcase.module.css";

const FEATURED_PROJECTS: ShowcaseItem[] = [
  {
    name: "OpenClaw OS",
    tagline: "Agent workspace",
    description:
      "The default workspace for OpenClaw. Agents generate interactive apps and artifacts that stay updated with live data.",
    image: { light: "/nav/openclaw-light.webp", dark: "/nav/openclaw-dark.webp" },
    links: [
      { label: "Website", href: "/openclaw-os" },
      { label: "GitHub", href: "https://github.com/thesysdev/openclaw-os", external: true },
    ],
  },
  {
    name: "AppLess",
    tagline: "Phone OS concept",
    description:
      "An experimental phone with no apps. Ask for what you need and OpenUI streams a native interface for it on iOS and Android.",
    image: { light: "/nav/appless-light.webp", dark: "/nav/appless-dark.webp" },
    links: [{ label: "GitHub", href: "https://github.com/thesysdev/appless", external: true }],
  },
];

export function FeaturedProjects() {
  return <ShowcaseGrid items={FEATURED_PROJECTS} />;
}

export function RepoExamples() {
  return (
    <div className={styles.categories}>
      {EXAMPLE_CATEGORIES.map((category) => {
        const examples = getExamplesInCategory(category.id);
        if (examples.length === 0) return null;

        return (
          <section key={category.id} aria-labelledby={category.id}>
            <h3 id={category.id} className={styles.categoryTitle}>
              {category.title}
            </h3>
            <p className={styles.categoryDescription}>{category.description}</p>
            <div className={styles.grid}>
              {examples.map((example) => (
                <article key={example.name} className={styles.card}>
                  <h4 className={styles.cardTitle}>{example.title}</h4>
                  <p className={styles.cardDescription}>{example.description}</p>
                  <div className={styles.cardLinks}>
                    <RunLocally title={example.title} name={example.name} envKey={example.envKey} />
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
          </section>
        );
      })}
    </div>
  );
}

export function CommunityProjects() {
  // Community work that was merged into `examples/` already has a card above.
  const projects = labProjects.filter(
    (project) =>
      project.status === "Community" &&
      !project.links.some((link) => link.href.startsWith(EXAMPLES_REPO_URL)),
  );

  return (
    <LinkCardGrid
      items={projects.map((project) => ({
        name: project.name,
        description: project.description,
        tag: project.type,
        links: project.links.map((link) => ({ ...link, external: true })),
      }))}
    />
  );
}
