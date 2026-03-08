import { getPageImage, source } from "@/lib/source";
import { ImageResponse } from "@takumi-rs/image-response";
import { generate as DefaultImage } from "fumadocs-ui/og/takumi";
import { notFound } from "next/navigation";

export const revalidate = false;

export async function GET(_req: Request, { params }: RouteContext<"/og/docs/[...slug]">) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();

  return new ImageResponse(
    <DefaultImage title={page.data.title} description={page.data.description} site="My App" />,
    {
      width: 1200,
      height: 630,
      format: "webp",
    },
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page).segments,
  }));
}
