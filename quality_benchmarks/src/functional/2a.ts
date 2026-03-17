import { z } from "zod";
import { defineModel, createSchema } from "@openuidev/lang/structured-outputs";
import { chk, type FunctionalTestCase, type FunctionalTestSuite, type VerificationResult } from "./domain.js";

// ---- Schema ----

const ConditionSchema = z.object({
  when: z.string().describe("Boolean expression using column names"),
  then: z.string().describe("Value expression using column names"),
});

const MetricSchema = z.object({
  name: z.string(),
  function: z.enum(["count", "count_distinct", "sum", "avg", "min", "max", "argmax"]),
  column: z.string().optional().describe("Column to aggregate; not needed for count"),
  orderBy: z.string().optional().describe("For argmax: return the value of 'column' from the row with the max value of 'orderBy'"),
  round: z.number().optional().describe("Decimal places to round to"),
});

const FilterStep = z.object({
  operation: z.literal("filter"),
  column: z.string(),
  operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "before", "after"]).describe("Use before/after for date columns, gte/lte for numeric columns"),
  value: z.union([z.string(), z.number()]),
});

const ComputeStep = z.object({
  operation: z.literal("compute"),
  newColumn: z.string(),
  expression: z.string().optional().describe("JavaScript-like expression using column names as variables"),
  conditions: z.array(ConditionSchema).optional(),
  otherwise: z.string().optional().describe("Default value expression if no condition matches"),
});

const AggregateStep = z.object({
  operation: z.literal("aggregate"),
  groupBy: z.string().describe("Column(s) to group by, comma-separated for multiple"),
  metrics: z.array(MetricSchema),
});

const SortStep = z.object({
  operation: z.literal("sort"),
  sortBy: z.string(),
  direction: z.enum(["asc", "desc"]),
});

const JoinStep = z.object({
  operation: z.literal("join"),
  on: z.string().describe("Column to join on"),
});

const TransformStep = z.union([FilterStep, ComputeStep, AggregateStep, SortStep, JoinStep]);

const PipelineSchema = z.object({
  steps: z.array(TransformStep),
  outputColumns: z.array(z.string()),
});

type PipelineData = z.infer<typeof PipelineSchema>;
type StepData = z.infer<typeof TransformStep>;

// ---- CSV Parser ----

function parseCsv(csv: string): Record<string, unknown>[] {
  const lines = csv.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim());
    const row: Record<string, unknown> = {};
    headers.forEach((h, i) => {
      const v = vals[i] ?? "";
      const n = Number(v);
      row[h] = isNaN(n) || v === "" ? v : n;
    });
    return row;
  });
}

// ---- Expression Evaluator ----

function evalExpr(expr: string, row: Record<string, unknown>): unknown {
  const keys = Object.keys(row);
  const vals = keys.map((k) => row[k]);
  try {
    return new Function(...keys, `"use strict"; return (${expr});`)(...vals);
  } catch {
    return undefined;
  }
}

// ---- Pipeline Executor ----

