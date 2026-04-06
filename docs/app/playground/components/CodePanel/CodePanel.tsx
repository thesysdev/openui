import { encode } from "gpt-tokenizer";
import { Check, Copy, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { Status } from "../../constants";
import "./CodePanel.css";

type Tab = "raw" | "json";

type CodePanelProps = {
  code: string;
  status: Status;
  parsedJson: string | null;
};

function countTokens(text: string): number {
  if (!text) return 0;
  return encode(text).length;
}

export function CodePanel({ code, status, parsedJson }: CodePanelProps) {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<Tab>("raw");

  const activeContent = tab === "raw" ? code : parsedJson;

  const rawTokens = useMemo(() => countTokens(code), [code]);
  const jsonTokens = useMemo(() => countTokens(parsedJson ?? ""), [parsedJson]);

  const tokenSavingPct =
    status === "done" && rawTokens > 0 && jsonTokens > 0 && rawTokens < jsonTokens
      ? Math.round(((jsonTokens - rawTokens) / jsonTokens) * 100)
      : null;

  const handleCopy = async () => {
    if (!activeContent) return;
    await navigator.clipboard.writeText(activeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="panel code-panel">
      <div className="panel-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className={`status-dot ${status === "streaming" ? "streaming" : status === "error" ? "error" : ""}`}
          />
          <div className="code-tabs">
            <button
              className={`code-tab ${tab === "raw" ? "active" : ""}`}
              onClick={() => setTab("raw")}
            >
              Raw Output
              {rawTokens > 0 && (
                <span
                  className="token-count"
                  data-tooltip={`${rawTokens.toLocaleString()} output tokens`}
                >
                  {rawTokens.toLocaleString()}
                </span>
              )}
            </button>
            <button
              className={`code-tab ${tab === "json" ? "active" : ""}`}
              onClick={() => setTab("json")}
            >
              Parsed JSON
              {jsonTokens > 0 && (
                <span
                  className="token-count"
                  data-tooltip={`${jsonTokens.toLocaleString()} output tokens`}
                >
                  {jsonTokens.toLocaleString()}
                </span>
              )}
            </button>
          </div>
          {tokenSavingPct !== null && (
            <span
              className="token-saving-badge"
              data-tooltip={`Raw output uses ${rawTokens.toLocaleString()} tokens vs ${jsonTokens.toLocaleString()} for parsed JSON`}
            >
              <Zap size={10} />
              {tokenSavingPct}% fewer tokens
            </span>
          )}
        </div>
        {activeContent && (
          <div className="panel-actions">
            <button className="panel-icon-btn" onClick={handleCopy} title="Copy">
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>

      <div className="code-body">
        {activeContent ? (
          <pre
            className={`code-pre ${tab === "raw" && status === "streaming" ? "streaming-cursor" : ""}`}
          >
            {activeContent}
          </pre>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Copy size={28} />
            </div>
            <p className="empty-state-text">
              {tab === "raw" ? "Generated code will appear here" : "Parsed JSON will appear here"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
