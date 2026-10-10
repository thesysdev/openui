import { useThread, useThreadList } from "@openuidev/react-headless";
import clsx from "clsx";
import { ReactNode, useEffect, useRef, useState } from "react";
import { ConversationStarterProps } from "../../types/ConversationStarter";
import { PromptTemplate } from "../../types/PromptTemplate";
import { useStartersFromContext } from "./_shared/startersContext";
import { isChatEmpty } from "./_shared/utils";
import { submitStarterPrompt } from "./_shared/utils/welcomePrefill";
import { DesktopWelcomeComposer, WelcomePrefillChips } from "./components";
import { ConversationStarter, ConversationStarterVariant } from "./ConversationStarter";
import { WelcomeGlow, WelcomeGlowProvider } from "./WelcomeGlow";

interface WelcomeScreenBaseProps {
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Plays the one-shot welcome entrance and composer glow animation.
   * @default false
   */
  glowAnimation?: boolean;
}

interface WelcomeScreenWithContentProps extends WelcomeScreenBaseProps {
  /**
   * The greeting/title text to display
   */
  title?: string;
  /**
   * Optional description text to add more context
   */
  description?: string;
  /**
   * Image to display - can be a URL object or a ReactNode
   * - { url: string }: Renders an <img> tag with default styling (64x64, object-fit: cover, rounded)
   * - ReactNode: Renders the provided element directly (for custom icons, styled images, etc.)
   */
  image?: { url: string } | ReactNode;
  /**
   * Conversation starters to show below the composer
   */
  starters?: ConversationStarterProps[];
  /**
   * Variant of the conversation starters
   */
  starterVariant?: ConversationStarterVariant;
  /**
   * Fill-in-the-blank prompt templates, rendered as chips between the composer
   * and the starters. Clicking one drops its prompt stem into the composer
   * (instead of sending) and shows the template's completions. Selecting a
   * completion sends the completed prompt immediately.
   */
  promptTemplates?: PromptTemplate[];
  /**
   * Label of the leading tab (shown with `promptTemplates`) that lists the
   * default starters.
   * @default "Getting started"
   */
  startersTabLabel?: string;
  /**
   * Icon of the leading starters tab.
   * @default <Rocket />
   */
  startersTabIcon?: ReactNode;
  /**
   * Children are not allowed when using props-based content
   */
  children?: never;
}

interface WelcomeScreenWithChildrenProps extends WelcomeScreenBaseProps {
  /**
   * Custom content to render inside the welcome screen
   * When children are provided, title, description, and image are ignored
   */
  children: ReactNode;
  title?: never;
  description?: never;
  image?: never;
  starters?: never;
  starterVariant?: never;
  promptTemplates?: never;
  startersTabLabel?: never;
  startersTabIcon?: never;
}

export type WelcomeScreenProps = WelcomeScreenWithContentProps | WelcomeScreenWithChildrenProps;

/**
 * Type guard to check if image is a URL object
 */
const isImageUrl = (image: { url: string } | ReactNode): image is { url: string } => {
  return typeof image === "object" && image !== null && "url" in image;
};

