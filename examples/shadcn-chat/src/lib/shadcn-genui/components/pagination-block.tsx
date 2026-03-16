"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { defineComponent, useTriggerAction } from "@openuidev/react-lang";
import { z } from "zod";

const PaginationBlockSchema = z.object({
  currentPage: z.number(),
  totalPages: z.number(),
});

export const PaginationBlock = defineComponent({
  name: "PaginationBlock",
  props: PaginationBlockSchema,
  description: "Page navigation. currentPage and totalPages control which pages are shown.",
  component: ({ props }) => {
    const triggerAction = useTriggerAction();
    const current = props.currentPage ?? 1;
    const total = props.totalPages ?? 1;

    const pages: (number | "ellipsis")[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push("ellipsis");
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push("ellipsis");
      pages.push(total);
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (current > 1) triggerAction(`Go to page ${current - 1}`);
              }}
            />
          </PaginationItem>
          {pages.map((page, i) =>
            page === "ellipsis" ? (
              <PaginationItem key={`e-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  isActive={page === current}
                  onClick={(e) => {
                    e.preventDefault();
                    triggerAction(`Go to page ${page}`);
                  }}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (current < total) triggerAction(`Go to page ${current + 1}`);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  },
});
