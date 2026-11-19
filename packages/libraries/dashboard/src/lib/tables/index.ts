import { tableStyles } from "../../components/tables/styles";
import type { Group } from "../group";
import { ColumnComponent } from "./Column";
import { TableComponent } from "./Table";

/** Table and Column. */
export const tables: Group = {
  components: [TableComponent, ColumnComponent],
  styles: { table: tableStyles },
};
