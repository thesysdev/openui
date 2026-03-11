import type { ThemeMode } from "@components/types";
import styles from "./PreviewLayout.module.css";

interface PreviewThemeToggleProps {
  value: ThemeMode;
  onChange: (theme: ThemeMode) => void;
}

export default function PreviewThemeToggle({ value, onChange }: PreviewThemeToggleProps) {
  return (
    <div className={styles.previewToggle} role="group" aria-label="Preview theme">
      <button
        type="button"
        className={`${styles.previewToggleButton}${value === "dark" ? ` ${styles.previewToggleButtonActive}` : ""}`}
        onClick={() => onChange("dark")}
      >
        Dark
      </button>
      <button
        type="button"
        className={`${styles.previewToggleButton}${value === "light" ? ` ${styles.previewToggleButtonActive}` : ""}`}
        onClick={() => onChange("light")}
      >
        Light
      </button>
    </div>
  );
}
