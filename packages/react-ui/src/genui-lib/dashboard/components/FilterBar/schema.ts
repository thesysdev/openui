import { z } from "zod/v4";
import { DatePickerComponent } from "../DatePicker/DatePicker";
import { FilterMultiSelectComponent, FilterSelectComponent } from "../FilterSelect/FilterSelect";
import { IconButtonComponent } from "../IconButton/IconButton";

export const filterBarChildSchema = z.union([
  FilterSelectComponent.ref,
  FilterMultiSelectComponent.ref,
  DatePickerComponent.ref,
  IconButtonComponent.ref,
]);

export const filterBarPropsSchema = z.object({
  children: z.array(filterBarChildSchema).default([]),
  rightChildren: z.array(filterBarChildSchema).default([]),
  compact: z.boolean().default(false),
});

export type FilterBarProps = z.infer<typeof filterBarPropsSchema>;
