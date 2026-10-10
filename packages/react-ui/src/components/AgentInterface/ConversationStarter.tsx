import { useThread } from "@openuidev/react-headless";
import clsx from "clsx";
import { ArrowUp, Lightbulb } from "lucide-react";
import { Fragment, ReactNode, isValidElement } from "react";
import { ConversationStarterIcon, ConversationStarterProps } from "../../types/ConversationStarter";
import { Carousel, CarouselContent } from "../Carousel";
import { isChatEmpty } from "./_shared/utils";

export type ConversationStarterVariant = "short" | "long" | "card";

interface ConversationStarterItemProps extends ConversationStarterProps {
  onClick: () => void;
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

  if (isValidElement<{ children?: ReactNode }>(icon) && icon.type === Fragment) {
    return Boolean(icon.props.children);
  }

  return true;
};

const ConversationStarterItem = ({
  displayText,
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
        className="openui-agent-conversation-starter-item-short"
        onClick={onClick}
      >
        {shouldRenderIcon && (
          <span className="openui-agent-conversation-starter-item-short__icon">{renderedIcon}</span>
        )}
        <span className="openui-agent-conversation-starter-item-short__text">{displayText}</span>
      </button>
    );
  }

  if (variant === "card") {
    return (
      <button
        type="button"
        className="openui-agent-conversation-starter-item-card"
        onClick={onClick}
      >
        {shouldRenderIcon && (
          <span className="openui-agent-conversation-starter-item-card__icon">{renderedIcon}</span>
        )}
        <span className="openui-agent-conversation-starter-item-card__text">{displayText}</span>
      </button>
    );
  }

  // Long variant (detailed list style)
  return (
    <button type="button" className="openui-agent-conversation-starter-item-long" onClick={onClick}>
      <div className="openui-agent-conversation-starter-item-long__content">
        {shouldRenderIcon && (
          <span className="openui-agent-conversation-starter-item-long__icon">{renderedIcon}</span>
        )}
        <span className="openui-agent-conversation-starter-item-long__text">{displayText}</span>
      </div>
      <span className="openui-agent-conversation-starter-item-long__arrow">
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
   * - "long": Vertical list items with icons and hover arrow
   * - "card": A row of equal-width cards, icon above text
   */
  variant?: ConversationStarterVariant;
  /**
   * Optional click override. When provided, replaces the default
   * send-to-thread behavior (still guarded by `isRunning`). The prefill-chips
   * welcome uses it to submit contextual starters with the prefilled draft.
   */
  onSelect?: (starter: ConversationStarterProps) => void;
}

export const ConversationStarter = ({
  starters,
  className,
  variant = "short",
  onSelect,
}: ConversationStarterContainerProps) => {
  const processMessage = useThread((s) => s.processMessage);
  const isRunning = useThread((s) => s.isRunning);
  const messages = useThread((s) => s.messages);
  const isLoadingMessages = useThread((s) => s.isLoadingMessages);

  const handleClick = (starter: ConversationStarterProps) => {
    if (isRunning) return;
    if (onSelect) {
      onSelect(starter);
      return;
    }
    processMessage({
      role: "user",
      content: starter.prompt,
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
          "openui-agent-conversation-starter",
          "openui-agent-conversation-starter--short",
          className,
        )}
      >
        <CarouselContent className="openui-agent-conversation-starter__carousel-content">
          {starters.map((item, index) => (
            <ConversationStarterItem
              key={`${item.displayText}-${index}`}
              displayText={item.displayText}
              prompt={item.prompt}
              icon={item.icon}
              onClick={() => handleClick(item)}
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
        "openui-agent-conversation-starter",
        `openui-agent-conversation-starter--${variant}`,
        className,
      )}
    >
      {starters.map((item, index) => (
        <Fragment key={`${item.displayText}-${index}`}>
          {index > 0 && variant === "long" && (
            <div className="openui-agent-conversation-starter__separator" aria-hidden="true" />
          )}
          <ConversationStarterItem
            displayText={item.displayText}
            prompt={item.prompt}
            icon={item.icon}
            onClick={() => handleClick(item)}
            variant={variant}
          />
        </Fragment>
      ))}
    </div>
  );
};

export default ConversationStarter;
