export const monthlyRevenue = [
  { month: "Jan", revenue: 124000, expenses: 89000, profit: 35000 },
  { month: "Feb", revenue: 131000, expenses: 92000, profit: 39000 },
  { month: "Mar", revenue: 148000, expenses: 95000, profit: 53000 },
  { month: "Apr", revenue: 142000, expenses: 91000, profit: 51000 },
  { month: "May", revenue: 156000, expenses: 98000, profit: 58000 },
  { month: "Jun", revenue: 169000, expenses: 102000, profit: 67000 },
  { month: "Jul", revenue: 172000, expenses: 105000, profit: 67000 },
  { month: "Aug", revenue: 165000, expenses: 101000, profit: 64000 },
  { month: "Sep", revenue: 178000, expenses: 108000, profit: 70000 },
  { month: "Oct", revenue: 189000, expenses: 112000, profit: 77000 },
  { month: "Nov", revenue: 201000, expenses: 118000, profit: 83000 },
  { month: "Dec", revenue: 215000, expenses: 125000, profit: 90000 },
];

export const quarterlyRevenue = [
  { quarter: "Q1", revenue: 403000, expenses: 276000, profit: 127000 },
  { quarter: "Q2", revenue: 467000, expenses: 291000, profit: 176000 },
  { quarter: "Q3", revenue: 515000, expenses: 314000, profit: 201000 },
  { quarter: "Q4", revenue: 605000, expenses: 355000, profit: 250000 },
];

export const salesByCategory = {
  Q1: { Electronics: 245000, Clothing: 132000, "Home & Garden": 98000, Sports: 67000, Books: 41000 },
  Q2: { Electronics: 278000, Clothing: 145000, "Home & Garden": 112000, Sports: 89000, Books: 38000 },
  Q3: { Electronics: 312000, Clothing: 158000, "Home & Garden": 105000, Sports: 95000, Books: 45000 },
  Q4: { Electronics: 356000, Clothing: 189000, "Home & Garden": 125000, Sports: 72000, Books: 52000 },
};

export const customerSegments = [
  { segment: "Enterprise", count: 142, avgSpend: 28500, retention: 94, growth: 12 },
  { segment: "Mid-Market", count: 387, avgSpend: 8200, retention: 87, growth: 18 },
  { segment: "Small Business", count: 1243, avgSpend: 2100, retention: 78, growth: 25 },
  { segment: "Individual", count: 4521, avgSpend: 340, retention: 65, growth: 31 },
];

export const topProducts = [
  { name: "Pro Analytics Suite", revenue: 892000, units: 1240, growth: 23 },
  { name: "Cloud Dashboard", revenue: 654000, units: 3420, growth: 45 },
  { name: "Data Connector Pro", revenue: 521000, units: 890, growth: 12 },
  { name: "Report Builder", revenue: 445000, units: 2100, growth: 34 },
  { name: "API Gateway", revenue: 389000, units: 670, growth: 8 },
  { name: "Mobile Analytics", revenue: 312000, units: 4500, growth: 67 },
  { name: "Alert Manager", revenue: 278000, units: 1890, growth: 19 },
  { name: "Custom Widgets", revenue: 234000, units: 3200, growth: 28 },
];

export const regionData = [
  { region: "North America", revenue: 1250000, customers: 2840, marketShare: 38 },
  { region: "Europe", revenue: 890000, customers: 1920, marketShare: 27 },
  { region: "Asia Pacific", revenue: 650000, customers: 1450, marketShare: 20 },
  { region: "Latin America", revenue: 310000, customers: 680, marketShare: 9 },
  { region: "Middle East & Africa", revenue: 200000, customers: 403, marketShare: 6 },
];

export const businessMetrics = {
  metrics: {
    mrr: 165800,
    arr: 1990000,
    customerCount: 6293,
    churnRate: 4.2,
    conversionRate: 3.8,
    avgDealSize: 4850,
    nps: 72,
    cac: 320,
    ltv: 12400,
    ltvCacRatio: 38.75,
  },
  trends: {
    mrr: { change: 8.2, direction: "up" },
    churnRate: { change: -0.5, direction: "down" },
    conversionRate: { change: 0.3, direction: "up" },
    nps: { change: 4, direction: "up" },
  },
};
