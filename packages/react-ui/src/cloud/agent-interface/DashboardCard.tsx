"use client";

import clsx from "clsx";
import { Play } from "lucide-react";
import { Button } from "../../components/Button";
import { useArtifactRenderer } from "../CloudArtifact/contexts";
import { PreviewLoader, PreviewTitle } from "../CloudArtifact/slots";
import { names, styles } from "./agentInterface.styles";

/** A thumbnail of a dashboard, like the slides and report ones. */
export function DashboardIllustration() {
  return (
    <div className={clsx(styles.illustration, names.illustration)} aria-hidden="true">
      <div className={styles.canvas}>
        <div className={styles.lines}>
          <span />
          <span />
        </div>
        <div className={styles.panels}>
          <div className={styles.panel}>
            <span />
            <span />
            <span />
          </div>
          <div className={clsx(styles.panel, styles.panelBleed)} />
        </div>
      </div>
    </div>
  );
}

/** The card in the chat, laid out like the slides and report cards. */
export function DashboardCard({ label }: { label: string }) {
  const { isOpen, open, close } = useArtifactRenderer();
  const toggle = isOpen ? close : open;
  return (
    <div className={styles.cardContainer}>
      <div className={clsx(styles.card, names.card)} onClick={toggle} role="presentation">
        <DashboardIllustration />
        <div className={clsx(styles.cardBody, names.cardBody)}>
          <PreviewTitle />
          <span className={clsx(styles.cardLabel, names.cardLabel)}>
            {label}
            <PreviewLoader />
          </span>
        </div>
        <Button
          size="small"
          iconLeft={<Play />}
          aria-expanded={isOpen}
          onClick={(event) => {
            event.stopPropagation();
            toggle();
          }}
        >
          View
        </Button>
      </div>
    </div>
  );
}
