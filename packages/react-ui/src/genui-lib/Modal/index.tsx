"use client";

import { defineComponent, useStateField } from "@openuidev/react-lang";
import { Modal as OpenUIModal } from "../../components/Modal";
import { ModalSchema } from "./schema";

export { ModalSchema } from "./schema";

export const Modal = defineComponent({
  name: "Modal",
  props: ModalSchema,
  description:
    "Modal dialog. open is a reactive $boolean binding — set to true to open, X/Escape/backdrop auto-closes. Put Form with buttons inside children.",
  component: ({ props, renderNode }) => {
    const field = useStateField("open", props.open);

    const isOpen = field.value === true || (field.value as any) === "true";

    const handleOpenChange = (open: boolean) => {
      if (!open) {
        field.setValue(false);
      }
    };

    return (
      <OpenUIModal
        title={props.title as string}
        open={isOpen}
        onOpenChange={handleOpenChange}
        size={(props.size as "sm" | "md" | "lg") ?? "md"}
      >
        {renderNode(props.children)}
      </OpenUIModal>
    );
  },
});
