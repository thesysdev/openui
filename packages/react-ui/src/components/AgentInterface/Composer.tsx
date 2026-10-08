import { useThread } from "@openuidev/react-headless";
import clsx from "clsx";
import { useCallback, useRef, type ReactNode } from "react";
import type { ConversationStarterProps } from "../../types/ConversationStarter";
import { useStartersFromContext } from "./_shared/startersContext";
import { isChatEmpty } from "./_shared/utils";
import { Composer as ComposerInput } from "./components/Composer";
import { ConversationStarter, type ConversationStarterVariant } from "./ConversationStarter";

export interface ComposerProps {
  className?: string;
  placeholder?: string;
  /** Starters chips shown above the input when chat is empty. Inherits from <AgentInterface starters>. */
  starters?: ConversationStarterProps[];
  /** Layout variant for starters. Inherits from <AgentInterface starterVariant>. */
  starterVariant?: ConversationStarterVariant;
  /** Mode C — fully replaces the composer area. When provided, auto-starters rendering is disabled. */
  children?: ReactNode;
}

/**
 * Publishes the composer slot's height on its panel as
 * `--openui-agent-composer-slot-height`, so the scroll area (which runs behind
 * the floating composer) can pad and fade by exactly that much. A callback ref
 * re-attaches the observer whenever the slot element is replaced.
 */
const useComposerSlotHeight = () => {
  const disposeRef = useRef<(() => void) | null>(null);
  return useCallback((slot: HTMLDivElement | null) => {
    // React 18 detaches by calling the ref with null; React 19 calls the
    // returned cleanup instead. Either path disconnects the observer.
    disposeRef.current?.();
    disposeRef.current = null;
    if (!slot) return;
    const update = () =>
      slot.parentElement?.style.setProperty(
        "--openui-agent-composer-slot-height",
        `${slot.offsetHeight}px`,
      );
    update();
    const observer = new ResizeObserver(update);
    observer.observe(slot);
    const dispose = () => observer.disconnect();
    disposeRef.current = dispose;
    return dispose;
  }, []);
};

export const Composer = ({
  className,
  placeholder,
  starters: ownStarters,
  starterVariant: ownVariant,
  children,
}: ComposerProps) => {
  const fromCtx = useStartersFromContext();
  const messages = useThread((s) => s.messages);
  const isLoadingMessages = useThread((s) => s.isLoadingMessages);
  const slotRef = useComposerSlotHeight();

  if (children != null) {
    return (
      <div ref={slotRef} className={clsx("openui-agent-composer-slot", className)}>
        {children}
      </div>
    );
  }

  const effectiveStarters = ownStarters ?? fromCtx.starters;
  const effectiveVariant = ownVariant ?? fromCtx.starterVariant ?? "short";
  const showStarters =
    isChatEmpty({ isLoadingMessages, messages }) &&
    effectiveStarters !== undefined &&
    effectiveStarters.length > 0;

  return (
    <div ref={slotRef} className={clsx("openui-agent-composer-slot", className)}>
      {showStarters && (
        <ConversationStarter starters={effectiveStarters!} variant={effectiveVariant} />
      )}
      <ComposerInput placeholder={placeholder} />
    </div>
  );
};
