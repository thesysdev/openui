"use client";
import {
  defineComponent,
  useIsStreaming,
  useStateField,
  type ComponentRenderProps,
} from "@openuidev/react-lang";
import { SearchFilter, type SearchFilterProps } from "../../../components/filters/SearchFilter";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { searchFilterPropsSchema, type SearchFilterSchemaProps } from "./schema";
export const SearchFilterComponent = defineComponent({
  name: "SearchFilter",
  props: searchFilterPropsSchema,
  description:
    'Search box. value takes the $variable that holds the typed text ($q = ""). Pass the same $variable as a Table\'s search to filter its rows.',
  component: SearchFilterView,
});
function SearchFilterView({ props }: ComponentRenderProps<SearchFilterSchemaProps>) {
  const streaming = useIsStreaming();
  const field = useStateField(props.name, props.value);
  return (
    <SearchFilter {...props} value={field.value} onChange={field.setValue} streaming={streaming} />
  );
}

// Every schema field reaches SearchFilter.
export type SearchFilterSchemaCovered = Covered<
  SchemaCoverage<SearchFilterSchemaProps, SearchFilterProps>
>;
