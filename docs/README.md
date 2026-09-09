# OpenUI Docs

Documentation site for the OpenUI SDK, built with [Next.js](https://nextjs.org) + [Fumadocs](https://fumadocs.dev) + the OpenUI Design System.

## Setup

This project lives at `docs` inside the pnpm workspace. It links `@openuidev/lang-core`, `@openuidev/react-lang`, `@openuidev/react-headless`, `@openuidev/react-ui`, and `@openuidev/cli` from the monorepo via `workspace:*` / `workspace:^`.

```bash
# Install from workspace root
pnpm install

# Start the documentation development server
pnpm --filter @openuidev/docs dev

# Build the documentation site for production
pnpm --filter @openuidev/docs build
```

### Chat and comparison demo configuration

`/chat` remains the standalone OpenUI OSS and Cloud chat and starts in **OpenUI OSS** mode. Its
selected mode is not stored across reloads.

`/compare` compares two visible response modes at a time and defaults to **Rendered Markdown vs
OpenUI Cloud**. Use its page-level switcher to show **Markdown vs OSS** or **OSS vs Cloud**. The
selected pair is stored in the `pair` query parameter. All three comparison providers remain
mounted and receive each shared prompt; switching the visible pair resets the demo. Markdown and
OSS generation use the existing server-side `OPENROUTER_API_KEY`.

OpenUI Cloud requires the following server-side variables. If either is missing, Cloud requests
show the unavailable state at runtime:

```bash
OPENUI_CLOUD_DEMO_ENABLED=true
THESYS_API_KEY=your-cloud-key
```

Do not expose `THESYS_API_KEY` through a `NEXT_PUBLIC_*` variable. The browser generates an
anonymous user ID, retains it in `sessionStorage`, and sends it with Cloud requests. Active
comparison threads are not restored after a refresh.

The Cloud feature flag is intentionally fail-closed. Keep it disabled on public deployments until
a shared, cross-instance session-and-IP rate limiter, Cloud organization budgets/token scopes, and
an approved conversation retention/deletion process are in place. Same-origin validation is an
additional browser safeguard, not a substitute for those cost controls.

## Project structure

```
docs/
├── app/
│   ├── layout.tsx                          # Root layout (html, body, fonts, providers)
│   ├── global.css                          # Global styles + design-system CSS imports
│   ├── providers.tsx                       # App-level providers
│   ├── robots.ts                           # Robots.txt generation
│   ├── sitemap.ts                          # Sitemap generation
│   │
│   ├── (home)/                             # Marketing homepage
│   │   ├── layout.tsx                      # SiteMarketingHeader (own Navbar, NOT DocsNavbar)
│   │   ├── page.tsx                        # Landing page
│   │   ├── sections/                       # Hero, Features, Steps, Footer, Navbar, etc.
│   │   └── components/                     # Accordion, Button, StackChip, TweetWall, etc.
│   │
│   ├── docs/                               # Fumadocs documentation pages
│   │   ├── layout.tsx                      # DocsLayout (global/nested sidebar, nav)
│   │   └── [[...slug]]/page.tsx            # Catch-all rendering MDX from content/docs/
│   │
│   ├── components/                         # Component / Design System pages
│   │   ├── layout.tsx                      # AppThemeProvider + TopNav shell
│   │   ├── page.tsx                        # Design System landing page
│   │   ├── blocks/                         # Component block previews
│   │   ├── foundation/                     # Design tokens (colors, spacing, etc.)
│   │   ├── compose/                        # Composition examples
│   │   ├── customize/                      # Component customizer
│   │   └── theme-builder/                  # Theme creator interface
│   │
│   ├── blog/                               # Blog pages
│   ├── chat/                               # Standalone OpenUI OSS and Cloud chat
│   ├── compare/                            # Pairwise Markdown, OSS, and Cloud comparison
│   ├── demo/                               # Demo route
│   ├── playground/                         # Interactive playground
│   │
│   ├── api/                                # API routes
│   │   ├── search/route.ts                 # Search endpoint
│   │   ├── chat/route.ts                   # Chat API
│   │   ├── demo/github/stream/route.ts     # GitHub demo stream
│   │   └── playground/stream/route.ts      # Playground stream
│   ├── og/docs/[...slug]/route.tsx         # OG image generation
│   └── llms.txt/, llms-full.txt/, llms.mdx/  # LLM-friendly content endpoints
│
├── components/                             # Docs-site components
│   ├── docs-navbar.tsx                     # Top navbar (section tabs, search, GitHub)
│   ├── brand-logo.tsx                      # Brand logo + GitHub star button
│   ├── theme-toggle.tsx                    # Dark/light mode toggle
│   ├── ai/                                 # AI-powered page actions
│   └── ...                                 # Site headers, marketing components, etc.
│
├── content/
│   ├── docs/                               # MDX content (Fumadocs source)
│   │   ├── index.mdx                       # Global docs overview at /docs
│   │   ├── meta.json                       # Root content order
│   │   ├── openui-lang/                    # OpenUI Lang docs
│   │   ├── agent/                          # Agent Interface docs
│   │   ├── build-agents/                   # Existing chat UI and agent framework guides
│   │   ├── api-reference/                  # API reference
│   │   └── mcp/                            # MCP docs
│   └── blog/                               # Blog MDX content
│
├── generated/                              # Autogenerated prompt & spec outputs
│   ├── chat-system-prompt.txt
│   ├── playground-component-spec.json
│   └── playground-system-prompt.txt
│
├── shared/                                 # Shared code and style tokens
│   ├── design-system/                      # Legacy design system code (unused by active components)
│   │   ├── components/                     # UI components (SideNav, TopNav, preview/, etc.)
│   │   ├── config/                         # Navigation config, compose example data
│   │   ├── styles/                         # CSS custom properties (colors, spacing, typography)
│   │   └── types/                          # TypeScript types
│   └── theme/                              # Application theme styling
│
├── lib/                                    # Utilities
│   ├── source.ts                           # Fumadocs source config
│   ├── layout.shared.tsx                   # Shared layout options
│   ├── cn.ts                               # className merge utility
│   ├── chat-library.ts                     # Chat library config
│   ├── demo-credits.ts                     # Demo credits data
│   └── playground-library.ts               # Playground library config
│
├── imports/                                # Shared imported assets/components
├── types/                                  # TypeScript type declarations
├── public/                                 # Static assets
│
├── next.config.mjs                         # Redirects, rewrites, turbopack root
├── tsconfig.json                           # Path aliases: @/*, @components/*, @design-system/*
├── source.config.ts                        # Fumadocs MDX collection config
├── postcss.config.mjs                      # PostCSS config
├── eslint.config.mjs                       # ESLint config
├── mdx-components.tsx                      # MDX component overrides
└── package.json
```

## How it works

### Documentation pages (Fumadocs)

MDX files in `content/docs/` are rendered by the catch-all route at `app/docs/[[...slug]]/page.tsx`. Fumadocs handles sidebar generation from `meta.json` files, search indexing, and page layout.

Each section maintains its own navigation structure through its `meta.json` configuration.

### Design System pages

The design system lives at `/components/*` and serves component previews (Blocks / Foundation / Compose) with its own theme provider and navigation under `app/components/`.

Active component-preview specific modules are located under `app/components/` and imported via the `@components/*` path alias. The `shared/design-system/` folder contains legacy implementation code that is not used by active component pages.

### Navigation

The docs use two sidebar modes. The global sidebar introduces the documentation through Start,
Build, Production, and Reference groups. Links with chevrons enter a nested section sidebar for
OpenUI Lang, Build Agents, Agent Interface, Gateway, Observability, or API Reference. Nested page lists continue to come from
each section's `meta.json`; “All docs” restores the global sidebar without changing the current
page. Direct links into a section start in nested mode.

`components/docs-navbar.tsx` provides the shared docs header, search, theme control, and mobile
sidebar trigger.

## Path aliases

| Alias              | Resolves to                | Usage                                           |
| ------------------ | -------------------------- | ----------------------------------------------- |
| `@/*`              | `./` (project root)        | Docs-site code (`@/components/`, `@/lib/`)      |
| `@components/*`    | `./app/components/*`       | Component preview sub-app specific modules      |
| `@design-system/*` | `./shared/design-system/*` | Legacy path alias (unused by active components) |

## Key dependencies

- **`@openuidev/lang-core`**, **`@openuidev/react-lang`**, **`@openuidev/react-headless`**, **`@openuidev/react-ui`**, and **`@openuidev/cli`** — Linked from the monorepo via `workspace:*` / `workspace:^`. Provide core schemas, component libraries, UI controls, hooks, and builders.
- **`fumadocs-core` / `fumadocs-ui` / `fumadocs-mdx`** — Documentation framework.
- **`prism-react-renderer`** — Syntax highlighting in design system code blocks.

## Adding documentation

1. Create an MDX file in the appropriate `content/docs/<section>/` directory.
2. Add the page to the section's `meta.json` `pages` array.
3. The page will automatically appear in the sidebar and be available at `/docs/<section>/<slug>`.

## Adding design system pages

1. Add the route page in `app/components/<section>/`.
2. Add shared components/config inside `app/components/` (imported via the `@components/*` path alias).
3. Update `app/components/config/navigation.ts` with the new nav items.
