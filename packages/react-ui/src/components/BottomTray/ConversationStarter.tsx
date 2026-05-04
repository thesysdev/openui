import { useThread } from "@openuidev/react-headless";
import clsx from "clsx";
import { ArrowUp, Lightbulb } from "lucide-react";
import { Fragment, ReactNode, isValidElement } from "react";
import { useComposerState } from "../../hooks/useComposerState";
import { ConversationStarterIcon, ConversationStarterProps } from "../../types/ConversationStarter";
import { Carousel, CarouselContent } from "../Carousel";
import { isChatEmpty } from "../_shared/utils";

export type ConversationStarterVariant = "short" | "long";

interface ConversationStarterItemProps extends ConversationStarterProps {
  onClick: (prompt: string) => void;
  variant: ConversationStarterVariant;
}

/**
 * Renders the appropriate icon based on the icon prop value
 * - undefined: Show default lightbulb icon
 * - ReactNode: Show the provided icon (use <></> or React.Fragment for no icon)
 */
const renderIcon = (icon: ConversationStarterIcon | undefined): ReactNode => {
  if (icon === undefined) {
    return <Lightbulb size={16} />;
  }
  return icon;
};

const hasRenderableIcon = (icon: ReactNode): boolean => {
  if (icon === null || icon === undefined || icon === false) {
    return false;
  }

  if (isValidElement(icon) && icon.type === Fragment) {
    return Boolean(icon.props.children);
  }

  return true;
};

const ConversationStarterItem = ({
  displayText,
  prompt,
  onClick,
  variant,
  icon,
}: ConversationStarterItemProps) => {
  const renderedIcon = renderIcon(icon);
  const shouldRenderIcon = hasRenderableIcon(renderedIcon);

  if (variant === "short") {
    return (
      <button
        type="button"
        className="openui-bottom-tray-conversation-starter-item-short"
        onClick={() => onClick(prompt)}
      >
        {shouldRenderIcon && (
          <span className="openui-bottom-tray-conversation-starter-item-short__icon">
            {renderedIcon}
          </span>
        )}
        <span className="openui-bottom-tray-conversation-starter-item-short__text">
          {displayText}
        </span>
      </button>
    );
  }

  // Long variant (detailed list style)
  return (
    <button
      type="button"
      className="openui-bottom-tray-conversation-starter-item-long"
      onClick={() => onClick(prompt)}
    >
      <div className="openui-bottom-tray-conversation-starter-item-long__content">
        {shouldRenderIcon && (
          <span className="openui-bottom-tray-conversation-starter-item-long__icon">
            {renderedIcon}
          </span>
        )}
        <span className="openui-bottom-tray-conversation-starter-item-long__text">
          {displayText}
        </span>
      </div>
      <span className="openui-bottom-tray-conversation-starter-item-long__arrow">
        <ArrowUp size={16} />
      </span>
    </button>
  );
};

export interface ConversationStarterContainerProps {
  starters: ConversationStarterProps[];
  className?: string;
  /**
   * Variant of the conversation starter
   * - "short": Pill-style horizontal buttons (default)
   * - "long": List items with icons and hover arrow
   */
  variant?: ConversationStarterVariant;
}

export const ConversationStarter = ({
  starters,
  className,
  variant = "short",
}: ConversationStarterContainerProps) => {
  const { textContent } = useComposerState();
  const processMessage = useThread((s) => s.processMessage);
  const isRunning = useThread((s) => s.isRunning);
  const messages = useThread((s) => s.messages);
  const isLoadingMessages = useThread((s) => s.isLoadingMessages);
  const isDrafting = textContent.length > 0;

  const handleClick = (prompt: string) => {
    if (isRunning) return;
    processMessage({
      role: "user",
      content: prompt,
    });
  };

  // Only show when there are no messages
  if (!isChatEmpty({ isLoadingMessages, messages })) {
    return null;
  }

  if (starters.length === 0) {
    return null;
  }

  if (variant === "short") {
    return (
      <Carousel
        showButtons={false}
        className={clsx(
          "openui-bottom-tray-conversation-starter",
          "openui-bottom-tray-conversation-starter--short",
          {
            "openui-bottom-tray-conversation-starter--hidden": isDrafting,
          },
          className,
        )}
      >
        <CarouselContent className="openui-bottom-tray-conversation-starter__carousel-content">
          {starters.map((item, index) => (
            <ConversationStarterItem
              key={`${item.displayText}-${index}`}
              displayText={item.displayText}
              prompt={item.prompt}
              icon={item.icon}
              onClick={handleClick}
              variant={variant}
            />
          ))}
        </CarouselContent>
      </Carousel>
    );
  }

  return (
    <div
      className={clsx(
        "openui-bottom-tray-conversation-starter",
        `openui-bottom-tray-conversation-starter--${variant}`,
        {
          "openui-bottom-tray-conversation-starter--hidden": isDrafting,
        },
        className,
      )}
    >
      {starters.map((item, index) => (
        <Fragment key={`${item.displayText}-${index}`}>
          <ConversationStarterItem
            displayText={item.displayText}
            prompt={item.prompt}
            icon={item.icon}
            onClick={handleClick}
            variant={variant}
          />
        </Fragment>
      ))}
    </div>
  );
};

export default ConversationStarter;