export const WelcomeScreen = (props: WelcomeScreenProps) => {
  const { className, glowAnimation = false } = props;
  const fromCtx = useStartersFromContext();

  const ownStarters = "starters" in props ? props.starters : undefined;
  const ownVariant = "starterVariant" in props ? props.starterVariant : undefined;
  const starters = ownStarters ?? fromCtx.starters ?? [];
  const starterVariant = ownVariant ?? fromCtx.starterVariant ?? "long";
  const promptTemplates = ("promptTemplates" in props ? props.promptTemplates : undefined) ?? [];
  const hasChips = promptTemplates.length > 0;

  const messages = useThread((s) => s.messages);
  const isLoadingMessages = useThread((s) => s.isLoadingMessages);
  const isRunning = useThread((s) => s.isRunning);
  const processMessage = useThread((s) => s.processMessage);

  // Prefill-chips draft state — owned here (not in the composer) so chips can
  // write into the draft. Hooks stay unconditional; unused without chips.
  const [draft, setDraft] = useState("");
  const [selectedChip, setSelectedChip] = useState<PromptTemplate | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const selectedThreadId = useThreadList((s) => s.selectedThreadId);

  // The welcome renders unkeyed across thread switches, so a chip-prefilled
  // draft would otherwise leak into the next empty thread.
  useEffect(() => {
    setDraft("");
    setSelectedChip(null);
  }, [selectedThreadId]);

  // Only show when there are no messages
  if (!isChatEmpty({ isLoadingMessages, messages })) {
    return null;
  }

  // Check if children are provided
  if ("children" in props && props.children) {
    return (
      <WelcomeGlowProvider enabled={glowAnimation}>
        <div
          className={clsx("openui-agent-welcome-screen", className, {
            "openui-agent-welcome-screen--animated": glowAnimation,
          })}
        >
          {props.children}
        </div>
      </WelcomeGlowProvider>
    );
  }

  // Props-based content
  const { title, description, image, startersTabLabel, startersTabIcon } =
    props as WelcomeScreenWithContentProps;

  const renderImage = () => {
    if (!image) return null;

    if (isImageUrl(image)) {
      return (
        <img src={image.url} alt={title || ""} className="openui-agent-welcome-screen__image" />
      );
    }

    return image;
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (!value) {
      setSelectedChip(null);
    }
  };

  const handleChipClick = (chip: PromptTemplate) => {
    if (isRunning) return;
    setDraft(chip.prompt);
    setSelectedChip(chip);
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    // Caret to the end once React has applied the new value.
    requestAnimationFrame(() => {
      input.setSelectionRange(chip.prompt.length, chip.prompt.length);
    });
  };

  const handleStartersClick = () => {
    if (isRunning || !selectedChip) return;
    // Drop the chip's stem only if the user hasn't extended it.
    if (draft === selectedChip.prompt) setDraft("");
    setSelectedChip(null);
  };

  const handleContextualSelect = (starter: ConversationStarterProps) => {
    submitStarterPrompt(processMessage, draft, starter.prompt);
    // Clear at submit time like the composer's own submit path — the
    // thread-switch reset above won't fire when selectedThreadId doesn't
    // change (e.g. thread creation fails on a fresh chat and it stays null),
    // and the stale stem would resurface if the welcome shows again.
    setDraft("");
    setSelectedChip(null);
  };

  return (
    <WelcomeGlowProvider enabled={glowAnimation}>
      <div
        className={clsx(
          "openui-agent-welcome-screen",
          "openui-agent-welcome-screen--with-composer",
          className,
          {
            "openui-agent-welcome-screen--animated": glowAnimation,
          },
        )}
      >
        <div className="openui-agent-welcome-screen__header">
          {image && (
            <div className="openui-agent-welcome-screen__image-container">{renderImage()}</div>
          )}
          {(title || description) && (
            <div className="openui-agent-welcome-screen__content">
              {title && <h2 className="openui-agent-welcome-screen__title">{title}</h2>}
              {description && (
                <p className="openui-agent-welcome-screen__description">{description}</p>
              )}
            </div>
          )}
        </div>
        {/* Desktop-only welcome composer */}
        <div
          className="openui-agent-welcome-screen__composer-starters-container"
          data-has-prefill-chips={(hasChips && (draft.length === 0 || !!selectedChip)) || undefined}
        >
          <div className="openui-agent-welcome-screen__desktop-composer">
            <WelcomeGlow>
              {hasChips ? (
                <DesktopWelcomeComposer
                  value={draft}
                  onChange={handleDraftChange}
                  drafting={draft.length > 0 && !selectedChip}
                  inputRef={inputRef}
                />
              ) : (
                <DesktopWelcomeComposer />
              )}
            </WelcomeGlow>
          </div>
          {hasChips ? (
            <WelcomePrefillChips
              chips={promptTemplates}
              starters={starters}
              starterVariant={starterVariant}
              draft={draft}
              selectedChip={selectedChip}
              onChipClick={handleChipClick}
              onStartersClick={handleStartersClick}
              startersLabel={startersTabLabel}
              startersIcon={startersTabIcon}
              onContextualSelect={handleContextualSelect}
              disabled={isRunning}
            />
          ) : (
            /* Desktop-only conversation starters */
            starters.length > 0 && (
              <div className="openui-agent-welcome-screen__desktop-starters">
                <ConversationStarter starters={starters} variant={starterVariant} />
              </div>
            )
          )}
        </div>
      </div>
    </WelcomeGlowProvider>
  );
};

export default WelcomeScreen;
