import { useContext } from "react";
import {
  LegendStoreContext,
  useLegendEntry,
  useResolvedLegendKey,
} from "../legend/LegendStoreProvider";
import { StackedLegendView, type StackedLegendViewProps } from "./StackedLegendView";

type CommonProps = Omit<
  StackedLegendViewProps,
  "items" | "activeKey" | "hiddenKeys" | "onItemHover" | "onItemToggle"
>;

export type StackedLegendProps =
  | ({
      items: StackedLegendViewProps["items"];
      legendKey?: undefined;
    } & StackedLegendViewProps)
  // Connected path. `legendKey` may be omitted when the nearest
  // LegendStoreProvider supplies one (an explicit prop still wins).
  | ({ legendKey?: string; items?: undefined } & CommonProps);

export function StackedLegend(props: StackedLegendProps) {
  if (props.items != null) {
    // Standalone / presentational path.
    const { legendKey: _ignored, ...viewProps } = props;
    return <StackedLegendView {...(viewProps as StackedLegendViewProps)} />;
  }
  const { legendKey, items: _items, ...rest } = props;
  return <ConnectedStackedLegend legendKey={legendKey} {...rest} />;
}

function ConnectedStackedLegend({ legendKey, ...rest }: { legendKey?: string } & CommonProps) {
  const store = useContext(LegendStoreContext);
  const key = useResolvedLegendKey(legendKey);
  const entry = useLegendEntry(key);
  // Degrade gracefully: no key resolvable, no provider, or not yet published.
  if (!key || !entry) return null;
  return (
    <StackedLegendView
      {...rest}
      items={entry.items}
      activeKey={entry.activeKey}
      hiddenKeys={new Set(entry.hiddenKeys)}
      format={rest.format ?? entry.format}
      onItemHover={(k) => store?.getState().setActive(key, k)}
      onItemToggle={(k) => store?.getState().toggle(key, k)}
    />
  );
}
