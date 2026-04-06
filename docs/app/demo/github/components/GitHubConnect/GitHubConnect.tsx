"use client";

import { Button } from "@openuidev/react-ui";
import { Check, ChevronDown } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { GITHUB_STARTERS } from "../../constants";
import "./GitHubConnect.css";

type GitHubConnectProps = {
  onConnectAndPrompt: (username: string, prompt: string) => void;
};

const DEMO_USERS = [
  { username: "torvalds", label: "Linus Torvalds" },
  { username: "yyx990803", label: "Evan You" },
  { username: "gaearon", label: "Dan Abramov" },
  { username: "rauchg", label: "Guillermo Rauch" },
];

type DropdownOption = {
  value: string;
  label: string;
  description?: string;
  leading?: ReactNode;
};

const DEVELOPER_OPTIONS: DropdownOption[] = DEMO_USERS.map((user) => ({
  value: user.username,
  label: user.label,
  description: `@${user.username}`,
  leading: (
    <img
      src={`https://github.com/${user.username}.png?size=40`}
      alt=""
      className="gh-dropdown-avatar"
    />
  ),
}));

const FOCUS_AREA_OPTIONS: DropdownOption[] = GITHUB_STARTERS.map((starter) => ({
  value: starter.prompt,
  label: starter.label,
  leading: <span className="gh-dropdown-icon">{starter.icon}</span>,
}));

function getRandomStarterPrompt() {
  const idx = Math.floor(Math.random() * GITHUB_STARTERS.length);
  return GITHUB_STARTERS[idx].prompt;
}

type InlineDropdownProps = {
  id: string;
  ariaLabel: string;
  placeholder: string;
  options: DropdownOption[];
  value: string | null;
  onChange: (value: string) => void;
  showSelectedDescription?: boolean;
};

