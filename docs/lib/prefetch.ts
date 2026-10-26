// Routes that render the full @openuidev/react-ui library (~2.2 MB of JS). Next.js
// prefetches a linked route's JS as soon as the link is in view, so a link to one
// of these would download the library on the page that only links to it. Links to
// them don't prefetch; the route loads when clicked.
const HEAVY_ROUTES = ["/chat", "/compare", "/debug", "/demo/github", "/openui-vs-json"];

/** `prefetch` for a <Link> to `href`: off for the heavy routes, the default otherwise. */
export function prefetchFor(href: string | undefined): false | undefined {
  if (!href) return undefined;
  const path = href.split(/[?#]/)[0];
  return HEAVY_ROUTES.some((route) => path === route || path.startsWith(`${route}/`))
    ? false
    : undefined;
}
