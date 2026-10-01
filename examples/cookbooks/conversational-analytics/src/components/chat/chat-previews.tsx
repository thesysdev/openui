"use client";

import { Renderer } from "@openuidev/react-lang";
import { useEffect, useState, type ReactNode } from "react";
import { library } from "../../library";
import { ChatAssistantMessage } from "./chat-assistant-message";
import { ChatError } from "./chat-error";
import { ChatFollowUps } from "./chat-follow-ups";
import { ChatFollowUpCards, type FollowUpCard } from "./chat-follow-up-cards";
import { ChatJumpToLatest } from "./chat-jump-to-latest";
import { ChatPitWall, type PitWallStep, type PitWallToolStep } from "./chat-pit-wall";
import { ChatStartLights } from "./chat-start-lights";
import { ChatStarters } from "./chat-starters";
import { ChatUserMessage } from "./chat-user-message";
import { ChatWelcome } from "./chat-welcome";
import { f1ToolList, ToolIcon } from "./tool-icons";

// Gallery previews for the F1 chat pieces, with sample content. Not wired into the live chat.

const starters = [
  { displayText: "Which five drivers set the fastest laps in Miami?", prompt: "fastest" },
  { displayText: "Compare Norris and Verstappen lap by lap", prompt: "compare" },
  { displayText: "Who was faster over the final ten laps?", prompt: "final" },
];

const question = "Which five drivers set the fastest laps in Miami?";

// `at` only paces the replay demo; the component shows no times.
type TimedStep = PitWallStep & { at: number };

const steps: TimedStep[] = [
  { id: "t1", at: 0.3, kind: "thinking", text: "They want the five fastest laps in Miami 2024, so I need the race session first." },
  { id: "a", at: 1.3, tool: "get_schedule", status: "done", message: "Session found · 2024 Miami Grand Prix · Race", detail: "Session 9507" },
  { id: "b", at: 2.3, tool: "get_drivers", status: "done", message: "Drivers on the grid · 20 cars" },
  { id: "t2", at: 3.3, kind: "thinking", text: "Pulling every lap and keeping each driver's best, then ranking them." },
  { id: "c", at: 4.3, tool: "get_lap_times", status: "done", message: "Lap times · all drivers · 57 laps", detail: "1,084 laps, 5 fastest kept" },
];
const failedSteps: PitWallStep[] = [
  ...steps.slice(0, 3),
  { id: "c", tool: "get_telemetry", status: "error", message: "Telemetry · NOR, VER · lap 57", detail: "OpenF1 timed out after 4 s" },
];
const everyTool: PitWallToolStep[] = f1ToolList.map((t) => ({ id: t.name, tool: t.name, status: "done", message: t.label, detail: t.about }));

const answerTable = `root = Table([Col("Pos", [1, 2, 3, 4, 5]), Col("Driver", ["Oscar Piastri", "Lando Norris", "Max Verstappen", "Charles Leclerc", "Carlos Sainz"]), Col("Lap", [36, 37, 52, 51, 50], "number"), Col("Time", ["1:30.634", "1:30.980", "1:31.102", "1:31.238", "1:31.410"], "number")], [DriverAvatar("PIA", "s", true), DriverAvatar("NOR", "s", true), DriverAvatar("VER", "s", true), DriverAvatar("LEC", "s", true), DriverAvatar("SAI", "s", true)])`;

const answerText = (
  <p>
    <strong>Oscar Piastri</strong> set the fastest lap of the race, a 1:30.634 on lap 36, just ahead of Lando Norris.
  </p>
);

function State({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <span className="asset-round">{label}</span>
      {children}
    </div>
  );
}

function Frame({ children, note }: { children: ReactNode; note?: ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 40, maxWidth: 720 }}>
      {children}
      {note && <p className="ref-note">{note}</p>}
    </div>
  );
}

function DemoButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="f1c f1c-slant-button" style={{ justifySelf: "start" }} onClick={onClick}>
      {children}
    </button>
  );
}

// Plays the run: rows arrive one by one with a ticking clock, then the run settles.
function useRun(all: TimedStep[], run: number) {
  const [clock, setClock] = useState({ run, t: 0 });
  // A new run starts at zero on its first render, before the effect catches up.
  const t = clock.run === run ? clock.t : 0;
  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => {
      const s = (performance.now() - start) / 1000;
      setClock({ run, t: s });
      if (s > all[all.length - 1].at + 0.8) clearInterval(id);
    }, 100);
    return () => clearInterval(id);
  }, [all, run]);
  const shown = all.filter((s) => s.at <= t);
  const live = t <= all[all.length - 1].at + 0.8;
  // The newest row is still running while live.
  const rows = shown.map((s, i) => (live && i === shown.length - 1 && s.kind !== "thinking" && t - s.at < 0.8 ? { ...s, status: "running" as const } : s));
  return { rows, live };
}

