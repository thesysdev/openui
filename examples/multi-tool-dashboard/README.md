# Multi-Tool Dashboard

A CEO dashboard builder powered by [OpenUI](https://openui.com) and openui-lang. Chat with an LLM to create live dashboards pulling real data from **Stripe**, **PostHog**, **GitHub**, and **Google Calendar**.

> Describe what you want in plain English. Get a live, interactive dashboard with real data.

## Data Sources

| Source | What it provides | Auth method |
|--------|-----------------|-------------|
| **Stripe** | Revenue, charges, balance, subscriptions (MRR) | Secret key (`sk_test_...` or `sk_live_...`) |
| **PostHog** | Product analytics — DAU, pageviews, funnels, top events | Personal API key (`phx_...`) |
| **GitHub** | Engineering velocity — repos, commits, activity, contributors | Personal access token (`ghp_...`) |
| **Google Calendar** | Meeting schedule, daily agenda, upcoming events | OAuth via `gws` CLI |

All data sources are optional. The dashboard works with any combination — just configure the ones you have.

## Quick Start

```bash
# From the monorepo root
pnpm install

# Configure your data sources (see setup below)
cp examples/multi-tool-dashboard/.env.example examples/multi-tool-dashboard/.env
# Edit .env with your keys

# Run the dev server
cd examples/multi-tool-dashboard
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and pick a starter prompt or type your own.

## Environment Variables

Create a `.env` file in the project root:

```bash
# ── LLM (required) ──────────────────────────────────────────────────────────
# Any OpenAI-compatible API. At least one of these is required.
LLM_API_KEY=sk-...
# LLM_BASE_URL=https://api.openai.com/v1    # default
# LLM_MODEL=gpt-5.4                          # default

# ── Stripe (revenue & financials) ───────────────────────────────────────────
STRIPE_SECRET_KEY=sk_test_...

# ── PostHog (product analytics) ─────────────────────────────────────────────
POSTHOG_API_KEY=phx_...
POSTHOG_PROJECT_ID=12345
# POSTHOG_HOST=https://us.posthog.com        # default (use https://eu.posthog.com for EU)

# ── GitHub (engineering velocity) ───────────────────────────────────────────
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...
# GITHUB_ORG=your-org                        # optional: scope to a specific org

# ── Google Calendar ─────────────────────────────────────────────────────────
# No env var needed — uses gws CLI credentials (see setup below)
```

## Data Source Setup

### Stripe

1. Go to [Stripe Dashboard > Developers > API keys](https://dashboard.stripe.com/apikeys)
2. Copy your **Secret key** (starts with `sk_test_` for test mode or `sk_live_` for production)
3. Add to `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   ```

That's it. The dashboard can now query your balance, charges, revenue transactions, and subscriptions.

**Available tools:** `get_stripe_balance`, `get_stripe_charges`, `get_stripe_revenue`, `get_stripe_subscriptions`

### PostHog

1. Go to PostHog > click your avatar (top right) > **Settings**
2. Scroll to **Personal API Keys**
3. Click **Create personal API key**, select scope `insight:read`
4. Copy the key (starts with `phx_`)
5. Get your **Project ID** from **Project Settings** (numeric ID in the URL)
6. Add to `.env`:
   ```
   POSTHOG_API_KEY=phx_...
   POSTHOG_PROJECT_ID=12345
   ```

> **Note:** The project API key (`phc_...`) is write-only and will NOT work. You need a personal API key (`phx_...`) with read access.

**Available tools:** `get_product_trends`, `get_top_events`, `get_conversion_funnel`, `posthog_query`

### GitHub

1. Go to [GitHub > Settings > Developer settings > Personal access tokens > Fine-grained tokens](https://github.com/settings/personal-access-tokens/new)
2. Create a token with **Repository access** for the repos/org you want
3. Grant permissions: `Contents: Read`, `Metadata: Read`
4. Add to `.env`:
   ```
   GITHUB_PERSONAL_ACCESS_TOKEN=ghp_...
   ```

To scope to a specific organization (e.g., only show repos from `your-org`):
```
GITHUB_ORG=your-org
```

Without `GITHUB_ORG`, it shows the authenticated user's personal repos (including private ones the token has access to).

**Available tools:** `get_my_repos`, `get_recent_activity`, `get_commit_activity`, `get_contributors`

### Google Calendar

Google Calendar uses the [`gws` CLI](https://github.com/googleworkspace/cli) for OAuth authentication.

**1. Install the CLI:**
```bash
npm install -g @googleworkspace/cli
```

**2. Set up a Google Cloud project:**
```bash
gws auth setup
```
This creates a GCP project and OAuth credentials. Requires the `gcloud` CLI.

**3. Add yourself as a test user:**

Since the OAuth app is in testing mode, you must add your Google account as a test user:
1. Open the [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent) for your project
2. Go to **Test users** > **Add users**
3. Enter your Google account email
4. Save

**4. Authenticate:**
```bash
gws auth login -s calendar
```
This opens a browser for OAuth consent. If you see "Google hasn't verified this app", click **Advanced** > **Go to [app name] (unsafe)** — this is safe for personal use.

**5. Verify it works:**
```bash
gws calendar +agenda
```

No `.env` variable needed — `gws` stores encrypted credentials in `~/.config/gws/` and the dashboard reads them automatically.

**Available tools:** `get_my_agenda`, `get_calendar_events`

## Architecture

```
src/
├── tools.ts                    # All tool definitions (single source of truth)
├── prompt-config.ts            # System prompt with tool docs and rules
├── starters.ts                 # Starter prompts shown on the home screen
├── lib/
│   ├── tool-def.ts             # ToolDef class (shared schema for MCP + OpenAI)
│   ├── stripe-bridge.ts        # Stripe REST API client
│   ├── posthog-bridge.ts       # PostHog Query API client
│   ├── github-octokit.ts       # GitHub API via Octokit (with cache + rate limiting)
│   ├── gws-bridge.ts           # Google Workspace CLI subprocess wrapper
│   ├── sse-stream.ts           # SSE streaming helper
│   └── ...
├── app/
│   ├── api/
│   │   ├── chat/route.ts       # LLM chat endpoint (OpenAI function-calling)
│   │   └── mcp/route.ts        # MCP server (exposes tools via MCP protocol)
│   └── dashboard/page.tsx      # Main dashboard page
└── components/
    └── OpenUIDashboard/        # Dashboard UI components
```

**How it works:**

1. User sends a prompt (e.g., "How's the business doing?")
2. The chat route sends it to the LLM with all tool definitions + system prompt
3. The LLM calls tools (e.g., `get_stripe_balance`, `get_product_trends`) via OpenAI function-calling
4. Tool results come back with real data from Stripe, PostHog, GitHub, or Calendar
5. The LLM generates openui-lang code that renders a live dashboard with the data
6. The frontend renders the dashboard using the OpenUI component library

## Sample Prompts

- "How's the business doing?"
- "Morning briefing — what do I need to know?"
- "Give me the TL;DR on my company today"
- "Show me MRR from Stripe, DAU from PostHog, and deploy status from GitHub"
- "Revenue + product metrics side by side, one view"
- "Who are my highest-paying customers and what features are they using?"
- "Give me a board-ready snapshot — revenue, growth, engineering velocity, and my calendar for prep time"
- "Build me an investor update dashboard I can screenshot"
- "Am I making money or just deploying code?"
- "Show me the truth about my startup"

## Tool Reference

### Stripe

| Tool | Description |
|------|-------------|
| `get_stripe_balance` | Current account balance (available + pending). Amounts in cents. |
| `get_stripe_charges` | Recent charges/payments. Optional `limit`, `created_gte`. |
| `get_stripe_revenue` | Balance transactions (net revenue, fees, refunds). Optional `limit`, `type`, `created_gte`. |
| `get_stripe_subscriptions` | Active subscriptions for MRR. Optional `status`, `limit`. |

### PostHog

| Tool | Description |
|------|-------------|
| `get_product_trends` | Time-series trends (DAU, pageviews, any event). Optional `event`, `math`, `dateFrom`, `interval`. |
| `get_top_events` | Most common events. Returns `{ rows: [{ event, count }] }`. Optional `days`, `limit`. |
| `get_conversion_funnel` | Funnel analysis. Requires `steps` (event name array). Optional `dateFrom`. |
| `posthog_query` | Custom HogQL SQL. Tables: `events`, `persons`, `sessions`. |

### GitHub

| Tool | Description |
|------|-------------|
| `get_my_repos` | Authenticated user's repos (includes private). Sorted by recent push. Optional `perPage`. |
| `get_recent_activity` | Recent events: pushes, PRs, issues, reviews + summary counts. |
| `get_commit_activity` | Weekly commit counts for a repo (52 weeks). Requires `owner`, `repo`. |
| `get_contributors` | Top contributors by commit count. Requires `owner`, `repo`. |

### Google Calendar

| Tool | Description |
|------|-------------|
| `get_my_agenda` | Today's or upcoming events. Optional `today`, `days`. |
| `get_calendar_events` | Events for a date range. Optional `timeMin`, `timeMax`, `maxResults`. |

## Learn More

- [OpenUI Documentation](https://openui.com/docs)
- [OpenUI GitHub](https://github.com/thesysdev/openui)
- [Stripe API Reference](https://docs.stripe.com/api)
- [PostHog API Queries](https://posthog.com/docs/api/queries)
- [Octokit REST API](https://octokit.github.io/rest.js)
- [Google Workspace CLI](https://github.com/googleworkspace/cli)
