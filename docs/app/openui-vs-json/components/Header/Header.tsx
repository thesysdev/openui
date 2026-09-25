import { SiteMarketingHeader } from "@/components/site-marketing-header";
import { Theme } from "../../constants";

type HeaderProps = {
  theme: Theme;
  onThemeToggle: () => void;
  hasApiKey: boolean;
  onChangeKey: () => void;
};

export function Header({ theme, onThemeToggle, hasApiKey, onChangeKey }: HeaderProps) {
  void hasApiKey;
  void onChangeKey;

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
