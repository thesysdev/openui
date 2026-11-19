export interface Option {
  value: string;
  label?: string;
}

export function options(list: Option[] | undefined): Option[] {
  if (!Array.isArray(list)) return [];
  return list.filter((option): option is Option => !!option && typeof option.value === "string");
}
