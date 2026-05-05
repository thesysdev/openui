"use client";

import { EyeSlash, LockSimple, Scroll } from "@phosphor-icons/react";
import { NpmButton } from "../HeroSection/HeroSection";
import styles from "./StuckInChatSection.module.css";

const ICON_SIZE = 18;

const NEGATIVES = [
  {
    title: "No visibility",
    description: "Agent actions and context are buried in chat. You can't see what it's doing.",
    icon: <EyeSlash size={ICON_SIZE} weight="fill" />,
  },
  {
    title: "No structure",
    description: "Everything becomes one long scroll. Work gets scattered and hard to revisit.",
    icon: <Scroll size={ICON_SIZE} weight="fill" />,
  },
  {
    title: "No control",
    description: "You can't manage tasks, permissions, or execution. Only send messages.",
    icon: <LockSimple size={ICON_SIZE} weight="fill" />,
  },
];

export function StuckInChatSection({ installCommand }: { installCommand: string }) {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <h2 className={styles.heading}>Is your agent still stuck in Telegram?</h2>
        <p className={styles.description}>
          OpenClaw is powerful, but you&apos;re limiting it by keeping it inside a chat thread.
        </p>

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
          <NpmButton command={installCommand} className={styles.installButton} />
        </div>
      </div>
    </section>
  );
}
