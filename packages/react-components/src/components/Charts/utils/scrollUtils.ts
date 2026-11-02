type ChartData = Array<Record<string, string | number>>;

export type ChartDensity = "compact" | "default" | "spacious";

const DENSITY_SPACING: Record<ChartDensity, number> = {
  compact: 48,
  default: 72,
  spacious: 96,
};
const MIN_SINGLE_POINT_WIDTH = 200;

export const getWidthOfData = (
  data: ChartData,
  containerWidth: number,
  groupWidth: number = getWidthOfGroup(),
) => {
  if (data.length === 0) {
    return containerWidth;
  }
  const width = data.length * groupWidth;

  if (containerWidth >= width) {
    return containerWidth;
  }

  if (data.length === 1) {
    return Math.max(width, MIN_SINGLE_POINT_WIDTH);
  }

  return width;
};

export const findNearestSnapPosition = (
  snapPositions: number[],
  currentScroll: number,
  direction: "left" | "right",
): number => {
  let currentIndex = 0;
  for (let i = 0; i < snapPositions.length; i++) {
    const snapPosition = snapPositions[i];
    if (snapPosition !== undefined && currentScroll >= snapPosition) {
      currentIndex = i;
    } else {
      break;
    }
  }

  if (direction === "left") {
    return Math.max(0, currentIndex - 1);
  } else {
    return Math.min(snapPositions.length - 1, currentIndex + 1);
  }
};

export function getWidthOfGroup(density: ChartDensity = "default"): number {
  return DENSITY_SPACING[density];
}

export const getSnapPositions = (
  data: ChartData,
  groupWidth: number = getWidthOfGroup(),
): number[] => {
  if (data.length === 0) return [0];

  const positions = [0];

  for (let i = 1; i < data.length; i++) {
    positions.push(i * groupWidth);
  }

  return positions;
};
