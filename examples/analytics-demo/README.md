This is an [OpenUI](https://openui.com) Analytics Demo — a conversational analytics chat app showcasing OpenUI's chart, table, and metric card components.

## Getting Started

First, set your Gemini API key:

```bash
export GEMINI_API_KEY=your-key-here
```

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Ask natural-language analytics questions like:

- "Show me monthly revenue trends"
- "Compare Q1 vs Q2 sales by category"
- "What are our key business metrics?"
- "Break down customers by segment"

The LLM fetches sample data via tools and generates rich UI (charts, tables, metric cards) using OpenUI Lang, streamed progressively to the browser.

## How It Works

The demo includes four mock analytics tools with built-in sample data:

- **query_revenue** — monthly/quarterly revenue, expenses, and profit
- **query_sales** — sales by product category, region, or product
- **query_metrics** — key business metrics (MRR, ARR, churn, NPS, CAC, LTV, etc.)
- **query_customers** — customer segmentation by tier or region

No external data source is needed — everything works out of the box.

## Learn More

To learn more about OpenUI, take a look at the following resources:

- [OpenUI Documentation](https://openui.com/docs) - learn about OpenUI features and API.
- [OpenUI GitHub repository](https://github.com/thesysdev/openui) - your feedback and contributions are welcome!
