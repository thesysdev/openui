"use client";

import { Github } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { GITHUB_STARTERS, STARTER_PROMPTS } from "../../constants";
import "./GitHubConnect.css";

type GitHubConnectProps = {
  onConnect: (username: string) => void;
  onConnectAndPrompt: (username: string, prompt: string) => void;
  onGenericPrompt: (prompt: string) => void;
};

const DEMO_USERS = [
  { username: "torvalds", label: "Linus Torvalds" },
  { username: "yyx990803", label: "Evan You" },
  { username: "gaearon", label: "Dan Abramov" },
  { username: "rauchg", label: "Guillermo Rauch" },
];

export function GitHubConnect({
  onConnect,
  onConnectAndPrompt,
  onGenericPrompt,
}: GitHubConnectProps) {
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced avatar preview
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
    }, 400);

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

  const handleConnect = () => {
    if (validate(username)) {
      onConnect(username.trim());
    }
  };

  return (
    <div className="gh-connect">
      <div className="gh-connect-hero">
        <div className="gh-connect-icon">
          <Github size={32} />
        </div>
        <h1 className="gh-connect-title">Explore Your GitHub</h1>
        <p className="gh-connect-subtitle">
          Connect your profile to build live, interactive dashboards with real
          data
        </p>
      </div>

      <div className="gh-connect-form">
        <div className="gh-input-row">
          {avatarUrl && (
            <img src={avatarUrl} alt="" className="gh-avatar-preview" />
          )}
          <input
            ref={inputRef}
            className="gh-input"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleConnect();
            }}
            placeholder="Enter your GitHub username"
          />
          <button
            className="gh-connect-btn"
            onClick={handleConnect}
            disabled={!username.trim()}
          >
            Connect
          </button>
        </div>
        {error && <div className="gh-error">{error}</div>}
      </div>

      {/* Demo users */}
      <div className="gh-demo-section">
        <div className="gh-demo-label">or try with a popular developer</div>
        <div className="gh-demo-users">
          {DEMO_USERS.map((u) => (
            <button
              key={u.username}
              className="gh-demo-chip"
              onClick={() => onConnect(u.username)}
            >
              <img
                src={`https://github.com/${u.username}.png?size=24`}
                alt=""
                className="gh-demo-avatar"
              />
              <span className="gh-demo-name">{u.label}</span>
              <span className="gh-demo-handle">@{u.username}</span>
            </button>
          ))}
        </div>
      </div>

      {/* GitHub starter prompts — connect + prompt in one click */}
      <div className="gh-starters">
        <div className="gh-starters-label">
          Quick start with @torvalds
        </div>
        <div className="gh-starters-grid">
          {GITHUB_STARTERS.map((s) => (
            <button
              key={s.prompt}
              className="gh-starter-card"
              onClick={() => onConnectAndPrompt("torvalds", s.prompt)}
            >
              <span className="gh-starter-icon">{s.icon}</span>
              <div className="gh-starter-label">{s.label}</div>
              <div className="gh-starter-desc">
                {s.prompt.length > 60
                  ? s.prompt.slice(0, 60) + "..."
                  : s.prompt}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Generic fallback */}
      <div className="gh-divider">
        <span>or try without GitHub</span>
      </div>
      <div className="gh-generic-chips">
        {STARTER_PROMPTS.map((p) => (
          <button key={p} className="chip" onClick={() => onGenericPrompt(p)}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