function LivePitWall() {
  const [run, setRun] = useState(0);
  const { rows, live } = useRun(steps, run);
  return (
    <State label="LIVE · REPLAYS ON PRESS">
      {/* Holds the tray's folded height so the page doesn't jump before the first row. */}
      <div style={{ minHeight: 32 }}>
        <ChatPitWall key={run} steps={rows} live={live} />
      </div>
      <DemoButton onClick={() => setRun((r) => r + 1)}>Replay run</DemoButton>
    </State>
  );
}

export function ChatConversationPreview() {
  return (
    <Frame note="All the pieces together, in the order the home page shows them. The input stays the RadioInput.">
      <ChatUserMessage text={question} />
      <div style={{ display: "grid", gap: 20 }}>
        <ChatPitWall steps={steps} />
        <ChatAssistantMessage text={answerText}>
          <Renderer response={answerTable} library={library} />
        </ChatAssistantMessage>
        <ChatFollowUps items={["Compare Piastri and Norris lap by lap", "Show their tyre strategies"]} />
      </div>
      <ChatUserMessage text="Now compare Norris and Verstappen" />
      <ChatStartLights />
    </Frame>
  );
}

export function ChatWelcomePreview() {
  return (
    <Frame note={<><code>{"<ChatWelcome title={…} description={…} />"}</code>. Replaces AgentInterface.Welcome. Wrap a word in <code>{"<em>"}</code> to paint it red.</>}>
      <ChatWelcome />
      <State label="WITH STARTERS, AS THE EMPTY STATE">
        <div style={{ display: "grid", gap: 32 }}>
          <ChatWelcome />
          <ChatStarters starters={starters} />
        </div>
      </State>
    </Frame>
  );
}

export function ChatStartersPreview() {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <Frame note={<><code>{"<ChatStarters starters={…} onPick={fn} />"}</code>. Replaces the conversation starters. Hover a row.{picked && <> Picked: <code>{picked}</code>.</>}</>}>
      <ChatStarters starters={starters} onPick={setPicked} />
    </Frame>
  );
}

export function ChatUserMessagePreview() {
  return (
    <Frame note={<><code>{'<ChatUserMessage text="…" />'}</code>. The old RadioInput caption, kept for what you sent.</>}>
      <State label="SHORT">
        <ChatUserMessage text="Who won Miami?" />
      </State>
      <State label="LONG">
        <ChatUserMessage text="Compare Lando Norris and Max Verstappen on each of the final ten laps of the Miami Grand Prix" />
      </State>
    </Frame>
  );
}

export function ChatAssistantMessagePreview() {
  return (
    <Frame note={<><code>{"<ChatAssistantMessage text={…}>{genUI}</ChatAssistantMessage>"}</code>. The cursor only shows while <code>streaming</code>, and never blinks.</>}>
      <State label="ANSWER WITH GENERATED UI">
        <ChatAssistantMessage text={answerText}>
          <Renderer response={answerTable} library={library} />
        </ChatAssistantMessage>
      </State>
      <State label="STREAMING">
        <ChatAssistantMessage streaming text={<p>Oscar Piastri set the fastest lap of the race, a 1:30.634 on</p>} />
      </State>
    </Frame>
  );
}

export function ChatPitWallPreview() {
  return (
    <Frame note={<><code>{"<ChatPitWall steps={…} live />"}</code>. Replaces the Working / Behind the scenes tray. Flags: yellow running, green done, red failed, chequered when the run is done. Thinking lines (<code>{`kind: "thinking"`}</code>) sit between the checks.</>}>
      <LivePitWall />
      <State label="DONE · FOLDED">
        <ChatPitWall steps={steps} />
      </State>
      <State label="DONE · OPEN">
        <ChatPitWall steps={steps} defaultOpen />
      </State>
      <State label="A CHECK FAILED">
        <ChatPitWall steps={failedSteps} />
      </State>
      <State label="EVERY TOOL">
        <ChatPitWall steps={everyTool} defaultOpen />
      </State>
    </Frame>
  );
}

