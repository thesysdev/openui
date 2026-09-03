"use client";

import { defineComponent, useIsStreaming } from "@openuidev/react-lang";
import React from "react";
import { z } from "zod/v4";
import {
  FoldableSectionContent,
  FoldableSectionItem,
  FoldableSectionRoot,
  FoldableSectionTrigger,
} from "../../components/SectionBlock/FoldableSection";
import { SectionV2 } from "../../components/SectionBlock/SectionV2";
import { displayText, optionalDisplayText } from "../helpers";
import { SectionItem } from "../SectionItem";

export const SectionBlock = defineComponent({
  name: "SectionBlock",
  props: z.object({
    sections: z.array(SectionItem.ref),
    isFoldable: z.boolean().optional(),
  }),
  description:
    "Collapsible accordion sections. Auto-opens sections as they stream in. Use SectionItem for each section.",
  component: ({ props, renderNode }) => {
    const items = (props.sections ?? []) as any[];
    const isFoldable = props.isFoldable !== false;
    const isStreaming = useIsStreaming();

    const firstItemValue = optionalDisplayText(items[0]?.props?.value);

    const [openItems, setOpenItems] = React.useState<string[]>([]);
    const userSelected = React.useRef(false);
    const prevLengthRef = React.useRef(0);
    const prevIsStreaming = React.useRef(isStreaming);

    // During streaming: auto-open each new section as it arrives
    React.useEffect(() => {
      if (items.length === 0) return;

      if (isStreaming && items.length > prevLengthRef.current && !userSelected.current) {
        const last = items[items.length - 1];
        const lastValue = optionalDisplayText(last?.props?.value);
        if (lastValue) {
          setOpenItems((prev) => (prev.includes(lastValue) ? prev : [...prev, lastValue]));
        }
      } else {
        setOpenItems((prev) => (prev.length === 0 && firstItemValue ? [firstItemValue] : prev));
      }

      prevLengthRef.current = items.length;
    }, [items.length, isStreaming, firstItemValue]);

    // When streaming ends: collapse back to first item (unless user interacted)
    React.useEffect(() => {
      if (prevIsStreaming.current && !isStreaming && !userSelected.current && items.length > 0) {
        setOpenItems(firstItemValue ? [firstItemValue] : []);
      }
      prevIsStreaming.current = isStreaming;
    }, [isStreaming]);

    const handleValueChange = React.useCallback((value: string[] | undefined) => {
      userSelected.current = true;
      setOpenItems(value ?? []);
    }, []);

    if (!isFoldable) {
      return (
        <>
          {items.map((item, index) => (
            <SectionV2 key={index} trigger={displayText(item?.props?.trigger)}>
              {renderNode(item?.props?.content)}
            </SectionV2>
          ))}
        </>
      );
    }

    return (
      <FoldableSectionRoot type="multiple" value={openItems} onValueChange={handleValueChange}>
        {items.map((item, index) => (
          <FoldableSectionItem
            key={index}
            value={optionalDisplayText(item?.props?.value) ?? String(index)}
          >
            <FoldableSectionTrigger text={displayText(item?.props?.trigger)} />
            <FoldableSectionContent>{renderNode(item?.props?.content)}</FoldableSectionContent>
          </FoldableSectionItem>
        ))}
      </FoldableSectionRoot>
    );
  },
});
