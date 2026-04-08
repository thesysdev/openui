import { Share2 } from "lucide-react";
import React, { type ReactNode } from "react";
import { useLayoutContext } from "../../context/LayoutContext";
import { Button } from "../Button";
import { IconButton } from "../IconButton";
import { useTheme } from "../ThemeProvider/ThemeProvider";
import { ShareThreadModal } from "./ShareThreadModal";
import { useShareThread } from "./useShareThread";

/**
 * Props for {@link ShareThread}.
 *
 * @category Components
 */
export interface ShareThreadProps {
  /** Async function that receives the threadId and returns a shareable URL. */
  generateShareLink: (threadId: string) => Promise<string>;
  /** Title for the share modal. Defaults to `"Share chat"`. */
  modalTitle?: string;
  /** Custom trigger element. When omitted, a default share button is rendered. */
  customTrigger?: ReactNode;
}

/**
 * Share button that opens a modal for generating and copying a shareable link.
 * Renders nothing when there are no messages to share.
 *
 * @category Components
 */
export const ShareThread = ({ generateShareLink, modalTitle, customTrigger }: ShareThreadProps) => {
  const { layout } = useLayoutContext() || {};
  const isMobile = layout === "mobile";
  const { portalThemeClassName } = useTheme();

  const { hasMessages, getShareThreadLink, shouldDisableShareButton } = useShareThread({
    generateShareLink,
  });

  if (!hasMessages) return null;

  return (
    <ShareThreadModal
      title={modalTitle}
      trigger={
        customTrigger ?? (
          <DefaultShareButton
            isMobile={isMobile}
            shouldDisableShareButton={shouldDisableShareButton}
          />
        )
      }
      generateLink={getShareThreadLink}
      themeClassName={portalThemeClassName}
    />
  );
};

ShareThread.displayName = "ShareThread";

type DefaultShareButtonProps = {
  isMobile: boolean;
  shouldDisableShareButton?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const DefaultShareButton = React.forwardRef<HTMLButtonElement, DefaultShareButtonProps>(
  ({ isMobile, shouldDisableShareButton, ...props }, ref) => {
    return isMobile ? (
      <IconButton
        ref={ref as React.RefObject<HTMLButtonElement>}
        size="medium"
        icon={<Share2 size="1em" />}
        variant="secondary"
        disabled={shouldDisableShareButton}
        {...props}
      />
    ) : (
      <Button
        ref={ref as React.RefObject<HTMLButtonElement>}
        variant="secondary"
        disabled={shouldDisableShareButton}
        {...props}
      >
        <Share2 />
        Share
      </Button>
    );
  },
);

DefaultShareButton.displayName = "DefaultShareButton";
