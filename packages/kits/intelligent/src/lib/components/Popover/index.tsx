"use client";

import { defineComponent } from "@openuidev/react-lang";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { renderSlot } from "../slot";
import { PopoverSchema } from "./schema";

export * from "./schema";

export const Popover = defineComponent({
  name: "Popover",
  props: PopoverSchema,
  description: 'Shows content in a small panel when the trigger is clicked: a definition, a source, details behind an Icon("info", "sm").',
  component: function PopoverView({ props, renderNode }) {
    const [open, setOpen] = useState(false);
    const [at, setAt] = useState<{ left: number; top: number; up: boolean } | null>(null);
    const button = useRef<HTMLButtonElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
      if (!open || !button.current) return;
      const r = button.current.getBoundingClientRect();
      const up = r.bottom + 220 > window.innerHeight && r.top > 240;
      setAt({ left: Math.min(Math.max(12, r.left), window.innerWidth - 292), top: up ? r.top - 8 : r.bottom + 8, up });
    }, [open]);
    useEffect(() => {
      if (!open) return;
      const close = (event: Event) => {
        const target = event.target as Node;
        if (event.type === "keydown" ? (event as KeyboardEvent).key === "Escape" : !panel.current?.contains(target) && !button.current?.contains(target)) setOpen(false);
      };
      const onScroll = () => setOpen(false);
      document.addEventListener("pointerdown", close);
      document.addEventListener("keydown", close);
      window.addEventListener("scroll", onScroll, true);
      return () => {
        document.removeEventListener("pointerdown", close);
        document.removeEventListener("keydown", close);
        window.removeEventListener("scroll", onScroll, true);
      };
    }, [open]);
    return (
      <>
        <button ref={button} type="button" className="iui-popover-trigger" aria-expanded={open} onClick={() => setOpen(!open)}>
          {renderSlot(props.trigger, renderNode)}
        </button>
        {open &&
          at &&
          createPortal(
            <div
              ref={panel}
              role="dialog"
              className="iui-popover"
              style={{ left: at.left, top: at.top, transform: at.up ? "translateY(-100%)" : undefined }}
              data-theme={button.current?.closest("[data-theme]")?.getAttribute("data-theme") ?? undefined}
            >
              {renderSlot(props.content, renderNode)}
            </div>,
            document.body,
          )}
      </>
    );
  },
});
