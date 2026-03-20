import {
  businessMetrics,
  customerSegments,
  monthlyRevenue,
  quarterlyRevenue,
  regionData,
  salesByCategory,
  topProducts,
} from "@/data/sample-data";

// ── Tool implementations ──

function queryRevenue({ period }: { period?: string }): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (period && (period.toLowerCase().includes("q") || period.toLowerCase().includes("quarter"))) {
        resolve(JSON.stringify({
          period: "quarterly",
          data: quarterlyRevenue,
          totalRevenue: 1990000,
          totalProfit: 754000,
          yoyGrowth: 18.5,
        }));
      } else {
        resolve(JSON.stringify({
          period: "monthly",
          data: monthlyRevenue,
          totalRevenue: monthlyRevenue.reduce((s, m) => s + m.revenue, 0),
          totalProfit: monthlyRevenue.reduce((s, m) => s + m.profit, 0),
          yoyGrowth: 18.5,
        }));
      }
    }, 600);
  });
}

function querySales({ groupBy }: { groupBy?: string }): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (groupBy?.toLowerCase() === "region") {
        resolve(JSON.stringify({ groupBy: "region", data: regionData }));
      } else if (groupBy?.toLowerCase() === "product") {
        resolve(JSON.stringify({ groupBy: "product", data: topProducts }));
      } else {
        resolve(JSON.stringify({ groupBy: "category_by_quarter", data: salesByCategory }));
      }
    }, 500);
  });
}

function queryMetrics(): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(JSON.stringify(businessMetrics));
    }, 400);
  });
}

function queryCustomers({ segmentBy }: { segmentBy?: string }): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (segmentBy?.toLowerCase() === "region") {
        resolve(JSON.stringify({ segmentBy: "region", data: regionData }));
      } else {
        resolve(JSON.stringify({
          segmentBy: "tier",
          data: customerSegments,
          totalCustomers: customerSegments.reduce((s, c) => s + c.count, 0),
          avgRetention: 81,
        }));
      }
    }, 500);
  });
}

// ── Tool definitions ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const tools: any[] = [
  {
    type: "function",
    function: {
      name: "query_revenue",
      description: "Query revenue, expenses, and profit data. Can return monthly or quarterly breakdowns.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            description: "Time period granularity: 'monthly' or 'quarterly'. Defaults to monthly.",
          },
        },
        required: [],
      },
      function: queryRevenue,
      parse: JSON.parse,
    },
  },
  {
    type: "function",
    function: {
      name: "query_sales",
      description: "Query sales data. Can be grouped by 'category' (per quarter), 'region', or 'product'.",
      parameters: {
        type: "object",
        properties: {
          groupBy: {
            type: "string",
            description: "How to group results: 'category', 'region', or 'product'. Defaults to category by quarter.",
          },
        },
        required: [],
      },
      function: querySales,
      parse: JSON.parse,
    },
  },
  {
    type: "function",
    function: {
      name: "query_metrics",
      description: "Get current key business metrics including MRR, ARR, churn rate, conversion rate, NPS, CAC, LTV, and customer count.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
      function: queryMetrics,
      parse: JSON.parse,
    },
  },
  {
    type: "function",
    function: {
      name: "query_customers",
      description: "Query customer data segmented by 'tier' (Enterprise, Mid-Market, Small Business, Individual) or by 'region'.",
      parameters: {
        type: "object",
        properties: {
          segmentBy: {
            type: "string",
            description: "Segment customers by 'tier' or 'region'. Defaults to tier.",
          },
        },
        required: [],
      },
      function: queryCustomers,
      parse: JSON.parse,
    },
  },
];