function executePipeline(
  steps: StepData[],
  primaryData: Record<string, unknown>[],
  secondaryData?: Record<string, unknown>[]
): Record<string, unknown>[] {
  let data: Record<string, unknown>[] = [...primaryData];

  for (const step of steps) {
    // Support both flat shape (new) and nested params shape (old JSON schema)
    const s = step as any;
    const p = s.params ?? s;

    if (s.operation === "join") {
      if (!secondaryData || !p.on) continue;
      const onCol = p.on;
      const lookup = new Map<unknown, Record<string, unknown>>();
      for (const row of secondaryData) {
        lookup.set(row[onCol], row);
      }
      data = data.map((row) => {
        const match = lookup.get(row[onCol]);
        if (match) {
          return { ...match, ...row };
        }
        return row;
      });
    } else if (s.operation === "filter") {
      const { column, operator, value } = p;
      if (!column || !operator) continue;
      data = data.filter((row) => {
        const cell = row[column];
        if (operator === "before") {
          return String(cell) < String(value);
        }
        if (operator === "after") {
          return String(cell) > String(value);
        }
        const numCell = Number(cell);
        const numVal = Number(value);
        if (!isNaN(numCell) && !isNaN(numVal) && value !== "") {
          if (operator === "eq") return numCell === numVal;
          if (operator === "neq") return numCell !== numVal;
          if (operator === "gt") return numCell > numVal;
          if (operator === "gte") return numCell >= numVal;
          if (operator === "lt") return numCell < numVal;
          if (operator === "lte") return numCell <= numVal;
        }
        if (operator === "eq") return String(cell) === String(value);
        if (operator === "neq") return String(cell) !== String(value);
        if (operator === "gt") return String(cell) > String(value);
        if (operator === "gte") return String(cell) >= String(value);
        if (operator === "lt") return String(cell) < String(value);
        if (operator === "lte") return String(cell) <= String(value);
        return false;
      });
    } else if (s.operation === "compute") {
      const { newColumn, expression, conditions, otherwise } = p;
      if (!newColumn) continue;
      data = data.map((row) => {
        let val: unknown;
        if (conditions && conditions.length > 0) {
          let matched = false;
          for (const cond of conditions) {
            const test = evalExpr(cond.when, row);
            if (test) {
              val = evalExpr(cond.then, row);
              matched = true;
              break;
            }
          }
          if (!matched && otherwise !== undefined) {
            val = evalExpr(otherwise, row);
          }
        } else if (expression) {
          val = evalExpr(expression, row);
        }
        return { ...row, [newColumn]: val };
      });
    } else if (s.operation === "aggregate") {
      const { groupBy, metrics } = p;
      if (!groupBy || !metrics) continue;
      const groupCols: string[] = Array.isArray(groupBy)
        ? groupBy
        : groupBy.includes(",")
        ? groupBy.split(",").map((x: string) => x.trim())
        : [groupBy];
      const groups = new Map<string, Record<string, unknown>[]>();
      for (const row of data) {
        const key = groupCols.map((c) => String(row[c] ?? "")).join("\x00");
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(row);
      }
      data = [];
      for (const [, rows] of groups) {
        const outRow: Record<string, unknown> = {};
        for (const c of groupCols) outRow[c] = rows[0][c];
        for (const m of metrics) {
          if (m.function === "count") {
            outRow[m.name] = rows.length;
          } else if (m.function === "count_distinct") {
            outRow[m.name] = new Set(rows.map((r) => r[m.column!])).size;
          } else if (m.function === "argmax") {
            const orderCol = m.orderBy ?? m.column!;
            const best = rows.reduce((best, r) => Number(r[orderCol]) > Number(best[orderCol]) ? r : best, rows[0]);
            outRow[m.name] = best[m.column!];
          } else {
            let result: number;
            if (m.function === "sum") {
              result = rows.reduce((acc, r) => acc + (Number(r[m.column!]) || 0), 0);
            } else if (m.function === "avg") {
              result = rows.reduce((acc, r) => acc + (Number(r[m.column!]) || 0), 0) / rows.length;
            } else if (m.function === "min") {
              result = Math.min(...rows.map((r) => Number(r[m.column!]) || 0));
            } else {
              result = Math.max(...rows.map((r) => Number(r[m.column!]) || 0));
            }
            if (m.round !== undefined) result = parseFloat(result.toFixed(m.round));
            outRow[m.name] = result;
          }
        }
        data.push(outRow);
      }
    } else if (s.operation === "sort") {
      const { sortBy, direction } = p;
      if (!sortBy) continue;
      data = [...data].sort((a, b) => {
        const av = a[sortBy];
        const bv = b[sortBy];
        const an = Number(av);
        const bn = Number(bv);
        if (!isNaN(an) && !isNaN(bn)) {
          return direction === "desc" ? bn - an : an - bn;
        }
        const as = String(av);
        const bs = String(bv);
        if (direction === "desc") return bs < as ? -1 : bs > as ? 1 : 0;
        return as < bs ? -1 : as > bs ? 1 : 0;
      });
    }
  }

  return data;
}

// ---- Input Data ----

const MEDIUM_CSV = `employee_id,first_name,last_name,department,hire_date,salary,status,performance_rating
E001,Alice,Chen,Engineering,2022-03-15,125000,active,4.7
E002,Bob,Martinez,Engineering,2023-06-01,115000,active,3.8
E003,Carol,Johnson,Engineering,2024-05-20,105000,active,4.2
E004,David,Kim,Sales,2021-01-10,95000,active,4.6
E005,Eva,Patel,Sales,2023-08-22,88000,active,2.3
E006,Frank,O'Brien,Sales,2022-11-03,92000,inactive,4.1
E007,Grace,Liu,Marketing,2020-07-14,98000,active,3.2
E008,Hector,Ruiz,Marketing,2023-02-28,91000,active,4.8
E009,Irene,Novak,Finance,2019-12-01,110000,active,3.9
E010,James,Wright,Finance,2023-09-15,102000,active,4.5
E011,Karen,Bell,Finance,2021-06-30,108000,active,2.8
E012,Leo,Santos,Engineering,2022-08-17,120000,active,3.6`;

