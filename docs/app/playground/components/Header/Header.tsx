import { SiteMarketingHeader } from "@/components/site-marketing-header";
import { IconButton } from "@openuidev/react-ui";
import { KeyRound } from "lucide-react";
import type { ReactNode } from "react";
import { Theme } from "../../constants";
import "./Header.css";

type HeaderProps = {
  theme: Theme;
  onThemeToggle: () => void;
  hasApiKey: boolean;
  onChangeKey: () => void;
};

export function Header({ theme, onThemeToggle, hasApiKey, onChangeKey }: HeaderProps) {
  const themeLabel = { system: "System", light: "Light", dark: "Dark" }[theme];
  const extraActions: ReactNode = hasApiKey ? (
    <IconButton
      className="header-btn header-icon-btn"
      icon={<KeyRound size={15} />}
      variant="tertiary"
      size="extra-small"
      onClick={onChangeKey}
      title="Change API Key"
      aria-label="Change API Key"
    />
  ) : null;

  return (
    <SiteMarketingHeader
      borderMode="always"
      extraActions={extraActions}
      themeToggle={{
        onToggle: onThemeToggle,
        title: `Theme: ${themeLabel}`,
        ariaLabel: `Switch theme (current: ${themeLabel})`,
      }}
    />
  );
}
