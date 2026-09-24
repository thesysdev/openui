"use client";

import { BuildForFreeMenu } from "@/app/_components/build-for-free-menu";
import { CHAT_DEMO_EVENTS, captureChatDemoEvent } from "@/lib/chat-demo-analytics";
import { ToggleGroup } from "@openuidev/react-ui/ToggleGroup";
import { ToggleItem } from "@openuidev/react-ui/ToggleItem";
import { ArrowLeft, Monitor, Smartphone, Tablet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import styles from "../chat-page.module.css";
import { isViewportPreset, type ViewportPreset } from "./viewport-presets";

// Only go back when the previous entry is on this site, so the button never
// sends someone off to wherever they were before landing on the demo.
function canGoBackInApp(): boolean {
  const navigation = (window as { navigation?: { canGoBack?: boolean } }).navigation;
  if (typeof navigation?.canGoBack === "boolean") return navigation.canGoBack;

  if (window.history.length <= 1 || !document.referrer) return false;
  try {
    return new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

const VIEWPORT_OPTIONS = [
  { id: "mobile", label: "Mobile", icon: Smartphone },
  { id: "tablet", label: "Tablet", icon: Tablet },
  { id: "desktop", label: "Desktop", icon: Monitor },
] as const;

interface ChatPageHeaderProps {
  viewport: ViewportPreset;
  availableViewports: readonly ViewportPreset[];
  onViewportChange: (viewport: ViewportPreset) => void;
}

export function ChatPageHeader({
  viewport,
  availableViewports,
  onViewportChange,
}: ChatPageHeaderProps) {
  const router = useRouter();

  const handleBackClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    if (!canGoBackInApp()) return;
    event.preventDefault();
    router.back();
  };

  return (
    <header className={styles.header} aria-label="OpenUI chat controls">
      <div className={styles.headerRow}>
        <Link
          className={styles.backLink}
          href="/"
          prefetch={false}
          aria-label="Back"
          onClick={handleBackClick}
        >
          <ArrowLeft aria-hidden="true" size={15} strokeWidth={2} />
        </Link>

        <div className={styles.viewportControl}>
          {availableViewports.length > 1 ? (
            <ToggleGroup
              type="single"
              value={viewport}
              aria-label="Preview width"
              className={styles.viewportGroup}
              onValueChange={(value) => {
                if (isViewportPreset(value) && availableViewports.includes(value)) {
                  onViewportChange(value);
                }
              }}
            >
              {VIEWPORT_OPTIONS.filter((option) => availableViewports.includes(option.id)).map(
                ({ id, label, icon: Icon }) => (
                  <ToggleItem
                    key={id}
                    id={`chat-viewport-${id}`}
                    value={id}
                    data-attribute-element="preview-option"
                    className={
                      id === "desktop"
                        ? `${styles.viewportItem} ${styles.desktopViewportItem}`
                        : styles.viewportItem
                    }
                    aria-label={`Preview ${id} width`}
                    title={`${label} preview`}
                  >
                    <Icon aria-hidden="true" size={15} />
                    <span className={styles.viewportItemLabel}>{label}</span>
                  </ToggleItem>
                ),
              )}
            </ToggleGroup>
          ) : null}
        </div>

        <BuildForFreeMenu
          analyticsSource="chat_navbar"
          className={styles.buildForFreeMenu}
          dataAttributeElement="build-for-free"
          onOpen={() => captureChatDemoEvent(CHAT_DEMO_EVENTS.buildMenuOpen, {})}
        />
      </div>
    </header>
  );
}
