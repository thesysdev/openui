import { useMemo } from "react";

const DEFAULT_X_AXIS_HEIGHT = 30;
const MIN_ROTATION_ANGLE = 0;
const X_AXIS_PADDING = 20;

interface AngleCalculationResult {
  angle: number;
  height: number;
}

/**
 * Calculates the optimal rotation angle and height for X-axis labels using trigonometry.
 *
 * Uses the Pythagorean theorem:
 * - Hypotenuse = maxLabelWidth (the label length)
 * - Base = widthOfData or X_AXIS_PADDING (available horizontal space)
 * - Height = sqrt(hypotenuse^2 - base^2)
 * - Angle = atan(height / base) converted to degrees
 */
export const useAutoAngleCalculation = (
  maxLabelWidth: number,
  enabled: boolean,
  widthOfData?: number,
): AngleCalculationResult => {
  return useMemo(() => {
    if (!enabled) {
      return {
        angle: 0,
        height: DEFAULT_X_AXIS_HEIGHT,
      };
    }

    const base = widthOfData ?? X_AXIS_PADDING;
    const hypotenuse = maxLabelWidth;

    // Labels fit horizontally — apply minimum rotation
    if (base >= hypotenuse) {
      const angleRadians = (MIN_ROTATION_ANGLE * Math.PI) / 180;
      const height = Math.ceil(hypotenuse * Math.sin(angleRadians));

      return {
        angle: -MIN_ROTATION_ANGLE,
        height: Math.max(height, DEFAULT_X_AXIS_HEIGHT),
      };
    }

    // Calculate height using Pythagorean theorem
    const heightSquared = hypotenuse * hypotenuse - base * base;
    const height = Math.sqrt(Math.max(0, heightSquared));

    const angleRadians = Math.atan(height / base);
    const angleDegrees = (angleRadians * 180) / Math.PI;

    const finalAngle = Math.max(angleDegrees, MIN_ROTATION_ANGLE);

    const finalHeight =
      finalAngle > angleDegrees
        ? Math.ceil(hypotenuse * Math.sin((finalAngle * Math.PI) / 180))
        : Math.ceil(height);

    return {
      angle: -finalAngle,
      height: Math.max(finalHeight + 16, DEFAULT_X_AXIS_HEIGHT),
    };
  }, [maxLabelWidth, enabled, widthOfData]);
};
