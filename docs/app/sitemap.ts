import { BASE_URL, blog, source } from "@/lib/source";
import { integrations } from "./(home)/integrations/data";

const STATIC_PATHS = [
  "/",
  "/demos",
  "/compare",
  "/lab",
  "/integrations",
  "/chat",
  "/blog",
  "/benchmarks",
  "/benchmarks/language",
  "/benchmarks/language/agent.md",
  "/benchmarks/language/data.json",
  "/benchmarks/language/data.csv",
  "/benchmarks/framework",
  "/benchmarks/framework/agent.md",
  "/benchmarks/framework/data.json",
  "/benchmarks/framework/data.csv",
  "/benchmarks/methodology",
  "/benchmarks/agent.md",
  "/benchmarks/data.json",
  "/benchmarks/data.schema.json",
  "/benchmarks/data.csv",
];

export default async function sitemap() {
  const staticRoutes = STATIC_PATHS.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
  }));

  const docsRoutes = source.getPages().map((page) => ({
    url: `${BASE_URL}${page.url}`,
    lastModified: page.data.lastModified,
    changeFrequency: "weekly" as const,
  }));

  const blogRoutes = blog.getPages().map((page) => ({
    url: `${BASE_URL}${page.url}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
  }));

  const integrationRoutes = integrations.map((integration) => ({
    url: `${BASE_URL}/integrations/${integration.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
  }));

  return [...staticRoutes, ...integrationRoutes, ...docsRoutes, ...blogRoutes];
}
