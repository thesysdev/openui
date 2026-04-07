"use client";

import { Button } from "@openuidev/react-ui";
import { Check, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
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

type PickerOption = {
  value: string;
  label: string;
  description?: string;
  avatarUsername?: string;
  icon?: string;
};

const DEVELOPER_OPTIONS: PickerOption[] = DEMO_USERS.map((user) => ({
  value: user.username,
  label: user.label,
  description: `@${user.username}`,
  avatarUsername: user.username,
}));

const FOCUS_AREA_OPTIONS: PickerOption[] = GITHUB_STARTERS.map((starter) => ({
  value: starter.prompt,
  label: starter.label,
  icon: starter.icon,
}));

function renderOptionLeading(option: PickerOption) {
  if (option.avatarUsername) {
    return (
      <img
        src={`https://github.com/${option.avatarUsername}.png?size=40`}
        alt=""
        className="gh-dropdown-avatar"
      />
    );
  }

  if (option.icon) {
    return <span className="gh-dropdown-icon">{option.icon}</span>;
  }

  return null;
}

type OptionListProps = {
  ariaLabel: string;
  options: PickerOption[];
  value: string | null;
  onChange: (value: string) => void;
};

function OptionList({
  ariaLabel,
  options,
  value,
  onChange,
}: OptionListProps) {
  return (
    <div className="gh-choiceList" role="listbox" aria-label={ariaLabel}>
      {options.map((option) => {
        const isSelected = option.value === value;
        const leading = renderOptionLeading(option);

        return (
          <button
            key={option.value}
            type="button"
            className={`gh-choiceOption ${option.description ? "gh-choiceOption-developer" : "gh-choiceOption-focus"} ${isSelected ? "gh-choiceOption-selected" : ""}`}
            role="option"
            aria-selected={isSelected}
            onClick={() => onChange(option.value)}
          >
            {option.description ? (
              <>
                <span className="gh-choiceOptionPrimary">
                  {leading && (
                    <span className="gh-choiceOptionLeading" aria-hidden="true">
                      {leading}
                    </span>
                  )}
                  <span className="gh-choiceOptionLabel">{option.label}</span>
                </span>
                <span className="gh-choiceOptionTrailing">
                  <span className="gh-choiceOptionDescription">{option.description}</span>
                  {isSelected && <Check size={16} className="gh-choiceOptionCheck" aria-hidden="true" />}
                </span>
              </>
            ) : (
              <>
                <span className="gh-choiceOptionPrimary">
                  {leading && (
                    <span className="gh-choiceOptionLeading" aria-hidden="true">
                      {leading}
                    </span>
                  )}
                  <span className="gh-choiceOptionLabel">{option.label}</span>
                </span>
                {isSelected && <Check size={16} className="gh-choiceOptionCheck" aria-hidden="true" />}
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function GitHubConnect({ onConnectAndPrompt }: GitHubConnectProps) {
  const [username, setUsername] = useState("");
  const [selectedDeveloperUsername, setSelectedDeveloperUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selectedGithubPrompt, setSelectedGithubPrompt] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (selectedDeveloperUsername) {
      return;
    }

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
  }, [selectedDeveloperUsername, username]);

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

  const handleClearSelectedDeveloper = useCallback(() => {
    setSelectedDeveloperUsername(null);
    setError("");
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, []);

  const trimmedUsername = username.trim();
  const effectiveUsername = trimmedUsername || selectedDeveloperUsername || "";
  const selectedDeveloperOption =
    DEVELOPER_OPTIONS.find((option) => option.value === selectedDeveloperUsername) ?? null;
  const selectedFocusOption =
    FOCUS_AREA_OPTIONS.find((option) => option.value === selectedGithubPrompt) ?? null;
  const selectedDeveloperLeading = selectedDeveloperOption
    ? renderOptionLeading(selectedDeveloperOption)
    : null;
  const hasValidUsername =
    effectiveUsername.length > 0 &&
    effectiveUsername.length <= 39 &&
    /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(effectiveUsername);
  const hasIdentitySelection = Boolean(effectiveUsername);
  const canStart = Boolean(selectedGithubPrompt) && hasValidUsername;
  const canReset = Boolean(trimmedUsername || selectedDeveloperUsername || error || selectedGithubPrompt);

  const handleReset = useCallback(() => {
    setUsername("");
    setSelectedDeveloperUsername(null);
    setAvatarUrl(null);
    setError("");
    setSelectedGithubPrompt(null);
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
            <span className="gh-builder-inline gh-builder-inline-single">
              <label className="gh-visually-hidden" htmlFor="gh-username-input">
                GitHub username
              </label>
              {selectedDeveloperOption ? (
                <span className="gh-inline-chip">
                  {selectedDeveloperLeading && (
                    <span className="gh-inline-chipLeading" aria-hidden="true">
                      {selectedDeveloperLeading}
                    </span>
                  )}
                  <span className="gh-inline-chipLabel">{selectedDeveloperOption.description}</span>
                  <button
                    type="button"
                    className="gh-inline-chipClear"
                    aria-label="Clear selected developer"
                    onClick={handleClearSelectedDeveloper}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </span>
              ) : (
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
                      placeholder="your username"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </span>
                </span>
              )}
            </span>
          </h1>

          {!selectedDeveloperOption && (
            <div className="gh-step gh-step-appear">
              <p className="gh-step-caption">or select a developer</p>
              <OptionList
                ariaLabel="Select a developer"
                options={DEVELOPER_OPTIONS}
                value={selectedDeveloperUsername}
                onChange={handlePopularDeveloperSelect}
              />
            </div>
          )}

          {hasIdentitySelection && (
            <div className="gh-step gh-step-focus gh-step-appear">
              <div className="gh-step-copy">
                <span className="gh-step-title">that is about</span>
                <span className={`gh-inline-display ${selectedFocusOption ? "gh-inline-display-filled" : ""}`}>
                  {selectedFocusOption?.label ?? ""}
                </span>
              </div>
              {!selectedFocusOption && (
                <>
                  <p className="gh-step-caption">pick a focus area</p>
                  <OptionList
                    ariaLabel="Select a focus area"
                    options={FOCUS_AREA_OPTIONS}
                    value={selectedGithubPrompt}
                    onChange={(nextPrompt) => {
                      setSelectedGithubPrompt(nextPrompt);
                      setError("");
                    }}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {error && <div className="gh-error">{error}</div>}

        {hasIdentitySelection && selectedGithubPrompt && (
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
        )}
      </form>
    </div>
  );
}
