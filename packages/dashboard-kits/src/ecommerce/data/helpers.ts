// Small pieces the tool handlers share: number formats, the sample customer
// names, the country split, and profit ledger rows.

export const pct = (v: number) => `${v.toFixed(2)}%`;
export const times = (v: number) => `${v.toFixed(2)}x`;

export const CUSTOMERS = [
  "Maya Chen",
  "Liam Okafor",
  "Sofia Rossi",
  "Noah Patel",
  "Ava Müller",
  "Ethan Brooks",
  "Zara Ahmed",
  "Lucas Silva",
  "Emma Johansson",
  "Kai Nakamura",
  "Priya Nair",
  "Oliver Grant",
  "Hana Kobayashi",
  "Mateo García",
  "Chloe Martin",
  "Daniel Mensah",
  "Ingrid Larsen",
  "Arjun Mehta",
  "Grace O'Neill",
  "Tomás Novak",
  "Leila Haddad",
  "Ben Carter",
  "Yuki Tanaka",
  "Aisha Bello",
  "Felix Wagner",
  "Mia Rossi",
  "Samuel Adeyemi",
  "Clara Dubois",
  "Ravi Kumar",
  "Elena Popescu",
  "Jonas Berg",
  "Nora Fitzgerald",
];
export const COUNTRIES = [
  { label: "United States", share: 0.58 },
  { label: "Canada", share: 0.12 },
  { label: "United Kingdom", share: 0.1 },
  { label: "Australia", share: 0.07 },
  { label: "Germany", share: 0.05 },
  { label: "Other", share: 0.08 },
];

export function ledger(lines: [string, "base" | "add" | "subtract" | "total", number, number][]) {
  return lines.map(([label, kind, value, prev]) => ({
    label,
    kind,
    value: Math.round(value),
    previous: Math.round(prev),
  }));
}
