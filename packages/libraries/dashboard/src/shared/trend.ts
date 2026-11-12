/**
 * The trend arrow's direction already supplies the sign ("+" for up, "-" for down),
 * so the magnitude is shown on its own: {direction: "down", value: -3} reads "-3%",
 * not "--3%".
 */
export function trendMagnitude(value: number, direction: string | undefined): number {
  return direction === "up" || direction === "down" ? Math.abs(value) : value;
}
