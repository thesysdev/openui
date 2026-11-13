import { z } from "zod/v4";
import { ChipFilterComponent } from "../ChipFilter";
import { CompareToggleComponent } from "../CompareToggle";
import { DateRangeFilterComponent } from "../DateRangeFilter";
import { MultiSelectFilterComponent } from "../MultiSelectFilter";
import { PeriodPickerComponent } from "../PeriodPicker";
import { SelectFilterComponent } from "../SelectFilter";

export const filterBarPropsSchema = z.object({
  filters: z.array(
    z.union([
      PeriodPickerComponent.ref,
      DateRangeFilterComponent.ref,
      ChipFilterComponent.ref,
      SelectFilterComponent.ref,
      MultiSelectFilterComponent.ref,
      CompareToggleComponent.ref,
    ]),
  ),
});
export type FilterBarSchemaProps = z.infer<typeof filterBarPropsSchema>;