export function ChatStartLightsPreview() {
  const [run, setRun] = useState(0);
  const [out, setOut] = useState(false);
  return (
    <Frame note={<><code>{"<ChatStartLights label=\"…\" out={answerStarted} />"}</code>. Replaces the dot-matrix loader. The lights come on once and hold; they don't loop.</>}>
      <State label="WAITING">
        <ChatStartLights key={run} out={out} label={out ? "Lights out" : "Waiting for the pit wall"} />
      </State>
      <div style={{ display: "flex", gap: 8 }}>
        <DemoButton
          onClick={() => {
            setOut(false);
            setRun((r) => r + 1);
          }}
        >
          Replay
        </DemoButton>
        <DemoButton onClick={() => setOut(true)}>Lights out</DemoButton>
      </div>
      <State label="LOADING A SAVED CONVERSATION">
        <ChatStartLights key={`c${run}`} step={120} label="Loading the conversation" />
      </State>
    </Frame>
  );
}

export function ChatFollowUpsPreview() {
  return (
    <Frame note={<><code>{"<ChatFollowUps items={…} onPick={fn} />"}</code>. Replaces FollowUpBlock under an answer.</>}>
      <ChatFollowUps items={["Compare Piastri and Norris lap by lap", "Show their tyre strategies", "Who gained the most places?"]} />
    </Frame>
  );
}

export function ChatErrorPreview() {
  return (
    <Frame note={<><code>{"<ChatError title=\"…\" message=\"…\" onRetry={fn} />"}</code>. Replaces the danger Callout.</>}>
      <ChatError onRetry={() => {}} />
    </Frame>
  );
}

export function ChatJumpToLatestPreview() {
  return (
    <Frame note={<><code>{"<ChatJumpToLatest onClick={fn} />"}</code>. Replaces the scroll-to-latest button; it floats bottom centre above the input.</>}>
      <ChatJumpToLatest />
    </Frame>
  );
}

export function ChatToolIconsPreview() {
  const [live, setLive] = useState(true);
  return (
    <Frame note={<><code>{'<ToolIcon tool="get_lap_times" size={20} live />'}</code>. One per OpenF1 tool in <code>src/lib/f1/tools</code>. Carbon with one red detail, leaning with the italic type. <code>live</code> plays the icon's own loop; Pit Wall turns it on for the step in its header while a run is going. Still under reduced motion.</>}>
      <DemoButton onClick={() => setLive((l) => !l)}>{live ? "Stop" : "Play"} animations</DemoButton>
      <div className="f1c" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "28px 24px" }}>
        {f1ToolList.map((t) => (
          <div key={t.name} style={{ display: "grid", gap: 10, justifyItems: "start" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
              <ToolIcon tool={t.name} size={48} live={live} />
              <ToolIcon tool={t.name} size={20} live={live} />
              <ToolIcon tool={t.name} size={14} live={live} />
            </div>
            <span className="f1c-label" style={{ color: "#15151E" }}>{t.label}</span>
            <code style={{ fontSize: 12, color: "#606066" }}>{t.name}</code>
          </div>
        ))}
      </div>
    </Frame>
  );
}

const cards: FollowUpCard[] = [
  { kind: "compare", drivers: ["NOR", "VER"], text: "Compare Norris and Verstappen lap by lap" },
  { kind: "driver", driver: "LEC", text: "How did Leclerc's pace hold up?" },
  { kind: "team", team: "Ferrari", text: "Show Ferrari's tyre strategy" },
  { kind: "circuit", circuit: "Miami", text: "Who was fastest through sector two?" },
  { kind: "lap", lap: 57, label: "Final lap", text: "What did the order look like on the last lap?" },
  { kind: "team", team: "Mercedes", text: "Where did Mercedes lose time?" },
];

export function ChatFollowUpCardsPreview() {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <Frame
      note={
        <>
          <code>{'<ChatFollowUpCards items={[{ kind: "driver", driver: "LEC", text: "…" }]} />'}</code>. Kinds: <code>driver</code>,{" "}
          <code>compare</code> (two drivers), <code>team</code>, <code>circuit</code>, <code>lap</code>. Each tile paints itself from
          that: team colours, portraits, the car, the track or the lap number. The list version (ChatFollowUps) is unchanged.
          {picked && <> Picked: <code>{picked}</code>.</>}
        </>
      }
    >
      <State label="SIX KINDS">
        <ChatFollowUpCards items={cards} onPick={setPicked} />
      </State>
      <State label="UNDER AN ANSWER · THREE">
        <ChatFollowUpCards items={cards.slice(0, 3)} onPick={setPicked} />
      </State>
    </Frame>
  );
}