const HARD_ORDERS_CSV = `order_id,customer_id,product_id,quantity,unit_price,discount_percent,order_date,region,channel
ORD-001,C100,P01,10,50.00,5,2025-08-12,North,online
ORD-002,C101,P02,3,200.00,10,2025-09-03,North,retail
ORD-003,C102,P01,8,50.00,0,2025-07-22,South,online
ORD-004,C103,P03,15,30.00,20,2025-11-15,South,online
ORD-005,C104,P02,5,200.00,15,2025-10-01,East,retail
ORD-006,C105,P04,20,15.00,0,2025-06-15,North,online
ORD-007,C106,P03,12,30.00,10,2025-08-30,North,retail
ORD-008,C107,P01,6,50.00,5,2025-12-20,East,online
ORD-009,C108,P04,25,15.00,5,2025-09-18,South,online
ORD-010,C109,P02,2,200.00,0,2025-11-05,South,retail
ORD-011,C110,P05,4,120.00,10,2025-10-22,North,online
ORD-012,C111,P05,7,120.00,5,2025-08-14,East,retail
ORD-013,C112,P03,9,30.00,0,2025-07-01,East,online
ORD-014,C113,P01,5,50.00,10,2025-09-09,North,internal
ORD-015,C114,P04,30,15.00,0,2025-12-01,East,online
ORD-016,C115,P05,3,120.00,15,2025-11-11,South,retail
ORD-017,C116,P02,4,200.00,5,2025-08-25,North,online
ORD-018,C117,P03,6,30.00,0,2025-10-10,South,retail`;

const HARD_PRODUCTS_CSV = `product_id,product_name,category,supplier,unit_cost
P01,Widget Alpha,Widgets,Supplier A,22.00
P02,Gadget Pro,Gadgets,Supplier B,85.00
P03,Widget Beta,Widgets,Supplier A,12.00
P04,Accessory One,Accessories,Supplier C,6.50
P05,Gadget Lite,Gadgets,Supplier B,48.00`;

// ---- Prompts ----

const mediumPrompt = `You have a CSV dataset of employee records. Generate a data transformation pipeline that produces the following output:

Input columns: employee_id, first_name, last_name, department, hire_date, salary, status, performance_rating

Requirements:
1. Filter to only active employees (status = "active")
2. Filter to only employees hired before 2024-01-01
3. Create a new column "full_name" by concatenating first_name and last_name with a space
4. Create a new column "annual_bonus" calculated as:
   - If performance_rating >= 4.5: salary * 0.15
   - If performance_rating >= 3.5: salary * 0.10
   - If performance_rating >= 2.5: salary * 0.05
   - Otherwise: 0
5. Group by department and compute:
   - employee_count: number of employees in group
   - avg_salary: mean salary rounded to nearest integer
   - total_bonus: sum of annual_bonus rounded to nearest integer
6. Sort by total_bonus descending
7. Output columns: department, employee_count, avg_salary, total_bonus

Input data:
${MEDIUM_CSV}`;

const hardPrompt = `You have two CSV datasets: orders and products. Generate a data transformation pipeline that produces a sales analysis report.

Orders columns: order_id, customer_id, product_id, quantity, unit_price, discount_percent, order_date, region, channel
Products columns: product_id, product_name, category, supplier, unit_cost

Requirements:
1. Join orders with products on product_id
2. Filter to orders placed between 2025-07-01 and 2025-12-31 (inclusive)
3. Filter out orders where channel is "internal"
4. Compute "revenue" as: quantity * unit_price * (1 - discount_percent / 100)
5. Compute "cost" as: quantity * unit_cost
6. Compute "profit" as: revenue - cost
7. Compute "margin_percent" as: (profit / revenue) * 100, rounded to 1 decimal place
8. First aggregation — group by category and region, compute:
   - order_count: number of orders
   - total_revenue: sum of revenue, rounded to 2 decimal places
   - total_profit: sum of profit, rounded to 2 decimal places
   - avg_margin: mean of margin_percent, rounded to 1 decimal place
9. Filter to groups where order_count >= 2
10. Second aggregation — group by category only, compute:
    - regions_active: number of distinct regions from prior step
    - combined_revenue: sum of total_revenue, rounded to 2 decimal places
    - combined_profit: sum of total_profit, rounded to 2 decimal places
    - best_region: the region with the highest total_revenue within that category
    - best_region_revenue: the total_revenue of that best region, rounded to 2 decimal places
11. Sort by combined_profit descending
12. Output columns: category, regions_active, combined_revenue, combined_profit, best_region, best_region_revenue

Input data — Orders:
${HARD_ORDERS_CSV}

Input data — Products:
${HARD_PRODUCTS_CSV}`;

