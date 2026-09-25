# Vercel documentation patterns relevant to OpenUI

Research date: 2026-09-01

## Scope

This note examines first-party Vercel documentation patterns that are useful for
an open-source project with paid hosted products, then maps them to the current
OpenUI documentation and package structure.

## Transferable patterns from Vercel

### Organize first by product, then by user task

Vercel's docs home routes readers by intent, while the full documentation tree
is grouped into product domains. Product subtrees generally progress from a
landing page to getting started, concepts, task guides, reference, limits, and
pricing. Longer tutorials live in the Knowledge Base rather than in the core
product reference.

Sources: [Vercel docs](https://vercel.com/docs), [documentation
sitemap](https://vercel.com/docs/sitemap.md), [Vercel Knowledge
Base](https://vercel.com/kb).

### Give each page one job

Vercel's public writing guidance distinguishes landing pages, tutorials,
how-to guides, conceptual explanations, reference pages, and troubleshooting.
The tone changes with the page type: tutorials teach an end-to-end path,
how-to pages optimize for task completion, and references optimize for exact
lookup.

Source: [Vercel writing
guidelines](https://github.com/vercel-labs/writing-guidelines/blob/main/README.md).

### Use concise, operational language

The writing guidelines favor active voice, present tense, direct `you`,
imperative steps, sentence-case headings, and a summary at the start of each
page and major section. They discourage filler and subjective promises such as
"easy" or "simple." Terms and acronyms are defined on first use.

Source: [Vercel writing
guidelines](https://github.com/vercel-labs/writing-guidelines/blob/main/README.md).

### Make examples runnable and visually consistent

Vercel examples consistently identify the language and filename, put the first
runnable example before exhaustive detail, use package-manager or
framework/language tabs when the variants are genuinely equivalent, and keep
snippets short. Terminal commands are visually distinct from source files.

Sources: [Vercel Functions
quickstart](https://vercel.com/docs/functions/quickstart), [Vercel CLI deploy
reference](https://vercel.com/docs/cli/deploy), [Vercel writing
guidelines](https://github.com/vercel-labs/writing-guidelines/blob/main/README.md).

### Generate exhaustive reference; hand-write the learning path

Vercel combines an OpenAPI-generated endpoint reference with hand-written
Overview, Getting Started, and Errors pages. Endpoint pages expose the method
and path, authentication, typed parameters, request and response schemas,
examples, status-specific errors, and related endpoints. REST and SDK
references use parallel resource taxonomies instead of mixing every client
surface into a single page.

Sources: [REST API getting
started](https://vercel.com/docs/rest-api/getting-started), [example endpoint
reference](https://vercel.com/docs/rest-api/projects/create-a-new-project),
[REST API errors](https://vercel.com/docs/rest-api/errors), [SDK
reference](https://vercel.com/docs/rest-api/sdk), [OpenAPI documentation
announcement](https://vercel.com/changelog/automatic-rest-api-documentation-with-openapi).

### State open-source and paid boundaries directly

Vercel's eve documentation identifies the framework as open source, states
what the Vercel-hosted documentation covers, and links to the independent
framework and self-hosting paths. Pricing documentation maps charges and limits
to the hosted infrastructure involved.

Sources: [eve on Vercel](https://vercel.com/docs/eve), [eve pricing and
limits](https://vercel.com/docs/eve/pricing).

### Publish documentation for people and agents

Vercel exposes structured page metadata, Markdown versions, `llms.txt`, and a
semantic sitemap. This makes product boundaries, prerequisites, related pages,
and page types machine-readable as well as visible in the HTML experience.

Source: [Markdown and agent
discovery](https://vercel.com/docs/agent-resources/markdown-access).

## Current OpenUI inventory

The repository currently presents five top-level documentation areas:
OpenUI Lang, Build Agents, Gateway, Observability, and API Reference. The global
and nested navigation behavior is defined in
[`docs/lib/docs-navigation.ts`](../lib/docs-navigation.ts), and authored page
order lives in the section `meta.json` files under
[`docs/content/docs`](../content/docs).

The implementation has more distinct reader-facing roles than the current
three-layer introduction makes explicit:

- OpenUI Lang and its framework runtimes define, generate, parse, and render the
  interface program.
- Agent UI and integration packages connect that renderer to conversation and
  agent runtimes.
- Gateway owns the hosted model-generation and correction path.
- Observability combines an open-source local event bus with a hosted telemetry
  sink and product dashboards.

The package descriptions in the workspace manifests support this split. In
particular, the repository contains framework runtimes for React, Vue, and
Svelte; headless and prebuilt React agent UI layers; assistant-ui and LangChain
integrations; email and browser-bundle targets; CLI and developer tooling; and
separate local and hosted observability packages.

The current package API section has dedicated pages for eight of the fourteen
public workspace packages. The missing package references are `lang-core`,
`vue-lang`, `svelte-lang`, `browser-bundle`, `observability`, and
`observability-cloud`.

## Implications for the OpenUI information architecture

1. Keep one documentation portal, but make the commercial boundary explicit by
   grouping Gateway and hosted Observability under an **OpenUI Cloud** branch.
2. Keep a complete, first-class **Open source** path. A reader must be able to
   define components, generate a prompt, call a model directly, render the
   response, and instrument a custom sink without entering the Cloud section.
3. Replace the mixed **Build Agents** bucket with clearer **SDKs** and
   **Integrations** groupings, or use those as two subgroups beneath one branch.
4. Add a package chooser and dependency diagram before package-level pages.
   Readers should understand `lang-core` versus a renderer, headless chat versus
   `AgentInterface`, and local observability versus the hosted sink.
5. Merge the overlapping OpenUI Lang introduction and overview. Move exhaustive
   syntax, versioned specifications, exports, and endpoint schemas into
   Reference, leaving the main product tree task-oriented.
6. Maintain hand-written overview, quickstart, concept, guide, pricing, and
   troubleshooting pages. Generate TypeScript reference from source/TSDoc and
   Gateway HTTP reference from OpenAPI.
7. Add explicit availability metadata to every page: **Open source**,
   **OpenUI Cloud**, **Beta**, **Deprecated**, or a combination.
8. Preserve the existing `llms.txt` support and extend page frontmatter with
   page type, product, availability, prerequisites, last-updated date, and
   related pages.
