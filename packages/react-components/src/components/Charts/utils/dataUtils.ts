import { LegendItem } from "../types";

export interface ChartConfig {
  [key: string]: {
    label: string;
    icon?: React.ComponentType;
    color?: string;
    transformed?: string;
  };
}

export const getDataKeys = (
  data: Array<Record<string, string | number>>,
  categoryKey: string,
): string[] => {
  return Object.keys(data[0] || {}).filter((key) => key !== categoryKey);
};

export const get2dChartConfig = (
  dataKeys: string[],
  colors: string[],
  transformedKeys: Record<string, string>,
  icons?: Partial<Record<string | number, React.ComponentType>>,
): ChartConfig => {
  return dataKeys.reduce(
    (config, key, index) => ({
      ...config,
      [key]: {
        label: key,
        icon: icons?.[key],
        color: colors[index],
        transformed: transformedKeys[key],
      },
    }),
    {},
  );
};

export const getLegendItems = (
  dataKeys: string[],
  colors: string[],
  icons?: Partial<Record<string | number, React.ComponentType>>,
): LegendItem[] => {
  return dataKeys.map((key, index) => ({
    key,
    label: key,
    color: colors[index] ?? "#000000",
    icon: icons?.[key] as React.ComponentType | undefined,
  }));
};
