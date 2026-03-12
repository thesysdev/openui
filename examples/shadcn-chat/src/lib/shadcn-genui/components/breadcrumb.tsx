"use client";

import {
  Breadcrumb as ShadcnBreadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { defineComponent } from "@openuidev/react-lang";
import { z } from "zod";

const BreadcrumbItemSchema = z.object({
  label: z.string(),
  href: z.string().optional(),
});

export const BreadcrumbItemDef = defineComponent({
  name: "BreadcrumbItem",
  props: BreadcrumbItemSchema,
  description: "Single breadcrumb entry. href makes it a link; omit for the current page.",
  component: () => null,
});

const BreadcrumbSchema = z.object({
  items: z.array(BreadcrumbItemDef.ref),
});

export const Breadcrumb = defineComponent({
  name: "Breadcrumb",
  props: BreadcrumbSchema,
  description: "Navigation breadcrumb trail showing hierarchy path.",
  component: ({ props }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (props.items ?? []) as any[];
    return (
      <ShadcnBreadcrumb>
        <BreadcrumbList>
          {items.map((item, i) => {
            const label = String(item?.props?.label ?? "");
            const href = item?.props?.href as string | undefined;
            const isLast = i === items.length - 1;
            return (
              <BreadcrumbItem key={i}>
                {!isLast && href ? (
                  <BreadcrumbLink href={href}>{label}</BreadcrumbLink>
                ) : isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink>{label}</BreadcrumbLink>
                )}
                {!isLast && <BreadcrumbSeparator />}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </ShadcnBreadcrumb>
    );
  },
});