// ---- Verification ----

const MEDIUM_EXPECTED = [
  { department: "Engineering", employee_count: 3, avg_salary: 120000, total_bonus: 42250 },
  { department: "Finance", employee_count: 3, avg_salary: 106667, total_bonus: 31700 },
  { department: "Marketing", employee_count: 2, avg_salary: 94500, total_bonus: 18550 },
  { department: "Sales", employee_count: 2, avg_salary: 91500, total_bonus: 14250 },
];

const HARD_EXPECTED = [
  { category: "Gadgets", regions_active: 3, combined_revenue: 4086.00, combined_profit: 2224.00, best_region: "North", best_region_revenue: 1732.00 },
  { category: "Widgets", regions_active: 3, combined_revenue: 2294.00, combined_profit: 1262.00, best_region: "South", best_region_revenue: 940.00 },
];

function numClose(a: unknown, b: unknown, tol = 0.01): boolean {
  return Math.abs(Number(a) - Number(b)) <= tol;
}

function verifyMediumPipeline(parsed: unknown): VerificationResult {
  const data = parsed as Partial<PipelineData>;
  const checks: ReturnType<typeof chk>[] = [];

  const steps = (data.steps as StepData[]) ?? [];
  let output: Record<string, unknown>[] = [];
  try {
    const primaryData = parseCsv(MEDIUM_CSV);
    output = executePipeline(steps, primaryData);
  } catch (e) {
    checks.push(chk("pipeline_execution", false, String(e)));
    return { pass: false, checks };
  }

  checks.push(chk("row_count", output.length === MEDIUM_EXPECTED.length, output.length, MEDIUM_EXPECTED.length));

  for (let i = 0; i < MEDIUM_EXPECTED.length; i++) {
    const exp = MEDIUM_EXPECTED[i];
    const act = output[i] ?? {};
    checks.push(chk(`row${i}:department`, act["department"] === exp.department, act["department"], exp.department));
    checks.push(chk(`row${i}:employee_count`, numClose(act["employee_count"], exp.employee_count, 0), act["employee_count"], exp.employee_count));
    checks.push(chk(`row${i}:avg_salary`, numClose(act["avg_salary"], exp.avg_salary, 1), act["avg_salary"], exp.avg_salary));
    checks.push(chk(`row${i}:total_bonus`, numClose(act["total_bonus"], exp.total_bonus, 1), act["total_bonus"], exp.total_bonus));
  }

  return { pass: checks.every((c) => c.pass), checks };
}

function verifyHardPipeline(parsed: unknown): VerificationResult {
  const data = parsed as Partial<PipelineData>;
  const checks: ReturnType<typeof chk>[] = [];

  const steps = (data.steps as StepData[]) ?? [];
  let output: Record<string, unknown>[] = [];
  try {
    const primaryData = parseCsv(HARD_ORDERS_CSV);
    const secondaryData = parseCsv(HARD_PRODUCTS_CSV);
    output = executePipeline(steps, primaryData, secondaryData);
  } catch (e) {
    checks.push(chk("pipeline_execution", false, String(e)));
    return { pass: false, checks };
  }

  checks.push(chk("row_count", output.length === HARD_EXPECTED.length, output.length, HARD_EXPECTED.length));

  for (let i = 0; i < HARD_EXPECTED.length; i++) {
    const exp = HARD_EXPECTED[i];
    const act = output[i] ?? {};
    checks.push(chk(`row${i}:category`, act["category"] === exp.category, act["category"], exp.category));
    checks.push(chk(`row${i}:regions_active`, numClose(act["regions_active"], exp.regions_active, 0), act["regions_active"], exp.regions_active));
    checks.push(chk(`row${i}:combined_revenue`, numClose(act["combined_revenue"], exp.combined_revenue, 0.01), act["combined_revenue"], exp.combined_revenue));
    checks.push(chk(`row${i}:combined_profit`, numClose(act["combined_profit"], exp.combined_profit, 0.01), act["combined_profit"], exp.combined_profit));
    checks.push(chk(`row${i}:best_region`, act["best_region"] === exp.best_region, act["best_region"], exp.best_region));
    checks.push(chk(`row${i}:best_region_revenue`, numClose(act["best_region_revenue"], exp.best_region_revenue, 0.01), act["best_region_revenue"], exp.best_region_revenue));
  }

  return { pass: checks.every((c) => c.pass), checks };
}

