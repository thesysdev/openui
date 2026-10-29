"use client";

import { DEMO_CREDITS_EXHAUSTED_MESSAGE, DEMO_CREDITS_LOCAL_COMMANDS } from "@/lib/demo-credits";
import * as Dialog from "@radix-ui/react-dialog";
import { Download, X } from "lucide-react";
import "./DemoCreditsDialog.css";

type DemoCreditsDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function DemoCreditsDialog({ open, onClose }: DemoCreditsDialogProps) {
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
            <h2>Hosted demo credits are recharging</h2>
          </Dialog.Title>
          <Dialog.Description asChild>
            <p>{DEMO_CREDITS_EXHAUSTED_MESSAGE}</p>
          </Dialog.Description>

          <pre className="demo-credits-dialog-commands">
            <code>{DEMO_CREDITS_LOCAL_COMMANDS.join("\n")}</code>
          </pre>

          <div className="demo-credits-dialog-actions">
            <a
              className="demo-credits-dialog-primary"
              href="https://github.com/thesysdev/openui"
              target="_blank"
              rel="noreferrer"
            >
              <Download size={14} />
              Download repo
            </a>
            <Dialog.Close asChild>
              <button className="demo-credits-dialog-secondary">Close</button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