function InlineDropdown({
  id,
  ariaLabel,
  placeholder,
  options,
  value,
  onChange,
  showSelectedDescription = false,
}: InlineDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const selectedOption = options.find((option) => option.value === value) ?? null;

  return (
    <div
      ref={containerRef}
      className={`gh-inline-select-wrap gh-inline-select-dropdown ${isOpen ? "gh-inline-select-wrap-open" : ""}`}
    >
      <button
        id={id}
        type="button"
        className={`gh-inline-selectButton ${selectedOption ? "gh-inline-selectButton-filled" : ""}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {selectedOption ? (
          <span className="gh-inline-selectValue">
            {selectedOption.leading && (
              <span className="gh-inline-selectLeading" aria-hidden="true">
                {selectedOption.leading}
              </span>
            )}
            <span className="gh-inline-selectText">
              <span className="gh-inline-selectLabel">{selectedOption.label}</span>
              {showSelectedDescription && selectedOption.description && (
                <span className="gh-inline-selectDescription">{selectedOption.description}</span>
              )}
            </span>
          </span>
        ) : (
          <span className="gh-inline-selectPlaceholder">{placeholder}</span>
        )}
        <ChevronDown
          aria-hidden="true"
          size={18}
          className={`gh-inline-selectChevron ${isOpen ? "gh-inline-selectChevron-open" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="gh-dropdownMenu" role="listbox" aria-labelledby={id}>
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <button
                key={option.value}
                type="button"
                className={`gh-dropdownOption ${isSelected ? "gh-dropdownOption-selected" : ""}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span className="gh-dropdownOptionContent">
                  {option.leading && <span className="gh-dropdownOptionLeading">{option.leading}</span>}
                  <span className="gh-dropdownOptionCopy">
                    <span className="gh-dropdownOptionLabel">{option.label}</span>
                    {option.description && (
                      <span className="gh-dropdownOptionDescription">{option.description}</span>
                    )}
                  </span>
                </span>
                {isSelected && <Check size={16} className="gh-dropdownOptionCheck" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function GitHubConnect({ onConnectAndPrompt }: GitHubConnectProps) {
  const initialGithubPrompt = useMemo(() => getRandomStarterPrompt(), []);
  const [username, setUsername] = useState("");
  const [selectedDeveloperUsername, setSelectedDeveloperUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [defaultGithubPrompt, setDefaultGithubPrompt] = useState(initialGithubPrompt);
  const [selectedGithubPrompt, setSelectedGithubPrompt] = useState(initialGithubPrompt);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!username.trim() || username.trim().length < 2) {
      return;
    }

    debounceRef.current = setTimeout(() => {
      const url = `https://github.com/${username.trim()}.png?size=64`;
      const img = new window.Image();
      img.onload = () => setAvatarUrl(url);
      img.onerror = () => setAvatarUrl(null);
      img.src = url;
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username]);

  const validate = useCallback((name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a GitHub username");
      return false;
    }
    if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(trimmed)) {
      setError("Invalid username format");
      return false;
    }
    if (trimmed.length > 39) {
      setError("Username too long");
      return false;
    }
    setError("");
    return true;
  }, []);

  const handlePopularDeveloperSelect = useCallback(
    (nextUsername: string) => {
      setSelectedDeveloperUsername(nextUsername);
      setUsername("");
      setAvatarUrl(null);
      setError("");
    },
    [],
  );

  const trimmedUsername = username.trim();
  const effectiveUsername = trimmedUsername || selectedDeveloperUsername || "";
  const hasValidUsername =
    effectiveUsername.length > 0 &&
    effectiveUsername.length <= 39 &&
    /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(effectiveUsername);
  const canStart = selectedGithubPrompt !== null && hasValidUsername;
  const canReset = Boolean(
    trimmedUsername || selectedDeveloperUsername || error || selectedGithubPrompt !== defaultGithubPrompt,
  );

  const handleReset = useCallback(() => {
    const nextDefaultPrompt = getRandomStarterPrompt();
    setUsername("");
    setSelectedDeveloperUsername(null);
    setAvatarUrl(null);
    setError("");
    setDefaultGithubPrompt(nextDefaultPrompt);
    setSelectedGithubPrompt(nextDefaultPrompt);
    inputRef.current?.focus();
  }, []);

  const [validating, setValidating] = useState(false);

  const handleStartGenerating = async () => {
    if (!selectedGithubPrompt) return;
    if (!validate(effectiveUsername)) return;

    setValidating(true);
    try {
      const res = await fetch(`https://api.github.com/users/${effectiveUsername}`);
      if (!res.ok) {
        setError("GitHub user not found");
        setValidating(false);
        return;
      }
    } catch {
      setError("Could not verify username");
      setValidating(false);
      return;
    }
    setValidating(false);

    onConnectAndPrompt(effectiveUsername, selectedGithubPrompt);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleStartGenerating();
  };

  return (
    <div className="gh-connect">
      <form className="gh-builder" onSubmit={handleSubmit}>
        <div className="gh-builder-copy">
          <h1 className="gh-builder-title">
            <span>Create an interactive GitHub dashboard for</span>
            <span className="gh-builder-inline">
              <label className="gh-visually-hidden" htmlFor="gh-username-input">
                GitHub username
              </label>
              <span className={`gh-inline-input ${avatarUrl ? "gh-inline-input-with-avatar" : ""}`}>
                {avatarUrl && <img src={avatarUrl} alt="" className="gh-inline-avatar" />}
                <span className="gh-inline-inputControl">
                  <span aria-hidden="true" className="gh-inline-inputSizer">
                    {username || "your username"}
                  </span>
                  <input
                    id="gh-username-input"
                    ref={inputRef}
                    className="gh-inline-input-field"
                    value={username}
                    onChange={(e) => {
                      setSelectedDeveloperUsername(null);
                      setUsername(e.target.value);
                      setAvatarUrl(null);
                      setError("");
                    }}
                    placeholder="username"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </span>
              </span>
              <span className="gh-inline-copy">or</span>
              <label className="gh-visually-hidden" htmlFor="gh-developer-select">
                Popular developer
              </label>
              <InlineDropdown
                id="gh-developer-select"
                ariaLabel="Select a developer"
                placeholder="select a developer"
                options={DEVELOPER_OPTIONS}
                value={selectedDeveloperUsername}
                onChange={handlePopularDeveloperSelect}
              />
            </span>
            <span>that focuses on</span>
            <span className="gh-builder-inline gh-builder-inline-single">
              <label className="gh-visually-hidden" htmlFor="gh-focus-area-select">
                Focus area
              </label>
              <InlineDropdown
                id="gh-focus-area-select"
                ariaLabel="Select a focus area"
                placeholder="focus area"
                options={FOCUS_AREA_OPTIONS}
                value={selectedGithubPrompt}
                onChange={(nextPrompt) => {
                  setSelectedGithubPrompt(nextPrompt);
                  setError("");
                }}
              />
            </span>
          </h1>
        </div>

        {error && <div className="gh-error">{error}</div>}

        <div className="gh-start-actions">
          <Button
            className="gh-reset-button"
            variant="secondary"
            type="button"
            onClick={handleReset}
            disabled={!canReset}
          >
            Reset
          </Button>
          <Button className="gh-generate-button" type="submit" disabled={!canStart || validating}>
            {validating ? "Verifying..." : "Generate"}
          </Button>
        </div>
      </form>
    </div>
  );
}
