"use client";

import { renderEmailToHtml } from "@/app/actions/render-email";
import { useTheme } from "@/hooks/use-system-theme";
import { defineComponent } from "@openuidev/react-lang";
import { Check, Code, Copy, Eye, Mail } from "lucide-react";
import { useCallback, useState } from "react";
import { z } from "zod";
import { EmailLeafChildUnion } from "../unions";
import { EmailColumn } from "./EmailColumn";
import { EmailColumns } from "./EmailColumns";
import { EmailFooterCentered } from "./EmailFooterCentered";
import { EmailFooterTwoColumn } from "./EmailFooterTwoColumn";
import { EmailHeaderCenteredNav } from "./EmailHeaderCenteredNav";
import { EmailHeaderSideNav } from "./EmailHeaderSideNav";
import { EmailHeaderSocial } from "./EmailHeaderSocial";
import { EmailSection } from "./EmailSection";

const EmailTemplateChildUnion = z.union([
  ...EmailLeafChildUnion.options,
  EmailSection.ref,
  EmailColumns.ref,
  EmailColumn.ref,
  EmailHeaderSideNav.ref,
  EmailHeaderCenteredNav.ref,
  EmailHeaderSocial.ref,
  EmailFooterCentered.ref,
  EmailFooterTwoColumn.ref,
]);

export const EmailTemplate = defineComponent({
  name: "EmailTemplate",
  props: z.object({
    subject: z.string(),
    previewText: z.string().optional(),
    children: z.array(EmailTemplateChildUnion),
  }),
  description:
    "Root email template. Renders a live email preview with Copy HTML export. Always provide a subject line.",
  component: function EmailTemplateView({ props, renderNode }) {
    const [copiedHtml, setCopiedHtml] = useState(false);
    const [copiedSubject, setCopiedSubject] = useState(false);
    const [rendering, setRendering] = useState(false);
    const [viewMode, setViewMode] = useState<"preview" | "html">("preview");
    const [cachedHtml, setCachedHtml] = useState<string | null>(null);
    const [loadingHtml, setLoadingHtml] = useState(false);
    const theme = useTheme();
    const isDark = theme === "dark";

    const t = {
      border: isDark ? "#374151" : "#e5e7eb",
      headerBg: isDark ? "#1f2937" : "#f9fafb",
      text: isDark ? "#e5e7eb" : "#374151",
      textMuted: isDark ? "#9ca3af" : "#6b7280",
      btnBg: isDark ? "#374151" : "#fff",
      btnBorder: isDark ? "#4b5563" : "#d1d5db",
      btnText: isDark ? "#e5e7eb" : "#374151",
    };

    const children = props.children as Array<{
      typeName: string;
      props: Record<string, unknown>;
    }>;
    const subject = props.subject as string;
    const previewText = (props.previewText as string) ?? "";

    const copyHtml = useCallback(async () => {
      if (rendering) return;
      setRendering(true);
      try {
        const html =
          cachedHtml ??
          (await renderEmailToHtml(subject, previewText, children));
        if (!cachedHtml) setCachedHtml(html);
        await navigator.clipboard.writeText(html);
        setCopiedHtml(true);
        setTimeout(() => setCopiedHtml(false), 2000);
      } catch (err) {
        console.error("Failed to render email:", err);
      } finally {
        setRendering(false);
      }
    }, [subject, previewText, children, rendering, cachedHtml]);

    const copySubject = useCallback(async () => {
      await navigator.clipboard.writeText(subject);
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    }, [subject]);

    const toggleView = useCallback(async () => {
      if (viewMode === "preview") {
        if (!cachedHtml) {
          setLoadingHtml(true);
          try {
            const html = await renderEmailToHtml(
              subject,
              previewText,
              children,
            );
            setCachedHtml(html);
          } catch (err) {
            console.error("Failed to render email:", err);
          } finally {
            setLoadingHtml(false);
          }
        }
        setViewMode("html");
      } else {
        setViewMode("preview");
      }
    }, [viewMode, cachedHtml, subject, previewText, children]);

    return (
      <div
        style={{
          border: `1px solid ${t.border}`,
          borderRadius: "8px",
          overflow: "hidden",
          margin: "8px 0",
        }}
      >
        {/* Header bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            backgroundColor: t.headerBg,
            borderBottom: `1px solid ${t.border}`,
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              minWidth: 0,
            }}
          >
            <Mail size={16} style={{ color: t.textMuted, flexShrink: 0 }} />
            <span
              style={{
                fontSize: "13px",
                color: t.text,
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {subject}
            </span>
          </div>
          <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
            <div
              style={{
                display: "flex",
                border: `1px solid ${t.btnBorder}`,
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => {
                  if (viewMode !== "preview") toggleView();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor:
                    viewMode === "preview" ? "#5F51E8" : t.btnBg,
                  color: viewMode === "preview" ? "#fff" : t.btnText,
                  fontWeight: viewMode === "preview" ? 600 : 400,
                }}
              >
                <Eye size={12} />
                Preview
              </button>
              <button
                onClick={() => {
                  if (viewMode !== "html") toggleView();
                }}
                disabled={loadingHtml}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  border: "none",
                  borderLeft: `1px solid ${t.btnBorder}`,
                  cursor: loadingHtml ? "wait" : "pointer",
                  backgroundColor: viewMode === "html" ? "#5F51E8" : t.btnBg,
                  color: viewMode === "html" ? "#fff" : t.btnText,
                  fontWeight: viewMode === "html" ? 600 : 400,
                }}
              >
                <Code size={12} />
                {loadingHtml ? "Loading..." : "HTML"}
              </button>
            </div>
            <button
              onClick={copySubject}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 10px",
                fontSize: "12px",
                border: `1px solid ${t.btnBorder}`,
                borderRadius: "4px",
                backgroundColor: t.btnBg,
                cursor: "pointer",
                color: t.btnText,
              }}
            >
              {copiedSubject ? <Check size={12} /> : <Copy size={12} />}
              {copiedSubject ? "Copied!" : "Subject"}
            </button>
          </div>
        </div>

        {viewMode === "preview" ? (
          <div
            style={{
              padding: "32px 40px",
              backgroundColor: "#fff",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            {renderNode(props.children)}
          </div>
        ) : (
          <div
            style={{
              position: "relative",
              backgroundColor: "#1e1e1e",
              maxHeight: "600px",
              overflow: "auto",
            }}
          >
            <button
              onClick={copyHtml}
              disabled={rendering}
              style={{
                position: "sticky",
                top: "12px",
                float: "right",
                marginRight: "12px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                fontSize: "12px",
                border: "1px solid #555",
                borderRadius: "4px",
                backgroundColor: copiedHtml
                  ? "#16a34a"
                  : "rgba(95, 81, 232, 0.9)",
                cursor: rendering ? "wait" : "pointer",
                color: "#fff",
                fontWeight: 600,
                zIndex: 1,
              }}
            >
              {copiedHtml ? <Check size={12} /> : <Copy size={12} />}
              {rendering
                ? "Rendering..."
                : copiedHtml
                  ? "Copied!"
                  : "Copy HTML"}
            </button>
            <pre
              style={{
                margin: 0,
                padding: "20px",
                fontSize: "13px",
                lineHeight: "1.5",
                fontFamily: "'Fira Code', 'Courier New', monospace",
                color: "#d4d4d4",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              <code>{cachedHtml ?? "Loading..."}</code>
            </pre>
          </div>
        )}
      </div>
    );
  },
});
