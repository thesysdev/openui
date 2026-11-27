"use client";

import { EyeSlash, LockSimple, Scroll } from "@phosphor-icons/react";
import { SectionHeader } from "../../components/SectionHeader/SectionHeader";
import { InstallSplitButton } from "../../openclaw-os/InstallSplitButton";
import { GitHubBanner } from "../HeroSection/HeroSection";
import styles from "./StuckInChatSection.module.css";

const ICON_SIZE = 28;

const NEGATIVES = [
  {
    title: "No visibility",
    description: "Agent actions and context are buried in chat. You can't see what it's doing.",
    icon: <EyeSlash size={ICON_SIZE} weight="light" />,
  },
  {
    title: "No structure",
    description: "Everything becomes one long scroll. Work gets scattered and hard to revisit.",
    icon: <Scroll size={ICON_SIZE} weight="light" />,
  },
  {
    title: "No control",
    description: "You can't manage tasks, permissions, or execution. Only send messages.",
    icon: <LockSimple size={ICON_SIZE} weight="light" />,
  },
];

export function StuckInChatSection({
  installCommand,
  windowsInstallCommand,
}: {
  installCommand: string;
  windowsInstallCommand: string;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <SectionHeader title="Is your agent still stuck in Telegram?">
            <p className={styles.description}>
              OpenClaw is powerful, but you&apos;re limiting it by keeping it inside a chat thread.
            </p>
          </SectionHeader>
        </div>

        <ul className={styles.cards}>
          {NEGATIVES.map((item) => (
            <li key={item.title} className={styles.card}>
              <div className={styles.cardIcon}>{item.icon}</div>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.cardDescription}>{item.description}</p>
            </li>
          ))}
        </ul>

        <div className={styles.cta}>
          <p className={styles.ctaSub}>Setup OpenClaw OS in under a minute</p>
          <InstallSplitButton macCommand={installCommand} winCommand={windowsInstallCommand} />
          <GitHubBanner
            href="https://github.com/thesysdev/openclaw-os"
            className={styles.ctaGithub}
          />
        </div>
      </div>
    </section>
  );
}
