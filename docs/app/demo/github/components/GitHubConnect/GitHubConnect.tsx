"use client";

import { GitHubIcon } from "@/components/brand-logo";
import { Button } from "@openuidev/react-ui";
import {
  Activity,
  Check,
  CircleDot,
  Code2,
  GitPullRequest,
  Hexagon,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  GITHUB_STARTERS,
  type GitHubStarterIconKey,
  type GitHubStarterTone,
} from "../../constants";
import "./GitHubConnect.css";

type GitHubConnectProps = {
  onConnectAndPrompt: (username: string, prompt: string) => void;
};

type DeveloperTone = "peach" | "mint" | "violet" | "rose";

type PickerOption = {
  value: string;
  label: string;
  kind: "developer" | "focus";
  tone: DeveloperTone | GitHubStarterTone;
  icon?: GitHubStarterIconKey;
  avatarUsername?: string;
};

const STARTER_ICON_MAP: Record<GitHubStarterIconKey, LucideIcon> = {
  "commit-activity": Activity,
  "pull-requests": GitPullRequest,
  "issue-tracking": CircleDot,
  "code-reviews": Search,
  "language-breakdown": Code2,
  "repository-stats": Hexagon,
};

const DEMO_USERS = [
  { username: "torvalds", tone: "peach" },
  { username: "yyx990803", tone: "mint" },
  { username: "rauchg", tone: "violet" },
  { username: "gaearon", tone: "rose" },
  { username: "ctate", tone: "mint" },
] as const satisfies ReadonlyArray<{ username: string; tone: DeveloperTone }>;

const DEVELOPER_OPTIONS: PickerOption[] = DEMO_USERS.map((user) => ({
  value: user.username,
  label: `@${user.username}`,
  kind: "developer",
  tone: user.tone,
  avatarUsername: user.username,
}));

const FOCUS_AREA_OPTIONS: PickerOption[] = GITHUB_STARTERS.map((starter) => ({
  value: starter.prompt,
  label: starter.label,
  kind: "focus",
  tone: starter.tone,
  icon: starter.icon,
}));

function GitHubStarterIcon({ icon }: { icon: GitHubStarterIconKey }) {
  const Icon = STARTER_ICON_MAP[icon];
  return <Icon size={16} strokeWidth={2} />;
}

function renderOptionLeading(option: PickerOption) {
  if (option.kind === "developer") {
    return option.avatarUsername ? (
      <img
        src={`https://github.com/${option.avatarUsername}.png?size=40`}
        alt=""
        className="gh-choiceAvatar"
      />
    ) : (
      <span className={`gh-choiceSwatch gh-tone-${option.tone}`} />
    );
  }

  if (option.icon) {
    return (
      <span className={`gh-choiceIconBubble gh-tone-${option.tone}`}>
        <GitHubStarterIcon icon={option.icon} />
      </span>
    );
  }

  return null;
}

type OptionListProps = {
  ariaLabel: string;
  options: PickerOption[];
  value: string | null;
  onChange: (value: string) => void;
  className?: string;
};

