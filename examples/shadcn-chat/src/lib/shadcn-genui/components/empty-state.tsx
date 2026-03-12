"use client";

import { defineComponent } from "@openuidev/react-lang";
import {
  FileIcon,
  ImageIcon,
  InboxIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react";
import { z } from "zod";

const EmptyStateSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  icon: z.enum(["inbox", "search", "file", "image", "users"]).optional(),
});

const iconMap = {
  inbox: InboxIcon,
  search: SearchIcon,
  file: FileIcon,
  image: ImageIcon,
  users: UsersIcon,
};

export const EmptyState = defineComponent({
  name: "EmptyState",
  props: EmptyStateSchema,
  description:
    'Empty state placeholder with icon, title, and description. icon: "inbox" | "search" | "file" | "image" | "users".',
  component: ({ props }) => {
    const iconKey = props.icon ?? "inbox";
    const Icon = iconMap[iconKey as keyof typeof iconMap] ?? InboxIcon;
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="text-muted-foreground mb-3">
          <Icon className="size-10" strokeWidth={1.5} />
        </div>
        <h3 className="text-sm font-semibold">{props.title}</h3>
        {props.description && (
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            {props.description}
          </p>
        )}
      </div>
    );
  },
});
