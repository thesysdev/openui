import { FEATURED_PROJECTS, PLAYGROUND } from "@/lib/demo-projects";
import { getCommunityProjects } from "@/lib/lab-projects";
import { Plus } from "lucide-react";
import { ShowcaseGrid } from "./cards";
import styles from "./showcase.module.css";

const ADD_PROJECT_URL = "https://github.com/thesysdev/openui/issues";

export function Playground() {
  return <ShowcaseGrid items={PLAYGROUND} clickable wide />;
}

export function FeaturedProjects() {
  return <ShowcaseGrid items={FEATURED_PROJECTS} clickable lead />;
}

export function CommunityProjects() {
  const projects = getCommunityProjects();

  return (
    <ShowcaseGrid
      clickable
      items={projects.map((project) => ({
        name: project.name,
        description: project.description,
        // One capture of the live site serves both themes.
        image: project.screenshot
          ? { light: project.screenshot, dark: project.screenshot }
          : undefined,
        links: project.links.map((link) => ({ ...link, external: true })),
      }))}
      footer={
        <a
          className={styles.addCard}
          href={ADD_PROJECT_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className={styles.addCardIcon} aria-hidden>
            <Plus />
          </span>
          <span className={styles.addCardTitle}>Add your project</span>
          <span className={styles.addCardText}>
            Built something with OpenUI? Open an issue with a link and a short description.
          </span>
        </a>
      }
    />
  );
}
