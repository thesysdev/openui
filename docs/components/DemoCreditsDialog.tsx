"use client";

import {
  areDemosDisabled,
  DEMO_CREDITS_EXHAUSTED_MESSAGE,
  DEMO_CREDITS_LOCAL_COMMANDS,
  DEMOS_PAUSED_LOCAL_MESSAGE,
} from "@/lib/demo-credits";
import * as Dialog from "@radix-ui/react-dialog";
import { useCopyButton } from "fumadocs-ui/utils/use-copy-button";
import { Check, Copy, Download, X } from "lucide-react";
import "./DemoCreditsDialog.css";

type DemoCreditsDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function DemoCreditsDialog({ open, onClose }: DemoCreditsDialogProps) {
  const offline = areDemosDisabled();
  const commands = DEMO_CREDITS_LOCAL_COMMANDS.join("\n");
  const [copied, onCopy] = useCopyButton(() => navigator.clipboard.writeText(commands));

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="demo-credits-dialog-overlay" />
        <Dialog.Content className="demo-credits-dialog">
          <Dialog.Close asChild>
            <button className="demo-credits-dialog-close" aria-label="Close dialog">
              <X size={16} />
            </button>
          </Dialog.Close>

          <div className="demo-credits-dialog-icon">
            <Download size={18} />
          </div>

          <Dialog.Title asChild>
            <h2>
              {offline
                ? "Hosted demos are temporarily offline"
                : "Hosted demo credits are recharging"}
            </h2>
          </Dialog.Title>
          <Dialog.Description asChild>
            <p>{offline ? DEMOS_PAUSED_LOCAL_MESSAGE : DEMO_CREDITS_EXHAUSTED_MESSAGE}</p>
          </Dialog.Description>

          <div className="demo-credits-dialog-commands-wrap">
            <pre className="demo-credits-dialog-commands">
              <code>{commands}</code>
            </pre>
            <button
              type="button"
              className="demo-credits-dialog-copy"
              aria-label={copied ? "Commands copied" : "Copy commands"}
              onClick={onCopy}
            >
              {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
            </button>
          </div>

          <div className="demo-credits-dialog-actions">
            <Dialog.Close asChild>
              <button className="demo-credits-dialog-secondary">Close</button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
