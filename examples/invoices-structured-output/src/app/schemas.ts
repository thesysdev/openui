import { createSchema, createSchemaMap, defineType } from "@openuidev/structured-output";
import { z } from "zod";

// ── Shared child types ──────────────────────────────────────────────────────

const LineItem = defineType({
  name: "LineItem",
  description: "A single line item on an invoice",
  props: z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    amount: z.number(),
  }),
});

const Address = defineType({
  name: "Address",
  description: "A mailing address",
  props: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string().optional(),
    zip: z.string(),
    country: z.string(),
  }),
});

const TimeEntry = defineType({
  name: "TimeEntry",
  description: "A time-based billing entry",
  props: z.object({
    date: z.string(),
    description: z.string(),
    hours: z.number(),
    rate: z.number(),
    amount: z.number(),
  }),
});

const TaxBreakdown = defineType({
  name: "TaxBreakdown",
  description: "A tax line item",
  props: z.object({
    taxName: z.string(),
    rate: z.number(),
    amount: z.number(),
  }),
});

// ── 1. Standard Invoice ─────────────────────────────────────────────────────

const StandardInvoice = defineType({
  name: "StandardInvoice",
  description: "A standard business invoice with line items",
  props: z.object({
    invoiceNumber: z.string(),
    issueDate: z.string(),
    dueDate: z.string(),
    from: z.string(),
    to: z.string(),
    items: z.array(LineItem.ref),
    subtotal: z.number(),
    taxRate: z.number(),
    taxAmount: z.number(),
    total: z.number(),
    notes: z.string().optional(),
  }),
});

export const standardInvoiceSchema = createSchema({
  types: [LineItem, StandardInvoice],
  root: "StandardInvoice",
});

// ── 2. Freelance Invoice ────────────────────────────────────────────────────

const FreelanceInvoice = defineType({
  name: "FreelanceInvoice",
  description: "A freelance/consulting invoice with hourly time entries",
  props: z.object({
    invoiceNumber: z.string(),
    issueDate: z.string(),
    dueDate: z.string(),
    freelancerName: z.string(),
    clientName: z.string(),
    projectName: z.string(),
    entries: z.array(TimeEntry.ref),
    totalHours: z.number(),
    subtotal: z.number(),
    total: z.number(),
    paymentTerms: z.string().optional(),
  }),
});

export const freelanceInvoiceSchema = createSchema({
  types: [TimeEntry, FreelanceInvoice],
  root: "FreelanceInvoice",
});

// ── 3. International Invoice ────────────────────────────────────────────────

const InternationalInvoice = defineType({
  name: "InternationalInvoice",
  description:
    "An international invoice with multiple currencies, tax breakdown, and shipping address",
  props: z.object({
    invoiceNumber: z.string(),
    issueDate: z.string(),
    dueDate: z.string(),
    currency: z.enum(["USD", "EUR", "GBP", "JPY", "CAD", "AUD"]),
    seller: Address.ref,
    buyer: Address.ref,
    items: z.array(LineItem.ref),
    subtotal: z.number(),
    taxes: z.array(TaxBreakdown.ref),
    shippingCost: z.number().optional(),
    total: z.number(),
    exchangeRate: z.number().optional(),
  }),
});

export const internationalInvoiceSchema = createSchema({
  types: [LineItem, Address, TaxBreakdown, InternationalInvoice],
  root: "InternationalInvoice",
});

// ── Schema map + metadata ───────────────────────────────────────────────────

export type InvoiceFormat = "standard" | "freelance" | "international";

export const invoiceMeta: Record<
  InvoiceFormat,
  { label: string; description: string; samplePrompt: string }
> = {
  standard: {
    label: "Invoice Type 1",
    description: "Simple business invoice with line items, tax, and totals",
    samplePrompt:
      "Generate a standard invoice from Acme Corp to Widget LLC for 3 items: 10 steel bolts at $2.50 each, 5 rubber gaskets at $8.00 each, and 2 copper pipes at $15.75 each. Tax rate is 8.5%. Invoice #INV-2025-0042, issued today, due in 30 days.",
  },
  freelance: {
    label: "Invoice Type 2",
    description: "Hourly consulting invoice with time entries and project details",
    samplePrompt:
      "Generate a freelance invoice from Sarah Chen (UI/UX Designer) to TechStart Inc for the 'Mobile App Redesign' project. She worked 8 hours on wireframes on March 3rd, 12 hours on high-fidelity mockups on March 5-6, and 4 hours on design review on March 10. Her rate is $125/hour. Invoice #SC-2025-007, issued today, due net-15.",
  },
  international: {
    label: "Invoice Type 3",
    description: "Multi-currency invoice with addresses, tax breakdown, and shipping",
    samplePrompt:
      "Generate an international invoice in EUR from Schmidt Manufacturing GmbH (Industriestraße 42, Munich, Bavaria, 80331, Germany) to Dupont Industries SA (23 Rue de Rivoli, Paris, 75001, France). Items: 100 precision bearings at €12.50, 50 titanium rods at €45.00. Taxes: German VAT at 19%, French import duty at 2.5%. Shipping cost €250. Invoice #INT-2025-EU-089, issued today, due in 45 days.",
  },
};

export const invoiceSchemaMap = createSchemaMap({
  standard: standardInvoiceSchema,
  freelance: freelanceInvoiceSchema,
  international: internationalInvoiceSchema,
});
