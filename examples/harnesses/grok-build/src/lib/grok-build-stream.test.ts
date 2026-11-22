import { EventType, type AGUIEvent } from "@ag-ui/core";
import { describe, expect, it } from "vitest";
import {
  decodeGrokSessionNotification,
  formatGrokBuildError,
  type GrokBuildSessionUpdate,
} from "./grok-build-acp";
import { GrokBuildAGUIBridge } from "./grok-build-stream";
import {
  chunkOpenUIOutput,
  createOpenUIStatus,
  describeOpenUIProblems,
  isRenderableOpenUI,
  OpenUIOutputAccumulator,
} from "./openui-output";

function agentMessage(text: string): GrokBuildSessionUpdate {
  return {
    sessionUpdate: "agent_message_chunk",
    content: { type: "text", text },
  };
}

function retry(): GrokBuildSessionUpdate {
  return {
    sessionUpdate: "retry_state",
    type: "retrying",
    attempt: 1,
    max_retries: 15,
  };
}

function emittedText(events: AGUIEvent[]): string {
  return events
    .filter(
      (event): event is AGUIEvent & { delta: string } =>
        event.type === EventType.TEXT_MESSAGE_CONTENT && "delta" in event,
    )
    .map((event) => event.delta)
    .join("");
}

describe("OpenUI output safety", () => {
  it("keeps only the final renderable candidate when Grok emits several roots", () => {
    const bridge = new GrokBuildAGUIBridge();
    const failedCandidate = 'root = Col([old])\nold = Text("This attempt was retried")';
    const finalCandidate = 'root = Col([answer])\nanswer = Text("Final retry-safe answer")';

    bridge.consume(agentMessage("I'll inspect the repository first."));
    bridge.consume(agentMessage(failedCandidate));
    bridge.consume(agentMessage('root = Col([stale])\nstale = Text("stale")'));
    bridge.consume(agentMessage(finalCandidate));

    const text = emittedText(bridge.finish());
    expect(text).toBe(finalCandidate);
    expect(isRenderableOpenUI(text)).toBe(true);
  });

  it("decodes Grok's live retry envelope and clears the failed attempt", () => {
    const bridge = new GrokBuildAGUIBridge();
    bridge.consume(agentMessage("failed attempt prose"));
    const notification = decodeGrokSessionNotification("x.ai/session_notification", {
      sessionId: crypto.randomUUID(),
      update: retry(),
    });

    expect(notification).toBeDefined();
    bridge.consume(notification!.update);
    const final = 'root = Col([answer])\nanswer = Text("final retry-safe answer")';
    bridge.consume(agentMessage(final));

    const text = emittedText(bridge.finish());
    expect(text).toBe(final);
    expect(text).not.toContain("failed attempt prose");
    expect(isRenderableOpenUI(text)).toBe(true);
  });

  it("handles a stale candidate delivered after its retry notification", () => {
    const bridge = new GrokBuildAGUIBridge();
    const stale = 'root = Col([stale])\nstale = Text("overtaken attempt")';
    const final = 'root = Col([answer])\nanswer = Text("final answer")';

    bridge.consume(retry());
    bridge.consume(agentMessage(stale));
    bridge.consume(agentMessage("ro"));
    bridge.consume(agentMessage(final.slice(2)));

    const text = emittedText(bridge.finish());
    expect(text).toBe(final);
    expect(isRenderableOpenUI(text)).toBe(true);
  });

  it("recovers the last valid retry candidate when the final candidate has an unresolved ref", () => {
    const bridge = new GrokBuildAGUIBridge();
    const valid = ["root = Col([summary])", 'summary = Text("validated retry answer")'].join("\n");
    const invalid = [
      "root = Col([header, layout])",
      'header = Title("Project map")',
      'sLayout = Text("layout was defined under the wrong identifier")',
    ].join("\n");

    bridge.consume(retry());
    bridge.consume(agentMessage(valid));
    bridge.consume(agentMessage(invalid));

    const text = emittedText(bridge.finish());
    expect(text).toBe(valid);
    expect(text).not.toContain("sLayout");
  });

  it("recognizes a root statement split across ACP chunks", () => {
    const output = new OpenUIOutputAccumulator();
    output.push("progress prose\nro");
    output.push('ot = Col([answer])\nanswer = Text("chunked")');

    expect(output.finish()).toBe('root = Col([answer])\nanswer = Text("chunked")');
  });

  it("recovers a newer root split across chunks directly after another answer", () => {
    const output = new OpenUIOutputAccumulator();
    output.push('root = Col([old])\nold = Text("retried answer")');
    output.push("ro");
    output.push('ot = Col([answer])\nanswer = Text("newest answer")');

    expect(output.finish()).toBe('root = Col([answer])\nanswer = Text("newest answer")');
  });

  it("extracts a valid root after a malformed same-line prefix", () => {
    const output = new OpenUIOutputAccumulator();
    output.push('?\")ro');
    output.push('ot = Col([answer])\nanswer = Text("recovered")');

    expect(output.finish()).toBe('root = Col([answer])\nanswer = Text("recovered")');
  });

  it("ignores a root-looking example inside a component string", () => {
    const output = new OpenUIOutputAccumulator();
    const source =
      'root = Col([answer])\nanswer = Text("literal root = Col([fake])\\nfake = Text(\\"fake\\")")';
    expect(isRenderableOpenUI(source)).toBe(true);
    output.push(source);

    expect(output.finish()).toBe(source);
  });

  it("tracks single-quoted strings while finding candidate boundaries", () => {
    const output = new OpenUIOutputAccumulator();
    const source = "root = Col([answer])\nanswer = Text('literal ) root = Col([])')";
    expect(isRenderableOpenUI(source)).toBe(true);
    output.push(source);

    expect(output.finish()).toBe(source);
  });

  it("ignores root-like text and delimiters inside line comments", () => {
    const output = new OpenUIOutputAccumulator();
    const source = [
      "root = Col([answer])",
      "// ) root = Col([])",
      "# ] root = Col([])",
      'answer = Text("comments are ignored")',
    ].join("\n");
    expect(isRenderableOpenUI(source)).toBe(true);
    output.push(source);

    expect(output.finish()).toBe(source);
  });

  it("stops a fenced OpenUI candidate before trailing prose", () => {
    const output = new OpenUIOutputAccumulator();
    output.push(
      'Here is the UI:\n```openui\nroot = Col([answer])\nanswer = Text("fenced")\n```\nHope that helps.',
    );

    expect(output.finish()).toBe('root = Col([answer])\nanswer = Text("fenced")');
  });

  it("prefers fenced OpenUI over a root-looking example in trailing prose", () => {
    const output = new OpenUIOutputAccumulator();
    output.push(
      [
        "Here:",
        "```openui",
        "root = Col([answer])",
        'answer = Text("correct")',
        "```",
        "Syntax reminder: call Card() root = Col([])",
      ].join("\n"),
    );

    expect(output.finish()).toBe('root = Col([answer])\nanswer = Text("correct")');
  });

  it("recognizes a fence after possessive prose", () => {
    const output = new OpenUIOutputAccumulator();
    output.push(
      [
        "Here is the users' requested UI:",
        "```openui",
        "root = Col([])",
        "```",
        "Reminder: root = Col([missing])",
      ].join("\n"),
    );

    expect(output.finish()).toBe("root = Col([])");
  });

  it("lets a later unfenced retry supersede an earlier fenced answer", () => {
    const output = new OpenUIOutputAccumulator();
    output.push(
      [
        "```openui",
        "root = Col([old])",
        'old = Text("stale")',
        "```",
        "root = Col([answer])",
        'answer = Text("final")',
      ].join("\n"),
    );

    expect(output.finish()).toBe('root = Col([answer])\nanswer = Text("final")');
  });

  it("lets a later fenced retry supersede an earlier unfenced answer", () => {
    const output = new OpenUIOutputAccumulator();
    output.push(
      [
        "root = Col([old])",
        'old = Text("stale")',
        "```openui",
        "root = Col([answer])",
        'answer = Text("final")',
        "```",
      ].join("\n"),
    );

    expect(output.finish()).toBe('root = Col([answer])\nanswer = Text("final")');
  });

  it("recovers a split same-line final root after mixed retry formats", () => {
    const output = new OpenUIOutputAccumulator();
    output.push(
      [
        "```openui",
        "root = Col([old])",
        'old = Text("fenced stale")',
        "```",
        "root = Col([stale])",
        'stale = Text("unfenced stale")',
      ].join("\n"),
    );
    output.push("ro");
    output.push('ot = Col([answer])\nanswer = Text("actual final answer")');

    expect(output.finish()).toBe('root = Col([answer])\nanswer = Text("actual final answer")');
  });

  it("does not treat a fence marker inside a component string as Markdown", () => {
    const output = new OpenUIOutputAccumulator();
    const source = [
      "root = Col([answer])",
      'answer = Text("',
      "```openui",
      "root = Col([fake])",
      "```",
      '")',
    ].join("\n");
    expect(isRenderableOpenUI(source)).toBe(true);
    output.push(source);

    expect(output.finish()).toBe(source);
  });

  it("falls back to the newest renderable candidate when a later root is invalid", () => {
    const output = new OpenUIOutputAccumulator();
    const valid = 'root = Col([answer])\nanswer = Text("keep me")';
    output.push(valid);
    output.push("root = NotAComponent()");

    expect(output.finish()).toBe(valid);
  });

  it("rejects a newer candidate with an unresolved component reference", () => {
    const output = new OpenUIOutputAccumulator();
    const valid = 'root = Col([answer])\nanswer = Text("keep me")';
    output.push(valid);
    output.push("root = Col([missing])");

    expect(output.finish()).toBe(valid);
  });

  it("rejects a newer candidate containing an unknown component", () => {
    const output = new OpenUIOutputAccumulator();
    const valid = 'root = Col([answer])\nanswer = Text("keep me")';
    output.push(valid);
    output.push('root = Col([bad])\nbad = MadeUp("nope")');

    expect(output.finish()).toBe(valid);
  });

  it("does not mistake a chunk starting with root text inside a string for a new answer", () => {
    const output = new OpenUIOutputAccumulator();
    output.push('root = Col([answer])\nanswer = Text("The ');
    output.push('root = token stays inside this string")');

    expect(output.finish()).toBe(
      'root = Col([answer])\nanswer = Text("The root = token stays inside this string")',
    );
  });

  it("wraps prose-only output in a valid OpenUI fallback", () => {
    const output = new OpenUIOutputAccumulator();
    output.push("A plain-text answer that would previously trigger parse-failed.");

    const result = output.finish();
    expect(result).toContain("Unable to render Grok Build response");
    expect(result).not.toContain("A plain-text answer that would previously trigger");
    expect(isRenderableOpenUI(result)).toBe(true);
  });

  it("describes unresolved references for a bounded correction turn", () => {
    const invalid = [
      "root = Col([header, layout])",
      'header = Title("Project map")',
      'sLayout = Text("wrong identifier")',
    ].join("\n");
    const output = new OpenUIOutputAccumulator();
    output.push(invalid);

    expect(describeOpenUIProblems(invalid)).toContain("Unresolved reference: layout");
    expect(output.needsCorrection()).toBe(true);
    expect(output.correctionPrompt()).toContain("Unresolved reference: layout");
    expect(output.correctionPrompt()).toContain("Do not call tools");
  });

  it("replaces an invalid attempt with a corrected final program", () => {
    const bridge = new GrokBuildAGUIBridge();
    bridge.consume(agentMessage('root = Col([layout])\nsLayout = Text("wrong identifier")'));
    expect(bridge.needsCorrection()).toBe(true);
    expect(bridge.correctionPrompt()).toContain("Unresolved reference: layout");

    bridge.beginCorrection();
    const corrected = 'root = Col([layout])\nlayout = Text("corrected identifier")';
    bridge.consume(agentMessage(corrected));

    expect(emittedText(bridge.finish())).toBe(corrected);
  });

  it("produces renderable fallback status text", () => {
    const status = createOpenUIStatus("No message", "Nothing to send.");
    expect(status).toBe(
      'root = Col([heading, description])\nheading = Text("No message", "md", null, "semibold")\ndescription = Text("Nothing to send.")',
    );
    expect(isRenderableOpenUI(status)).toBe(true);
  });

  it("marks warning status text with a warning badge", () => {
    const status = createOpenUIStatus("No final response", "Nothing came back.", "warning");
    expect(status).toBe(
      'root = Col([badge, heading, description])\nbadge = Badge("Warning", "warning")\nheading = Text("No final response", "md", null, "semibold")\ndescription = Text("Nothing came back.")',
    );
    expect(isRenderableOpenUI(status)).toBe(true);
  });

  it("chunks without changing the validated program", () => {
    const source = `root = Col([answer])\nanswer = Text(${JSON.stringify("smooth ".repeat(300))})`;
    const chunks = chunkOpenUIOutput(source);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.length).toBeLessThanOrEqual(72);
    expect(chunks.join("")).toBe(source);
  });

  it("preserves validated buffered output when the upstream turn fails", () => {
    const bridge = new GrokBuildAGUIBridge();
    const valid = 'root = Col([answer])\nanswer = Text("keep the useful answer")';
    bridge.consume(agentMessage(valid));

    expect(emittedText(bridge.fail("Upstream failed."))).toBe(valid);
    expect(bridge.finish()).toEqual([]);
  });

  it("rotates the Thinking card when Grok retries", () => {
    const bridge = new GrokBuildAGUIBridge();
    const thought = (text: string): GrokBuildSessionUpdate => ({
      sessionUpdate: "agent_thought_chunk",
      content: { type: "text", text },
    });
    const first = bridge.consume(thought("First model attempt"));
    const firstId = first.find((event) => event.type === EventType.TOOL_CALL_START);
    const boundary = bridge.consume(retry());
    const second = bridge.consume(thought("Second model attempt"));
    const secondId = second.find((event) => event.type === EventType.TOOL_CALL_START);

    expect(boundary.some((event) => event.type === EventType.TOOL_CALL_END)).toBe(true);
    expect(firstId && "toolCallId" in firstId ? firstId.toolCallId : undefined).not.toBe(
      secondId && "toolCallId" in secondId ? secondId.toolCallId : undefined,
    );
  });

  it("uses Grok's terminal retry message instead of an object string", () => {
    const bridge = new GrokBuildAGUIBridge();
    bridge.consume({
      sessionUpdate: "agent_thought_chunk",
      content: { type: "text", text: "Trying the request" },
    });
    const terminal = bridge.consume({
      sessionUpdate: "retry_state",
      type: "failed",
      error_type: "api",
      message: "Service temporarily unavailable.",
    });

    const events = bridge.fail("[object Object]");
    const result = terminal.find((event) => event.type === EventType.TOOL_CALL_RESULT) as
      (AGUIEvent & { content?: string }) | undefined;
    expect(result?.content).toBe("Service temporarily unavailable.");
    expect(emittedText(events)).toBe("");
  });

  it("does not invent a fallback assistant card when a turn fails before output", () => {
    const bridge = new GrokBuildAGUIBridge();

    expect(bridge.fail("Grok Build failed to start.")).toEqual([]);
  });

  it("uses the turn_completed agent result for terminal errors", () => {
    const bridge = new GrokBuildAGUIBridge();
    bridge.consume({
      sessionUpdate: "agent_thought_chunk",
      content: { type: "text", text: "Waiting for the model" },
    });
    const terminal = bridge.consume({
      sessionUpdate: "turn_completed",
      stop_reason: "error",
      agent_result: "Provider unavailable.",
    });
    const result = terminal.find((event) => event.type === EventType.TOOL_CALL_RESULT) as
      (AGUIEvent & { content?: string; isError?: boolean }) | undefined;

    expect(result?.content).toBe("Provider unavailable.");
    expect(result?.isError).toBe(true);
  });

  it("serializes structured ACP failures without [object Object]", () => {
    const message = formatGrokBuildError({
      message: { error: "Service temporarily unavailable" },
      data: { status: 500 },
    });
    expect(message).not.toContain("[object Object]");
    expect(message).toContain("Service temporarily unavailable");
    expect(message).toContain("500");
  });

  it("merges partial tool updates before closing the AG-UI tool call", () => {
    const bridge = new GrokBuildAGUIBridge();
    const events = [
      ...bridge.consume({
        sessionUpdate: "tool_call",
        toolCallId: "partial",
        title: "Run command",
        kind: "execute",
        status: "pending",
      }),
      ...bridge.consume({
        sessionUpdate: "tool_call_update",
        toolCallId: "partial",
        status: "in_progress",
      }),
      ...bridge.consume({
        sessionUpdate: "tool_call_update",
        toolCallId: "partial",
        rawInput: { command: "pwd" },
      }),
      ...bridge.consume({
        sessionUpdate: "tool_call_update",
        toolCallId: "partial",
        rawOutput: { ok: true },
      }),
      ...bridge.consume({
        sessionUpdate: "tool_call_update",
        toolCallId: "partial",
        status: "completed",
      }),
    ];

    const argsIndex = events.findIndex((event) => event.type === EventType.TOOL_CALL_ARGS);
    const endIndex = events.findIndex((event) => event.type === EventType.TOOL_CALL_END);
    const result = events.find((event) => event.type === EventType.TOOL_CALL_RESULT) as
      (AGUIEvent & { content?: string }) | undefined;

    expect(argsIndex).toBeGreaterThan(-1);
    expect(endIndex).toBeGreaterThan(argsIndex);
    expect(events.filter((event) => event.type === EventType.TOOL_CALL_END)).toHaveLength(1);
    expect(result?.content).toBe('{"ok":true}');
  });

  it("marks an unfinished tool as failed instead of inventing success", () => {
    const bridge = new GrokBuildAGUIBridge();
    bridge.consume({
      sessionUpdate: "tool_call",
      toolCallId: "unfinished",
      title: "Pending tool",
      kind: "execute",
      status: "pending",
      rawInput: { command: "pwd" },
    });

    const result = bridge
      .finish()
      .find(
        (event) =>
          event.type === EventType.TOOL_CALL_RESULT &&
          "toolCallId" in event &&
          event.toolCallId === "unfinished",
      ) as (AGUIEvent & { isError?: boolean }) | undefined;
    expect(result?.isError).toBe(true);
  });
});
