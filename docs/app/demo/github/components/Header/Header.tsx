import { SiteMarketingHeader } from "@/components/site-marketing-header";
import type { Theme } from "../../constants";
import "./Header.css";

type HeaderProps = {
  theme: Theme;
  onThemeToggle: () => void;
  borderMode?: "always" | "scroll";
};

export function Header({ theme, onThemeToggle, borderMode = "always" }: HeaderProps) {
  const themeLabel = { system: "System", light: "Light", dark: "Dark" }[theme];

  return (
    <SiteMarketingHeader
      borderMode={borderMode}
      themeToggle={{
        onToggle: onThemeToggle,
        title: `Theme: ${themeLabel}`,
        ariaLabel: `Switch theme (current: ${themeLabel})`,
      }}
    />
  );
}
