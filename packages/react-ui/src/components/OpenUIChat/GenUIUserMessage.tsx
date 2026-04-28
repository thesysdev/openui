"use client";

import type { UserMessage } from "@openuidev/react-headless";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { separateContentAndContext } from "../../utils/contentParser";

/**
 * Extracts the first plain object from a context string.
 * The triggerAction context format is: ["action description string", { formState }]
 */
function parseContextForDisplay(contextString: string | null): Record<string, any> {
  if (!contextString) return {};
  try {
    const parsed = JSON.parse(contextString);
    if (Array.isArray(parsed)) {
      const stateObj = parsed.find(
        (item) => item !== null && typeof item === "object" && !Array.isArray(item),
      );
      return stateObj ?? {};
    }
    if (typeof parsed === "object" && parsed !== null) {
      return parsed;
    }
    return {};
  } catch {
    return {};
  }
}

function getEntries(state: Record<string, any>): { label: string; value: string }[] {
  // Detect nested (form-named) shape
  const isNested = Object.values(state).some(
    (v) =>
      v !== null &&
      typeof v === "object" &&
      !("value" in v) &&
      Object.values(v).some((f) => f !== null && typeof f === "object" && "value" in f),
  );

  const entries: { label: string; value: string }[] = [];

  if (isNested) {
    for (const [, fields] of Object.entries(state)) {
      if (typeof fields !== "object" || fields === null) continue;
      for (const [fieldName, field] of Object.entries(fields as Record<string, any>)) {
        if (field && typeof field === "object" && "value" in field) {
          const val = field.value;
          if (val !== undefined && val !== null && val !== "") {
            entries.push({ label: fieldName, value: String(val) });
          }
        }
      }
    }
  } else {
    for (const [fieldName, field] of Object.entries(state)) {
      if (field && typeof field === "object" && "value" in field) {
        const val = field.value;
        if (val !== undefined && val !== null && val !== "") {
          entries.push({ label: fieldName, value: String(val) });
        }
      }
    }
  }

  return entries;
}

function FormDataAccordion({ state }: { state: Record<string, any> }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const entries = getEntries(state);

  if (entries.length === 0) return null;

  return (
    <div className="openui-genui-user-message__form-state">
      <button
        className="openui-genui-user-message__form-state-header"
        onClick={() => setIsExpanded((v) => !v)}
        type="button"
      >
        <span className="openui-genui-user-message__form-state-label">
          Form data ({entries.length} {entries.length === 1 ? "field" : "fields"})
        </span>
        <ChevronDown
          size={14}
          className={`openui-genui-user-message__form-state-chevron${isExpanded ? " openui-genui-user-message__form-state-chevron--expanded" : ""}`}
        />
      </button>
      {isExpanded && (
        <div className="openui-genui-user-message__form-state-content">
          {entries.map(({ label, value }) => (
            <div key={label} className="openui-genui-user-message__form-field">
              <span className="openui-genui-user-message__form-field-label">{label}:</span>
              <span className="openui-genui-user-message__form-field-value">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Renders a user message, handling both plain text messages and
 * inline-formatted messages from form submissions.
 */
export const GenUIUserMessage = ({ message }: { message: UserMessage }) => {
  const rawContent = typeof message.content === "string" ? message.content : "";
  const { content: humanText, contextString } = separateContentAndContext(rawContent);
  const formState = parseContextForDisplay(contextString);
  const hasFormData = Object.keys(formState).length > 0;

  return (
    <div className="openui-shell-thread-message-user">
      <div className="openui-genui-user-message">
        {hasFormData && <FormDataAccordion state={formState} />}
        <div className="openui-shell-thread-message-user__content">
          {humanText && <div>{humanText}</div>}
        </div>
      </div>
    </div>
  );
};
