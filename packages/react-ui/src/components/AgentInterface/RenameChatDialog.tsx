import { useThreadList } from "@openuidev/react-headless";
import * as Dialog from "@radix-ui/react-dialog";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "../Button";
import { Input } from "../Input";

export interface RenameChatDialogProps {
  /** The chat (thread) to rename. */
  threadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Small dialog for renaming a chat: a title field prefilled with the current
 * name, Save / Cancel. Enter saves, Escape closes. Shared by the sidebar thread
 * menu and the ChatHeader actions menu.
 */
export const RenameChatDialog = ({ threadId, open, onOpenChange }: RenameChatDialogProps) => {
  const thread = useThreadList((s) => s.threads.find((t) => t.id === threadId));
  const updateThread = useThreadList((s) => s.updateThread);
  const [title, setTitle] = useState(thread?.title ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  // Re-seed the field from the current title each time the dialog opens.
  useEffect(() => {
    if (open) setTitle(thread?.title ?? "");
  }, [open, thread?.title]);

  const trimmed = title.trim();
  const canSave = !!thread && trimmed.length > 0 && trimmed !== thread.title;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!thread) return;
    if (canSave) updateThread({ ...thread, title: trimmed });
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="openui-agent-rename-dialog__overlay" />
        <Dialog.Content
          className="openui-agent-rename-dialog"
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
            inputRef.current?.select();
          }}
        >
          <form className="openui-agent-rename-dialog__form" onSubmit={handleSubmit}>
            <Dialog.Title className="openui-agent-rename-dialog__title">Rename chat</Dialog.Title>
            <Input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Chat title"
              placeholder="Chat title"
              className="openui-agent-rename-dialog__input"
            />
            <div className="openui-agent-rename-dialog__actions">
              <Dialog.Close asChild>
                <Button type="button" variant="tertiary" size="small">
                  Cancel
                </Button>
              </Dialog.Close>
              <Button type="submit" variant="primary" size="small" disabled={!canSave}>
                Save
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default RenameChatDialog;