function OptionList({ ariaLabel, options, value, onChange, className = "" }: OptionListProps) {
  return (
    <div className={`gh-choiceList ${className}`.trim()} role="listbox" aria-label={ariaLabel}>
      {options.map((option) => {
        const isSelected = option.value === value;
        const leading = renderOptionLeading(option);

        return (
          <button
            key={option.value}
            type="button"
            className={`gh-choiceOption gh-choiceOption-${option.kind} gh-tone-${option.tone} ${isSelected ? "gh-choiceOption-selected" : ""}`}
            role="option"
            aria-selected={isSelected}
            onClick={() => onChange(option.value)}
          >
            <span className="gh-choiceOptionPrimary">
              {leading && (
                <span className="gh-choiceOptionLeading" aria-hidden="true">
                  {leading}
                </span>
              )}
              <span className="gh-choiceOptionLabel">{option.label}</span>
            </span>
            {isSelected && <Check size={16} className="gh-choiceOptionCheck" aria-hidden="true" />}
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
  const [validating, setValidating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (selectedDeveloperUsername) return;
    if (!username.trim() || username.trim().length < 2) return;

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

  const focusInput = useCallback(() => {
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const handleReset = useCallback(() => {
    setUsername("");
    setSelectedDeveloperUsername(null);
    setAvatarUrl(null);
    setError("");
    setSelectedGithubPrompt(null);
    focusInput();
  }, [focusInput]);

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

  const handlePopularDeveloperSelect = useCallback((nextUsername: string) => {
    setSelectedDeveloperUsername(nextUsername);
    setUsername("");
    setAvatarUrl(null);
    setError("");
  }, []);

  const handleClearIdentity = useCallback(() => handleReset(), [handleReset]);
  const handleClearSelectedFocus = useCallback(() => {
    setSelectedGithubPrompt(null);
    setError("");
  }, []);
  const handleClearTypedUsername = useCallback(() => {
    setUsername("");
    setAvatarUrl(null);
    setError("");
    focusInput();
  }, [focusInput]);

  const trimmedUsername = username.trim();
  const effectiveUsername = trimmedUsername || selectedDeveloperUsername || "";
  const selectedDeveloperOption =
    DEVELOPER_OPTIONS.find((o) => o.value === selectedDeveloperUsername) ?? null;
  const selectedFocusOption =
    FOCUS_AREA_OPTIONS.find((o) => o.value === selectedGithubPrompt) ?? null;
  const selectedDeveloperLeading = selectedDeveloperOption
    ? renderOptionLeading(selectedDeveloperOption)
    : null;
  const selectedFocusLeading = selectedFocusOption
    ? renderOptionLeading(selectedFocusOption)
    : null;
  const hasValidUsername =
    effectiveUsername.length > 0 &&
    effectiveUsername.length <= 39 &&
    /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(effectiveUsername);
  const hasIdentitySelection = Boolean(effectiveUsername);
  const isTypedIdentityLocked = Boolean(
    trimmedUsername && selectedGithubPrompt && hasValidUsername,
  );
  const showDeveloperPicker = !selectedDeveloperOption && !trimmedUsername;
  const canStart = Boolean(selectedGithubPrompt) && hasValidUsername;
  const canReset = Boolean(
    trimmedUsername || selectedDeveloperUsername || error || selectedGithubPrompt,
  );

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

  const renderIdentityControl = () => {
    if (selectedDeveloperOption) {
      return (
        <span className={`gh-chip gh-tone-${selectedDeveloperOption.tone}`}>
          {selectedDeveloperLeading && (
            <span className="gh-chipLeading">{selectedDeveloperLeading}</span>
          )}
          <span className="gh-chipLabel">{selectedDeveloperOption.label}</span>
          <button
            type="button"
            className="gh-chipClear"
            aria-label="Clear selected developer"
            onClick={handleClearIdentity}
          >
            <X size={14} />
          </button>
        </span>
      );
    }
    if (isTypedIdentityLocked) {
      return (
        <span className="gh-chip gh-chip-neutral">
          <span className="gh-chipLeading">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="gh-chipAvatar" />
            ) : (
              <span className="gh-chipMonogram">@</span>
            )}
          </span>
          <span className="gh-chipLabel">@{effectiveUsername}</span>
          <button
            type="button"
            className="gh-chipClear"
            aria-label="Clear username"
            onClick={handleClearIdentity}
          >
            <X size={14} />
          </button>
        </span>
      );
    }
    return (
      <span className={`gh-inputWrap ${avatarUrl ? "gh-inputWrap-withAvatar" : ""}`}>
        {avatarUrl && <img src={avatarUrl} alt="" className="gh-chipAvatar" />}
        <span className="gh-inputPrefix">@</span>
        <span className="gh-inputSizer">
          <span className="gh-inputGhost">{username || "username"}</span>
          <input
            id="gh-username-input"
            ref={inputRef}
            className="gh-inputField"
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
        {trimmedUsername && (
          <button
            type="button"
            className="gh-inputClear"
            aria-label="Clear"
            onClick={handleClearTypedUsername}
          >
            <X size={14} />
          </button>
        )}
      </span>
    );
  };

  return (
    <div className="gh-connect">
      <form className="gh-builder" onSubmit={handleSubmit}>
        <div className="gh-brand">
          <span className="gh-brandIcon">
            <GitHubIcon />
          </span>
          <span className="gh-brandLabel">GitPulse</span>
        </div>

        <div className="gh-sentence">
          <p className="gh-sentenceLine">Create an interactive GitHub dashboard for</p>
          <div className="gh-sentenceIdentity">{renderIdentityControl()}</div>

          {hasIdentitySelection && (
            <p className="gh-sentenceLine gh-sentenceLine-secondary">
              that focuses on{" "}
              {selectedFocusOption ? (
                <span className={`gh-chip gh-chip-focus gh-tone-${selectedFocusOption.tone}`}>
                  {selectedFocusLeading && (
                    <span className="gh-chipLeading">{selectedFocusLeading}</span>
                  )}
                  <span className="gh-chipLabel">{selectedFocusOption.label}</span>
                  <button
                    type="button"
                    className="gh-chipClear"
                    aria-label="Clear topic"
                    onClick={handleClearSelectedFocus}
                  >
                    <X size={14} />
                  </button>
                </span>
              ) : (
                <span className="gh-selectHintInline">...</span>
              )}
            </p>
          )}
        </div>

        {showDeveloperPicker && (
          <div className="gh-devPicker gh-step-appear">
            <p className="gh-devPickerCaption">or select a developer</p>
            <OptionList
              ariaLabel="Select a developer"
              options={DEVELOPER_OPTIONS}
              value={selectedDeveloperUsername}
              onChange={handlePopularDeveloperSelect}
              className="gh-choiceList-developer"
            />
          </div>
        )}

        {hasIdentitySelection && !selectedFocusOption && (
          <div className="gh-focusPicker gh-step-appear">
            <p className="gh-focusPickerCaption">Select a topic</p>
            <OptionList
              ariaLabel="Select a focus area"
              options={FOCUS_AREA_OPTIONS}
              value={selectedGithubPrompt}
              onChange={(v) => {
                setSelectedGithubPrompt(v);
                setError("");
              }}
              className="gh-choiceList-focus"
            />
          </div>
        )}

        {error && <div className="gh-error">{error}</div>}

        {hasIdentitySelection && selectedGithubPrompt && (
          <div className="gh-actions gh-step-appear">
            <Button
              className="gh-cta"
              size="large"
              type="submit"
              disabled={!canStart || validating}
            >
              {validating ? "Verifying..." : "Let's go"}
            </Button>
            <button
              type="button"
              className="gh-startOver"
              onClick={handleReset}
              disabled={!canReset}
            >
              Start over
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
