import { filtersStyles } from "../../components/filters/styles";
import type { Group } from "../group";
import { ChipFilterComponent } from "./ChipFilter";
import { CompareToggleComponent } from "./CompareToggle";
import { DateRangeFilterComponent } from "./DateRangeFilter";
import { FilterBarComponent } from "./FilterBar";
import { MultiSelectFilterComponent } from "./MultiSelectFilter";
import { PeriodPickerComponent } from "./PeriodPicker";
import { SearchFilterComponent } from "./SearchFilter";
import { SelectFilterComponent } from "./SelectFilter";
export const filters: Group = {
  components: [
    FilterBarComponent,
    PeriodPickerComponent,
    DateRangeFilterComponent,
    ChipFilterComponent,
    SelectFilterComponent,
    MultiSelectFilterComponent,
    SearchFilterComponent,
    CompareToggleComponent,
  ],
  styles: { filters: filtersStyles },
};
