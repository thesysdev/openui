import { EXAMPLE_CATEGORIES } from "@/lib/example-categories";
import { EXAMPLES_REPO_URL, getExamplesInCategory } from "@/lib/examples-catalog";
import { labProjects } from "@/lib/lab-projects";
import { ArrowUpRight, BookOpen } from "lucide-react";
import Link from "next/link";
import styles from "./examples-gallery.module.css";
import { RunLocally } from "./run-locally";

type FeaturedProject = {
  name: string;
  tagline: string;
  description: string;
  image: { light: string; dark: string };
  links: { label: string; href: string; external?: boolean }[];
};

const FEATURED_PROJECTS: FeaturedProject[] = [
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

function CardLink({ label, href, external }: { label: string; href: string; external?: boolean }) {
  if (external) {
    return (
      <a className={styles.cardLink} href={href} target="_blank" rel="noopener noreferrer">
        {label}
        <ArrowUpRight aria-hidden className={styles.cardLinkIcon} />
      </a>
    );
  }

  return (
    <Link className={styles.cardLink} href={href}>
      {label}
    </Link>
  );
}

export function FeaturedProjects() {
  return (
    <div className={styles.featuredGrid}>
      {FEATURED_PROJECTS.map((project) => (
        <article key={project.name} className={styles.featuredCard}>
          <div className={styles.featuredMedia}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.imageLight} src={project.image.light} alt="" loading="lazy" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={styles.imageDark} src={project.image.dark} alt="" loading="lazy" />
          </div>
          <div className={styles.featuredBody}>
            <span className={styles.eyebrow}>{project.tagline}</span>
            <h3 className={styles.cardTitle}>{project.name}</h3>
            <p className={styles.cardDescription}>{project.description}</p>
            <div className={styles.cardLinks}>
              {project.links.map((link) => (
                <CardLink key={link.label} {...link} />
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
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
    <div className={styles.grid}>
      {projects.map((project) => (
        <article key={project.name} className={styles.card}>
          <div className={styles.cardHeader}>
            <h4 className={styles.cardTitle}>{project.name}</h4>
            <span className={styles.tag}>{project.type}</span>
          </div>
          <p className={styles.cardDescription}>{project.description}</p>
          <div className={styles.cardLinks}>
            {project.links.map((link) => (
              <CardLink key={link.label} {...link} external />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
