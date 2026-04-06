"use client";

import { Button } from "@openuidev/react-ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { GITHUB_STARTERS } from "../../constants";
import "./GitHubConnect.css";

type GitHubConnectProps = {
  onConnectAndPrompt: (username: string, prompt: string) => void;
};

const RANDOM_SENTINEL = "__random__";

const DEMO_USERS = [
  { username: "torvalds", label: "Linus Torvalds" },
  { username: "yyx990803", label: "Evan You" },
  { username: "gaearon", label: "Dan Abramov" },
  { username: "rauchg", label: "Guillermo Rauch" },
];

export function GitHubConnect({ onConnectAndPrompt }: GitHubConnectProps) {
  const [username, setUsername] = useState("");
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

    if (!username.trim() || username.trim().length < 2) {
      setAvatarUrl(null);
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

  const preventMouseSelection = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  }, []);

  const pickRandomPrompt = useCallback(() => {
    const idx = Math.floor(Math.random() * GITHUB_STARTERS.length);
    return GITHUB_STARTERS[idx].prompt;
  }, []);

  const handlePopularDeveloperSelect = useCallback(
    (nextUsername: string) => {
      setUsername(nextUsername);
      setError("");
      if (!selectedGithubPrompt) {
        setSelectedGithubPrompt(RANDOM_SENTINEL);
      }
    },
    [selectedGithubPrompt],
  );

  const trimmedUsername = username.trim();
  const hasValidUsername =
    trimmedUsername.length > 0 &&
    trimmedUsername.length <= 39 &&
    /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(trimmedUsername);
  const canStart = selectedGithubPrompt !== null && hasValidUsername;
  const selectedDemoUsername =
    DEMO_USERS.find((user) => user.username === trimmedUsername)?.username ?? null;
  const canReset = Boolean(trimmedUsername || selectedGithubPrompt || error);

  const handleReset = useCallback(() => {
    setUsername("");
    setAvatarUrl(null);
    setError("");
    setSelectedGithubPrompt(null);
    inputRef.current?.focus();
  }, []);

  const [validating, setValidating] = useState(false);

  const handleStartGenerating = async () => {
    if (!selectedGithubPrompt) return;
    if (!validate(username)) return;

    setValidating(true);
    try {
      const res = await fetch(`https://api.github.com/users/${trimmedUsername}`);
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

    const prompt =
      selectedGithubPrompt === RANDOM_SENTINEL ? pickRandomPrompt() : selectedGithubPrompt;
    onConnectAndPrompt(trimmedUsername, prompt);
  };

  return (
    <div className="gh-connect">
      <div className="gh-connect-hero">
        <h1 className="gh-connect-title">Try a live &amp; interactive dashboard of GitHub</h1>
      </div>

      <div className="gh-connect-section gh-connect-form">
        <div className="gh-section-label">Enter your GitHub username</div>
        <div className="gh-input-row">
          {avatarUrl && <img src={avatarUrl} alt="" className="gh-avatar-preview" />}
          <input
            ref={inputRef}
            className="gh-input"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canStart) handleStartGenerating();
            }}
            placeholder="Type here"
          />
        </div>
        {error && <div className="gh-error">{error}</div>}
      </div>

      <div className="gh-connect-section gh-demo-section">
        <div className="gh-section-label">or try with any of these popular developers</div>
        <div className="gh-chip-scroll">
          <div className="gh-demo-users">
            {[0, 1].map((row) => (
              <div key={row} className="gh-chip-row">
                {DEMO_USERS.slice(
                  row * Math.ceil(DEMO_USERS.length / 2),
                  (row + 1) * Math.ceil(DEMO_USERS.length / 2),
                ).map((u) => (
                  <Button
                    key={u.username}
                    className={`gh-demo-chip ${selectedDemoUsername === u.username ? "gh-demo-chip-selected" : ""}`}
                    variant="tertiary"
                    size="small"
                    onMouseDown={preventMouseSelection}
                    onClick={() => handlePopularDeveloperSelect(u.username)}
                  >
                    <img
                      src={`https://github.com/${u.username}.png?size=24`}
                      alt=""
                      className="gh-demo-avatar"
                    />
                    <span className="gh-demo-copy">
                      <span className="gh-demo-name">{u.label}</span>
                      <span className="gh-demo-handle">@{u.username}</span>
                    </span>
                  </Button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="gh-connect-section gh-starters">
        <div className="gh-section-label">Pick a prompt</div>
        <div className="gh-chip-scroll">
          <div className="gh-starters-inline">
            {(() => {
              const allStarters = [
                { key: RANDOM_SENTINEL, icon: "🎲", label: "Random", prompt: RANDOM_SENTINEL },
                ...GITHUB_STARTERS.map((s) => ({ key: s.prompt, ...s })),
              ];
              const mid = Math.ceil(allStarters.length / 2);
              return [0, 1].map((row) => (
                <div key={row} className="gh-chip-row">
                  {allStarters.slice(row * mid, (row + 1) * mid).map((s) => (
                    <Button
                      key={s.key}
                      className={`gh-starter-chip ${
                        s.prompt === RANDOM_SENTINEL
                          ? selectedGithubPrompt === RANDOM_SENTINEL
                            ? "gh-starter-chip-selected"
                            : ""
                          : selectedGithubPrompt === s.prompt
                            ? "gh-starter-chip-selected"
                            : ""
                      }`}
                      variant="tertiary"
                      size="small"
                      onMouseDown={preventMouseSelection}
                      onClick={() => {
                        setSelectedGithubPrompt(s.prompt);
                        setError("");
                      }}
                    >
                      <span className="gh-starter-icon">{s.icon}</span>
                      <span className="gh-starter-chip-label">{s.label}</span>
                    </Button>
                  ))}
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      <div className="gh-start-actions">
        <Button variant="secondary" onClick={handleReset} disabled={!canReset}>
          Reset
        </Button>
        <Button onClick={handleStartGenerating} disabled={!canStart || validating}>
          {validating ? "Verifying..." : "Start generating"}
        </Button>
      </div>
    </div>
  );
}
