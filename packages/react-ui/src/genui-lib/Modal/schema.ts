import { reactive } from "@openuidev/react-lang";
import { z } from "zod";
import { ContentChildUnion } from "../unions";

export const ModalSchema = z.object({
  title: z.string(),
  open: reactive(z.boolean().optional()),
  children: z.array(ContentChildUnion),
  size: z.enum(["sm", "md", "lg"]).optional(),
});
