"use client";

import { CopyCommand } from "@/components/CopyCommand";
import { DEMOS_PAUSED_LOCAL_COMMAND, DEMOS_PAUSED_LOCAL_MESSAGE } from "@/lib/demos-offline";
import * as Dialog from "@radix-ui/react-dialog";
import { CloudOff, X } from "lucide-react";
import { useSyncExternalStore } from "react";
import "./DemoCreditsDialog.css";
import "./DemosOfflineDialog.css";

/* Open state lives at module level, so a demo can open the dialog from its
   submit handler without threading state or callbacks down to it. */
let isOpen = false;
const listeners = new Set<() => void>();

function setOpen(next: boolean) {
  isOpen = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Opens the "hosted demos are offline" dialog. Call it instead of sending a demo request. */
export function openDemosOfflineDialog(): void {
  setOpen(true);
}

/** Mount once per demo page while NEXT_PUBLIC_DEMOS_DISABLED is set. */
export function DemosOfflineDialog() {
  const open = useSyncExternalStore(
    subscribe,
    () => isOpen,
    () => false,
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="demo-credits-dialog-overlay" />
        <Dialog.Content className="demo-credits-dialog">
          <Dialog.Close asChild>
            <button className="demo-credits-dialog-close" aria-label="Close dialog">
              <X size={16} />
            </button>
          </Dialog.Close>

          <div className="demo-credits-dialog-icon">
            <CloudOff size={18} />
          </div>

          <Dialog.Title asChild>
            <h2>Hosted demos are temporarily offline</h2>
          </Dialog.Title>
          <Dialog.Description asChild>
            <p>{DEMOS_PAUSED_LOCAL_MESSAGE}</p>
          </Dialog.Description>

          <CopyCommand command={DEMOS_PAUSED_LOCAL_COMMAND} />

          <div className="demo-credits-dialog-actions">
            <Dialog.Close asChild>
              <button className="demos-offline-dialog-close">Close</button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
