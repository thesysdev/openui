import { FEATURED_PROJECTS, PLAYGROUND } from "@/lib/demo-projects";
import { getCommunityProjects } from "@/lib/lab-projects";
import { LinkCardGrid, ShowcaseGrid } from "./cards";

export function Playground() {
  return <ShowcaseGrid items={PLAYGROUND} clickable />;
}

export function FeaturedProjects() {
  return <ShowcaseGrid items={FEATURED_PROJECTS} clickable />;
}

export function CommunityProjects() {
  const projects = getCommunityProjects();

  return (
    <LinkCardGrid
      clickable
      items={projects.map((project) => ({
        name: project.name,
        description: project.description,
        tag: project.type === "App" ? undefined : project.type,
        featured: project.featured,
        links: project.links.map((link) => ({ ...link, external: true })),
      }))}
    />
  );
}
