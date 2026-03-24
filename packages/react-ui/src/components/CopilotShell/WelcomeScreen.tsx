import { useThread } from "@openuidev/react-headless";
import clsx from "clsx";
import { ReactNode } from "react";
import { isChatEmpty } from "../_shared/utils";

interface WelcomeScreenBaseProps {
  /**
   * Additional CSS class name
   */
  className?: string;
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
}

export type WelcomeScreenProps = WelcomeScreenWithContentProps | WelcomeScreenWithChildrenProps;

/**
 * Type guard to check if image is a URL object
 */
const isImageUrl = (image: { url: string } | ReactNode): image is { url: string } => {
  return typeof image === "object" && image !== null && "url" in image;
};

export const WelcomeScreen = (props: WelcomeScreenProps) => {
  const { className } = props;

  const messages = useThread((s) => s.messages);
  const isLoadingMessages = useThread((s) => s.isLoadingMessages);

  // Only show when there are no messages
  if (!isChatEmpty({ isLoadingMessages, messages })) {
    return null;
  }

  // Check if children are provided
  if ("children" in props && props.children) {
    return (
      <div className={clsx("openui-copilot-shell-welcome-screen", className)}>{props.children}</div>
    );
  }

  // Props-based content
  const { title, description, image } = props as WelcomeScreenWithContentProps;

  const renderImage = () => {
    if (!image) return null;

    if (isImageUrl(image)) {
      return (
        <img
          src={image.url}
          alt={title || ""}
          className="openui-copilot-shell-welcome-screen__image"
        />
      );
    }

    return image;
  };

  return (
    <div className={clsx("openui-copilot-shell-welcome-screen", className)}>
      {image && (
        <div className="openui-copilot-shell-welcome-screen__image-container">{renderImage()}</div>
      )}
      {(title || description) && (
        <div className="openui-copilot-shell-welcome-screen__content">
          {title && <h2 className="openui-copilot-shell-welcome-screen__title">{title}</h2>}
          {description && (
            <p className="openui-copilot-shell-welcome-screen__description">{description}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default WelcomeScreen;
