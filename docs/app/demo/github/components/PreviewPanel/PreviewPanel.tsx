import type { ActionEvent, ParseResult } from "@openuidev/react-lang";
import { Renderer } from "@openuidev/react-lang";
import { IconButton, openuiLibrary, ThemeProvider } from "@openuidev/react-ui";
import { Loader2, Maximize2, Monitor } from "lucide-react";
import { useCallback, useState } from "react";
import { Modal } from "../Modal/Modal";
import "./PreviewPanel.css";

type PreviewPanelProps = {
  code: string;
  isStreaming: boolean;
  onParseResult?: (result: ParseResult | null) => void;
  mode: "light" | "dark";
  toolProvider?: Record<string, (args: Record<string, unknown>) => Promise<unknown>> | null;
  onAction?: (event: ActionEvent) => void;
};

export function PreviewPanel({
  code,
  isStreaming,
  onParseResult,
  mode,
  toolProvider,
  onAction,
}: PreviewPanelProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const closeModal = useCallback(() => setIsModalOpen(false), []);

  const previewContent = code ? (
    <div className="preview-content">
      <ThemeProvider mode={mode}>
        <Renderer
          response={code}
          library={openuiLibrary}
          isStreaming={isStreaming}
          onParseResult={onParseResult}
          toolProvider={toolProvider}
          onAction={onAction}
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
            <IconButton
              className="panel-icon-btn"
              icon={<Maximize2 size={14} />}
              variant="tertiary"
              size="extra-small"
              onClick={() => setIsModalOpen(true)}
              title="Open fullscreen preview"
              aria-label="Open fullscreen preview"
            />
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
