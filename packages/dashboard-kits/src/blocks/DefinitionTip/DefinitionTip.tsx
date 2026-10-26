import type { Definition } from "../../core/schemas";
import { HoverTip } from "../KitLayer";

export interface DefinitionTipProps {
  /** Referenced by the element it describes, through aria-describedby. */
  id: string;
  definition: Definition;
}

/**
 * How a metric is calculated: its formula, the time it covers, and where the
 * numbers come from. Shown when the element's wrapper (`.kit-def-host`) is
 * hovered or holds focus, on the kit layer so a card's edge can't clip it.
 */
export function DefinitionTip({ id, definition }: DefinitionTipProps) {
  return (
    <HoverTip id={id}>
      <span className="kit-def__formula">{definition.formula}</span>
      <span className="kit-def__row">
        <span className="kit-def__key">Window</span> {definition.window}
      </span>
      {definition.basis && (
        <span className="kit-def__row">
          <span className="kit-def__key">Basis</span> {definition.basis}
        </span>
      )}
    </HoverTip>
  );
}
