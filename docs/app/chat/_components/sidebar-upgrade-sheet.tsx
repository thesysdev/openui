"use client";

import { CloudFeatureMarquee } from "@/app/(home)/cloud/CloudFeatureMarquee";
import { CHAT_DEMO_EVENTS, captureChatDemoEvent, getChatDemoId } from "@/lib/chat-demo-analytics";
import { useThreadList } from "@openuidev/react-headless";
import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "../chat-page.module.css";
import { getDemoConversation } from "./demo-conversations";
import type { DemoForkRegistry } from "./demo-fork-registry";

// Sidebar footer: "Demo powered by OpenUI Cloud" label plus a "Why upgrade?"
// button that opens a bottom sheet with the Cloud page's 12-reasons marquee.
interface SidebarUpgradeFooterProps {
  forkRegistry: DemoForkRegistry;
}

export function SidebarUpgradeFooter({ forkRegistry }: SidebarUpgradeFooterProps) {
  const [open, setOpen] = useState(false);
  const selectedThreadId = useThreadList((state) => state.selectedThreadId);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hasCapturedPromptView = useRef(false);

  const sourceDemoId =
    getDemoConversation(selectedThreadId)?.id ??
    (selectedThreadId ? forkRegistry.getDemoId(selectedThreadId) : undefined);
  const demoId = getChatDemoId(sourceDemoId);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button || hasCapturedPromptView.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || entry.intersectionRatio < 0.5) return;
        hasCapturedPromptView.current = true;
        captureChatDemoEvent(CHAT_DEMO_EVENTS.upgradePromptView, {});
        observer.disconnect();
      },
      { threshold: 0.5 },
    );
    observer.observe(button);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <div className={styles.sidebarUpgradeFooter}>
        <div className={styles.sidebarBuiltWith}>
          Demo powered by OpenUI
          <span className={styles.sidebarCloudChip}>Cloud</span>
        </div>
        <button
          ref={buttonRef}
          type="button"
          className={styles.sidebarUpgradeButton}
          data-attribute-element="why-upgrade"
          onClick={() => {
            captureChatDemoEvent(CHAT_DEMO_EVENTS.upgradePromptClick, {
              ...(demoId ? { demo_id: demoId } : {}),
            });
            setOpen(true);
          }}
        >
          Why upgrade?
        </button>
      </div>
      {open && (
        <div
          className={styles.upgradeSheetOverlay}
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className={styles.upgradeSheet}
            role="dialog"
            aria-modal="true"
            aria-label="12 reasons to switch to Cloud"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.upgradeSheetHeader}>
              <h2 className={styles.upgradeSheetTitle}>12 reasons to switch to Cloud</h2>
              <div className={styles.upgradeSheetActions}>
                <Link
                  href="/docs/agent/getting-started/quickstart"
                  prefetch={false}
                  className={`${styles.upgradeSheetCta} ${styles.upgradeSheetCtaDesktop}`}
                  data-attribute-element="upgrade-cta"
                  onClick={() =>
                    captureChatDemoEvent(CHAT_DEMO_EVENTS.upgradeCtaClick, {
                      placement: "desktop",
                      destination: "getting_started_docs",
                      ...(demoId ? { demo_id: demoId } : {}),
                    })
                  }
                >
                  Build for free
                  <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  className={styles.upgradeSheetClose}
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <X size={15} strokeWidth={2} aria-hidden="true" />
                </button>
              </div>
            </div>
            <CloudFeatureMarquee />
            <Link
              href="/docs/agent/getting-started/quickstart"
              prefetch={false}
              className={`${styles.upgradeSheetCta} ${styles.upgradeSheetCtaMobile}`}
              data-attribute-element="upgrade-cta"
              onClick={() =>
                captureChatDemoEvent(CHAT_DEMO_EVENTS.upgradeCtaClick, {
                  placement: "mobile",
                  destination: "getting_started_docs",
                  ...(demoId ? { demo_id: demoId } : {}),
                })
              }
            >
              Build for free
              <ArrowRight size={15} strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
