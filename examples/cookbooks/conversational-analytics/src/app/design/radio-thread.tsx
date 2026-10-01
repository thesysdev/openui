"use client";

import {
  pairToolActivity,
  useThread,
  type AssistantMessage,
  type Message,
  type ToolActivity,
} from "@openuidev/react-headless";
import { BuiltinActionType, Renderer, type ActionEvent } from "@openuidev/react-lang";
import { useCallback, useMemo } from "react";
import {
  ChatAssistantMessage,
  ChatError,
  ChatPitWall,
  ChatUserMessage,
  type PitWallStep,
} from "../../components/chat";
import { f1ToolLabel } from "../../components/chat/tool-icons";
import { library } from "../../library";
import {
  groupIntoTurns,
  hasLangSyntax,
  messageText,
  splitContent,
  wrapContent,
  wrapContext,
} from "./messages";

/*
 * RadioThread: the live conversation, drawn with the F1 chat components. Each turn
 * is the question as a team-radio caption, then the pit wall of OpenF1 lookups and
 * thinking, then the answer rendered from OpenUI Lang with the F1 library.
 */

// Enum values read as words: "SAFETY_CAR" or "safety_car" becomes "Safety car". Driver codes like "NOR" stay.
const humanise = (v: string) =>
  /^[A-Za-z0-9]+(_[A-Za-z0-9]+)+$|^[A-Z]{4,}$/.test(v) ? v.charAt(0).toUpperCase() + v.slice(1).toLowerCase().replace(/_/g, " ") : v;

