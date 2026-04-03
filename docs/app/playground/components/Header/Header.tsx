import { OpenUILogo, ThesysLogo } from "@/components/brand-logo";
import { BookOpen, Github, KeyRound, Monitor, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Theme } from "../../constants";
import "./Header.css";

function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === "light") return <Sun size={15} />;
  if (theme === "dark") return <Moon size={15} />;
  return <Monitor size={15} />;
}

type HeaderProps = {
  theme: Theme;
  onThemeToggle: () => void;
  hasApiKey: boolean;
  onChangeKey: () => void;
  githubUsername?: string | null;
  onDisconnect?: () => void;
};

export function Header({ theme, onThemeToggle, hasApiKey, onChangeKey, githubUsername, onDisconnect }: HeaderProps) {
  const themeLabel = { system: "System", light: "Light", dark: "Dark" }[theme];
  const [isLogoHovered, setIsLogoHovered] = useState(false);

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-left">
          <ThesysLogo isHovered={isLogoHovered} onHoverChange={setIsLogoHovered} />
          <div className="h-4 w-px bg-black/10" />
          <OpenUILogo />
        </div>

        <span className="header-title">Playground</span>

        <div className="header-right">
          <a
            className="header-btn"
            href="https://github.com/thesysdev/openui"
            target="_blank"
            rel="noreferrer"
          >
            <Github size={14} />
            GitHub
          </a>
          <a className="header-btn" href="/docs" target="_blank" rel="noreferrer">
            <BookOpen size={14} />
            Docs
          </a>

          <button
            className="header-btn header-icon-btn"
            onClick={onThemeToggle}
            title={`Theme: ${themeLabel}`}
            aria-label={`Switch theme (current: ${themeLabel})`}
          >
            <ThemeIcon theme={theme} />
          </button>

          {hasApiKey && (
            <button
              className="header-btn header-icon-btn"
              onClick={onChangeKey}
              title="Change API Key"
              aria-label="Change API Key"
            >
              <KeyRound size={15} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