// ---- Lang Schemas ----

const ConditionModel = defineModel({
  name: "Condition",
  description: "A conditional branch",
  schema: z.object({
    when: z.string().describe("Boolean expression using column names"),
    then: z.string().describe("Value expression using column names"),
  }),
});

const MetricModel = defineModel({
  name: "Metric",
  description: "An aggregation metric",
  schema: z.object({
    name: z.string(),
    function: z.enum(["count", "count_distinct", "sum", "avg", "min", "max", "argmax"]),
    column: z.string().optional().describe("Column to aggregate; not needed for count"),
    orderBy: z.string().optional().describe("For argmax: column whose max value determines the row"),
    round: z.number().optional().describe("Decimal places to round to"),
  }),
});

const FilterStepModel = defineModel({
  name: "FilterStep",
  description: "Filter rows by a condition",
  schema: z.object({
    operation: z.literal("filter"),
    column: z.string(),
    operator: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "before", "after"]).describe("Use before/after for date columns, gte/lte for numeric columns"),
    value: z.union([z.string(), z.number()]),
  }),
});

const ComputeStepModel = defineModel({
  name: "ComputeStep",
  description: "Compute a new column",
  schema: z.object({
    operation: z.literal("compute"),
    newColumn: z.string(),
    expression: z.string().optional().describe("JavaScript-like expression using column names as variables"),
    conditions: z.array(ConditionModel.ref).optional(),
    otherwise: z.string().optional().describe("Default value if no condition matches"),
  }),
});

const AggregateStepModel = defineModel({
  name: "AggregateStep",
  description: "Group rows and compute aggregate metrics",
  schema: z.object({
    operation: z.literal("aggregate"),
    groupBy: z.string().describe("Column(s) to group by, comma-separated for multiple"),
    metrics: z.array(MetricModel.ref),
  }),
});

const SortStepModel = defineModel({
  name: "SortStep",
  description: "Sort rows by a column",
  schema: z.object({
    operation: z.literal("sort"),
    sortBy: z.string(),
    direction: z.enum(["asc", "desc"]),
  }),
});

const JoinStepModel = defineModel({
  name: "JoinStep",
  description: "Join with secondary dataset on a column",
  schema: z.object({
    operation: z.literal("join"),
    on: z.string().describe("Column to join on"),
  }),
});

const PipelineModel = defineModel({
  name: "Pipeline",
  description: "A data transformation pipeline",
  schema: z.object({
    steps: z.array(z.union([FilterStepModel.ref, ComputeStepModel.ref, AggregateStepModel.ref, SortStepModel.ref, JoinStepModel.ref])),
    outputColumns: z.array(z.string()),
  }),
});

const pipelineLangSchema = createSchema([PipelineModel]);

// ---- Test Cases ----

const case2aMedium: FunctionalTestCase = {
  id: "2a-medium",
  name: "Employee Data Pipeline",
  complexity: "medium",
  prompt: mediumPrompt,
  schema: PipelineSchema,
  langSchema: pipelineLangSchema,
  verify: verifyMediumPipeline,
};

const case2aHard: FunctionalTestCase = {
  id: "2a-hard",
  name: "Sales Analysis Pipeline",
  complexity: "hard",
  prompt: hardPrompt,
  schema: PipelineSchema,
  langSchema: pipelineLangSchema,
  verify: verifyHardPipeline,
};

export const suite2a: FunctionalTestSuite = {
  id: "2a",
  name: "Data Transformation",
  cases: [case2aMedium, case2aHard],
};
