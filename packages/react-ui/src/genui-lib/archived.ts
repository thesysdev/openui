import { BoldText } from "./BoldText";
import { CardHeader } from "./CardHeader";
import { IconTitle } from "./IconTitle";
import { ImageBlock } from "./ImageBlock";
import { ImageText } from "./ImageText";
import { ImageTextLarge } from "./ImageTextLarge";
import { InlineHeader } from "./InlineHeader";
import { InlineText } from "./InlineText";
import { Label } from "./Label";
import { MetricIndicatorInline, MetricIndicatorWithStrikethrough } from "./MetricIndicator";
import { OverviewCardBlock, OverviewCardItem } from "./OverviewCardBlock";
import { TextCallout } from "./TextCallout";
import { VisualCardBlock, VisualCardItem } from "./VisualCardBlock";

/**
 * Components taken out of the model-facing libraries while their future is
 * decided. They are not registered in openuiLibrary / openuiChatLibrary, so
 * the model never sees or emits them; previews can still render them by
 * adding these to a library of their own.
 */
export const openuiArchivedComponents = [
  CardHeader,
  InlineHeader,
  Label,
  InlineText,
  BoldText,
  TextCallout,
  MetricIndicatorInline,
  MetricIndicatorWithStrikethrough,
  ImageBlock,
  IconTitle,
  ImageText,
  ImageTextLarge,
  OverviewCardBlock,
  OverviewCardItem,
  VisualCardBlock,
  VisualCardItem,
];
