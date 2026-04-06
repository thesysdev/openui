import { SiteMarketingHeader } from "@/components/site-marketing-header";
import type { Theme } from "../../constants";
import "./Header.css";

type HeaderProps = {
  theme: Theme;
  onThemeToggle: () => void;
};

export function Header({ theme, onThemeToggle }: HeaderProps) {
  const themeLabel = { system: "System", light: "Light", dark: "Dark" }[theme];

  return (
    <SiteMarketingHeader
      borderMode="always"
      themeToggle={{
        onToggle: onThemeToggle,
        title: `Theme: ${themeLabel}`,
        ariaLabel: `Switch theme (current: ${themeLabel})`,
      }}
    />
  );
}
