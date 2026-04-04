"use client";

import "@openuidev/react-ui/components.css";

import { openAIAdapter, openAIMessageFormat } from "@openuidev/react-headless";
import { Copilot } from "@openuidev/react-ui";
import { useCallback, useEffect, useState } from "react";
import { Filter, SlidersHorizontal, LayoutGrid, LayoutList, Search } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import IssueList from "@/components/IssueList";
import type { Team, IssueWithRelations } from "@/data/types";

type TabFilter = "all" | "active" | "backlog";

export default function TangentialApp() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeamId, setActiveTeamId] = useState("t1");
  const [issues, setIssues] = useState<IssueWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [teamsRes, issuesRes] = await Promise.all([
      fetch("/api/teams").then((r) => r.json()),
      fetch(`/api/issues?teamId=${activeTeamId}`).then((r) => r.json()),
    ]);
    setTeams(teamsRes.teams);
    setIssues(issuesRes.issues);
    setLoading(false);
  }, [activeTeamId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeTeam = teams.find((t) => t.id === activeTeamId);
  const states = activeTeam?.states ?? [];

  const filteredIssues = issues.filter((issue) => {
    if (activeTab === "active") {
      const state = states.find((s) => s.id === issue.stateId);
      return state && (state.type === "started" || state.type === "unstarted");
    }
    if (activeTab === "backlog") {
      const state = states.find((s) => s.id === issue.stateId);
      return state && (state.type === "backlog" || state.type === "triage");
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        issue.title.toLowerCase().includes(q) ||
        issue.identifier.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "all", label: "All Issues" },
    { key: "active", label: "Active" },
    { key: "backlog", label: "Backlog" },
  ];

  return (
    <div className="app-layout">
      <Sidebar
        teams={teams}
        activeTeamId={activeTeamId}
        onTeamChange={setActiveTeamId}
      />
      <main className="main-content">
        {/* Header */}
        <div className="main-header">
          <div className="main-header-left">
            <h1 className="main-title">
              {activeTeam?.icon && <span className="main-title-icon">{activeTeam.icon}</span>}
              {activeTeam?.name ?? "Loading..."}
            </h1>
          </div>
        </div>

        {/* Tabs & filters */}
        <div className="main-toolbar">
          <div className="main-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`main-tab ${activeTab === tab.key ? "active" : ""}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="main-actions">
            <button
              className="toolbar-btn"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search size={14} />
            </button>
            <button className="toolbar-btn">
              <Filter size={14} />
              <span>Filter</span>
            </button>
            <button className="toolbar-btn">
              <SlidersHorizontal size={14} />
            </button>
            <button className="toolbar-btn">
              <LayoutList size={14} />
            </button>
            <button className="toolbar-btn">
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="search-bar">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {/* Issue list */}
        <div className="main-body">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <span>Loading issues...</span>
            </div>
          ) : (
            <IssueList issues={filteredIssues} states={states} />
          )}
        </div>

        {/* Bottom bar */}
        <div className="bottom-bar">
          <div className="bottom-bar-left">
            <button className="bottom-bar-help">
              <span className="bottom-bar-help-icon">?</span>
            </button>
          </div>
          <button
            className={`ask-tangential-btn ${showCopilot ? "active" : ""}`}
            onClick={() => setShowCopilot((current) => !current)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 13L13 3M13 3H6M13 3V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Ask Tangential</span>
          </button>
        </div>
      </main>
      {showCopilot && (
        <Copilot
          processMessage={async ({ messages, abortController }) => {
            return fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                messages: openAIMessageFormat.toApi(messages),
              }),
              signal: abortController.signal,
            });
          }}
          streamProtocol={openAIAdapter()}
          agentName="Tangential"
          theme={{ mode: "dark" }}
        />
      )}
    </div>
  );
}
