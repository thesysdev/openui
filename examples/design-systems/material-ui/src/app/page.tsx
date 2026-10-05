"use client";

import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { AgentInterface, fetchLLM, openAIAdapter, openAIMessageFormat } from "@openuidev/react-ui";
import { useMemo } from "react";

import { useColorMode } from "@/hooks/use-system-theme";
import { muiChatLibrary } from "@/lib/mui-genui";

export default function Page() {
  const { mode, toggle } = useColorMode();

  const llm = useMemo(
    () =>
      fetchLLM({
        url: "/api/chat",
        streamAdapter: openAIAdapter(),
        messageFormat: openAIMessageFormat,
      }),
    [],
  );

  return (
    <Box sx={{ height: "100vh", width: "100vw", overflow: "hidden", position: "relative" }}>
      <Box sx={{ position: "fixed", top: 12, right: 16, zIndex: 1300 }}>
        <Tooltip title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
          <IconButton onClick={toggle} size="small" aria-label="Toggle color mode">
            {mode === "dark" ? (
              <LightModeIcon fontSize="small" />
            ) : (
              <DarkModeIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      <AgentInterface
        llm={llm}
        componentLibrary={muiChatLibrary}
        agentName="Material UI Chat"
        theme={{ mode }}
        starterVariant="short"
        starters={[
          {
            displayText: "Startup dashboard",
            prompt:
              "Build a startup analytics dashboard with a CardHeader, Tabs (Revenue BarChart, Growth LineChart, Breakdown PieChart), a key metrics Table, a progress bar toward the annual goal, and follow-ups.",
          },
          {
            displayText: "Onboarding form",
            prompt:
              "Create an account onboarding form with an info Alert, then a Form containing inputs for name and email, a Select for plan, and a SwitchGroup for notification preferences. Add follow-ups.",
          },
          {
            displayText: "Project status",
            prompt:
              "Generate a project status report with a CardHeader, a warning Alert for blockers, a List of this week's tasks, an Accordion (Done, In progress, Blocked), and a BarChart of story points per engineer. Add follow-ups.",
          },
          {
            displayText: "Pricing comparison",
            prompt:
              "Show a pricing comparison with a CardHeader, a Table comparing three plans, a List of included features, and buttons to choose a plan. Add follow-ups.",
          },
          {
            displayText: "Chart showcase",
            prompt:
              "Build a 'Quarterly Report' with Tabs containing a grouped BarChart (revenue by region, 2 series), a LineChart (monthly active users, 2 series), and a donut PieChart (traffic sources, 4 slices). Below, add a summary Table and follow-ups.",
          },
        ]}
      />
    </Box>
  );
}
