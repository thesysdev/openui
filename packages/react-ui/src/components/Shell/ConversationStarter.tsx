import { useThread } from "@openuidev/react-headless";
import clsx from "clsx";
import { ArrowUp, Lightbulb } from "lucide-react";
import { Fragment, ReactNode } from "react";
import { ConversationStarterIcon, ConversationStarterProps } from "../../types/ConversationStarter";
import { isChatEmpty } from "../_shared/utils";
import { Separator } from "../Separator";

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

const ConversationStarterItem = ({
  displayText,
  prompt,
  onClick,
  variant,
  icon,
}: ConversationStarterItemProps) => {
  const renderedIcon = renderIcon(icon);

  if (variant === "short") {
    return (
      <button
        type="button"
        className="openui-shell-conversation-starter-item-short"
        onClick={() => onClick(prompt)}
      >
        {renderedIcon && (
          <span className="openui-shell-conversation-starter-item-short__icon">{renderedIcon}</span>
        )}
        <span className="openui-shell-conversation-starter-item-short__text">{displayText}</span>
      </button>
    );
  }

  // Long variant (detailed list style)
  return (
    <button
      type="button"
      className="openui-shell-conversation-starter-item-long"
      onClick={() => onClick(prompt)}
    >
      <div className="openui-shell-conversation-starter-item-long__content">
        {renderedIcon && (
          <span className="openui-shell-conversation-starter-item-long__icon">{renderedIcon}</span>
        )}
        <span className="openui-shell-conversation-starter-item-long__text">{displayText}</span>
      </div>
      <span className="openui-shell-conversation-starter-item-long__arrow">
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
   * - "short": Pill-style buttons that wrap (default)
   * - "long": Vertical list items with icons and hover arrow
   */
  variant?: ConversationStarterVariant;
}

export const ConversationStarter = ({
  starters,
  className,
  variant = "short",
}: ConversationStarterContainerProps) => {
  const processMessage = useThread((s) => s.processMessage);
  const isRunning = useThread((s) => s.isRunning);
  const messages = useThread((s) => s.messages);
  const isLoadingMessages = useThread((s) => s.isLoadingMessages);

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

  return (
    <div
      className={clsx(
        "openui-shell-conversation-starter",
        `openui-shell-conversation-starter--${variant}`,
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
          {/* Add separator between items in long variant */}
          {variant === "long" && index < starters.length - 1 && (
            <div className="openui-shell-conversation-starter__separator">
              <Separator />
            </div>
          )}
        </Fragment>
      ))}
    </div>
  );
};

export default ConversationStarter;
