import { blog } from "@/lib/source";
import Link from "next/link";

export default function BlogIndex() {
  const posts = blog.getPages().sort((a, b) => {
    return new Date(b.data.date).getTime() - new Date(a.data.date).getTime();
  });

  return (
    <main className="mx-auto w-full max-w-[800px] flex-1 px-4 py-16 md:px-8">
      <h1 className="mb-12 text-4xl font-bold">Blog</h1>
      <div className="flex flex-col divide-y divide-fd-border">
        {posts.map((post) => (
          <Link
            key={post.url}
            href={post.url}
            className="group flex flex-col gap-1 py-6 no-underline"
          >
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-lg font-semibold transition-colors group-hover:text-fd-primary">
                {post.data.title}
              </h2>
              <time className="shrink-0 text-sm text-fd-muted-foreground">
                {new Date(post.data.date).toLocaleDateString()}
              </time>
            </div>
            <p className="text-sm text-fd-muted-foreground">{post.data.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
