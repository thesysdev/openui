import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export const gitConfig = {
  user: "thesysdev",
  repo: "openui",
  branch: "main",
};

export const siteConfig = {
  githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  discordUrl: "https://discord.gg/ZeSTyHZTEV",
};

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "OpenUI",
    },
  };
}