// Prose written before the answer, cut where OpenUI Lang or a code fence starts.
const thinkingText = (raw: string) => raw.split(/```|(?:^|\n)\s*root\s*=/)[0].trim();

// "Lap times · 2024 · Miami · NOR, VER": the tool's name, then the short values it was asked for.
function stepMessage(activity: ToolActivity) {
  const input = (activity.input ?? {}) as Record<string, unknown>;
  const parts = Object.values(input)
    .map((v) =>
      typeof v === "string" || typeof v === "number"
        ? humanise(String(v))
        : Array.isArray(v) && v.every((x) => typeof x === "string" || typeof x === "number")
          ? v.map((x) => humanise(String(x))).join(", ")
          : "",
    )
    .filter((v) => v && v.length <= 40)
    .slice(0, 4);
  return [f1ToolLabel(activity.toolName), ...parts].join(" · ");
}

function toStep(activity: ToolActivity): PitWallStep {
  const status = activity.status === "complete" ? "done" : activity.status === "error" ? "error" : "running";
  return {
    id: activity.id,
    tool: activity.toolName,
    message: stepMessage(activity),
    status,
    detail: activity.status === "error" ? (activity.errorText ?? activity.result).slice(0, 160) : undefined,
  };
}

function Answer({ message, streaming }: { message: AssistantMessage; streaming: boolean }) {
  const processMessage = useThread((s) => s.processMessage);
  const updateMessage = useThread((s) => s.updateMessage);
  const { content, context, header } = useMemo(() => splitContent(message.content ?? ""), [message.content]);
  const initialState = useMemo(() => {
    if (!context) return undefined;
    try {
      const parsed = JSON.parse(context);
      return Array.isArray(parsed) ? parsed[0] : parsed;
    } catch {
      return undefined;
    }
  }, [context]);

  // Form state lives in the message, so it comes back with the thread.
  const onStateUpdate = useCallback(
    (state: Record<string, unknown>) => {
      const body = header ? wrapContent(content, header) : content;
      updateMessage({
        ...message,
        content: Object.keys(state).length ? body + wrapContext(JSON.stringify([state])) : body,
      });
    },
    [content, header, message, updateMessage],
  );

  // A follow-up click asks it as the next question, the same way the / chat does.
  const onAction = useCallback(
    (event: ActionEvent) => {
      if (event.type === BuiltinActionType.ContinueConversation) {
        const text = event.humanFriendlyMessage ? wrapContent(event.humanFriendlyMessage) : "";
        const ctx: unknown[] = [`User clicked: ${event.humanFriendlyMessage}`];
        if (event.formState) ctx.push(event.formState);
        processMessage({ role: "user", content: text + wrapContext(JSON.stringify(ctx)) });
      } else if (event.type === BuiltinActionType.OpenUrl) {
        const url = event.params?.["url"];
        if (typeof url === "string") window.open(url, "_blank", "noopener");
      }
    },
    [processMessage],
  );

  if (!content) return null;
  return (
    <ChatAssistantMessage streaming={streaming}>
      <Renderer
        response={content}
        library={library}
        isStreaming={streaming}
        onAction={onAction}
        onStateUpdate={onStateUpdate}
        initialState={initialState}
      />
    </ChatAssistantMessage>
  );
}

// Before the first lookup comes back, the pit wall is already live on this line.
const OPENING_STEP: PitWallStep = { kind: "thinking", id: "opening", text: "Radioing the pit wall" };

function AssistantTurn({
  segments,
  messages,
  live,
  executing,
}: {
  segments: AssistantMessage[];
  messages: Message[];
  live: boolean;
  executing: Set<string>;
}) {
  const withBody = segments.filter((s) => (s.content?.length ?? 0) > 0 || (s.toolCalls?.length ?? 0) > 0);
  const active = withBody.length ? withBody : segments;
  const last = active[active.length - 1] as AssistantMessage | undefined;
  const lastContent = splitContent(last?.content ?? "").content;
  // While live, text only counts as the answer once it's writing OpenUI Lang; before that it's thinking.
  const answer = last && (!live || hasLangSyntax(lastContent)) ? last : null;

  const steps = useMemo(() => {
    if (!active.length) return [];
    const merged = { ...active[0], toolCalls: active.flatMap((s) => s.toolCalls ?? []) } as AssistantMessage;
    const byId = new Map(pairToolActivity(merged, messages, executing).map((a) => [a.toolCall.id, a]));
    const rows: PitWallStep[] = [];
    for (const seg of active) {
      if (seg.id !== answer?.id) {
        const text = thinkingText(splitContent(seg.content ?? "").content);
        if (text) rows.push({ kind: "thinking", id: `${seg.id}:thinking`, text });
      }
      for (const call of seg.toolCalls ?? []) {
        const activity = byId.get(call.id);
        if (activity) rows.push(toStep(activity));
      }
    }
    return rows;
  }, [active, answer?.id, messages, executing]);

  const answerStarted = !!answer && lastContent.length > 0;
  const working = live && !answerStarted;
  const shown = working && steps.length === 0 ? [OPENING_STEP] : steps;
  return (
    <>
      {shown.length > 0 && <ChatPitWall steps={shown} live={working} />}
      {answer && <Answer message={answer} streaming={live} />}
    </>
  );
}

// One exchange: the question and every assistant message that answers it.
function exchanges(messages: Message[]) {
  const out: { question: Message; segments: AssistantMessage[] }[] = [];
  for (const turn of groupIntoTurns(messages)) {
    if (turn.kind === "user") out.push({ question: turn.message, segments: [] });
    else if (out.length) out[out.length - 1].segments.push(...turn.segments);
  }
  return out;
}

export function RadioThread() {
  const messages = useThread((s) => s.messages);
  const isRunning = useThread((s) => s.isRunning);
  const threadError = useThread((s) => s.threadError);
  const executing = useThread((s) => s.executingToolCallIds);
  const processMessage = useThread((s) => s.processMessage);
  const setMessages = useThread((s) => s.setMessages);

  const rows = useMemo(() => exchanges(messages), [messages]);

  // Restart: drop the last question (and anything after it) and radio it in again.
  const retry = () => {
    const at = messages.findLastIndex((m) => m.role === "user");
    if (at === -1) return;
    const question = messages[at];
    setMessages(messages.slice(0, at));
    processMessage({ role: "user", content: question.content as string });
  };

  return (
    // The red rule between exchanges sits closer to the question it introduces: 112px above, 48px below.
    <div style={{ display: "grid" }}>
      {rows.map((row, i) => [
        i > 0 && <hr key={`${row.question.id}:rule`} aria-hidden style={{ width: "100%", height: 2, margin: "112px 0 48px", border: 0, background: "#E10600" }} />,
        // Keyed by the question, so its pit wall stays the same element from send to answer.
        <div key={row.question.id} style={{ display: "grid", gap: 28 }}>
          <ChatUserMessage text={messageText(row.question.content)} />
          <AssistantTurn
            segments={row.segments}
            messages={messages}
            live={isRunning && i === rows.length - 1}
            executing={executing}
          />
        </div>,
      ])}
      {threadError && !isRunning && (
        <div style={{ marginTop: 48 }}>
          <ChatError message={threadError.message} onRetry={retry} />
        </div>
      )}
    </div>
  );
}
