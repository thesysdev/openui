import type { ParseResult } from "@openuidev/react-lang";
import { Renderer } from "@openuidev/react-lang";
import { openuiLibrary, ThemeProvider } from "@openuidev/react-ui";
import { Loader2, Maximize2, Monitor } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Theme } from "../../constants";
import { Modal } from "../Modal/Modal";
import "./PreviewPanel.css";

type PreviewPanelProps = {
  code: string;
  isStreaming: boolean;
  onParseResult?: (result: ParseResult | null) => void;
  theme: Theme;
};

export function PreviewPanel({ code, isStreaming, onParseResult, theme }: PreviewPanelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    queueMicrotask(() => setSystemDark(mq.matches));
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const resolvedMode = useMemo(() => {
    if (theme === "system") return systemDark ? "dark" : "light";
    return theme;
  }, [theme, systemDark]);

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const previewContent = code ? (
    <div className="preview-content">
      <ThemeProvider mode={resolvedMode}>
        <Renderer
          response={code}
          library={openuiLibrary}
          isStreaming={isStreaming}
          onParseResult={onParseResult}
        />
      </ThemeProvider>
    </div>
  ) : (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Monitor size={28} />
      </div>
      <p className="empty-state-text">Rendered UI will appear here</p>
    </div>
  );

  return (
    <>
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-group">
            <span className="panel-title">Preview</span>
            {isStreaming && <Loader2 size={14} className="preview-spinner" />}
          </div>
          <div className="panel-actions">
            <button
              className="panel-icon-btn"
              onClick={() => setIsModalOpen(true)}
              title="Open fullscreen preview"
              aria-label="Open fullscreen preview"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>
        <div className="preview-body">{previewContent}</div>
      </div>

      {isModalOpen && (
        <Modal
          title="Preview"
          titleAdornment={isStreaming ? <Loader2 size={14} className="preview-spinner" /> : null}
          onClose={closeModal}
        >
          {previewContent}
        </Modal>
      )}
    </>
  );
}
