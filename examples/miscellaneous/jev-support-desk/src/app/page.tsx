"use client";

import { CUSTOMERS } from "@/lib/customers";
import type { Choice, Decision } from "@/lib/jev";
import type { Screen } from "@/lib/screens";
import { library } from "@/library";
import { Renderer } from "@openuidev/react-lang";
import { ThemeProvider } from "@openuidev/react-ui";
import { useEffect, useMemo, useRef, useState } from "react";

const SUGGESTIONS: Record<string, string[]> = {
  c1: [
    "I want to return my headphones",
    "Where is my rain jacket?",
    "Please cancel my coffee set order",
  ],
  c2: [
    "Can I send back the running shoes I got last week?",
    "The shoes are too small, can I swap them for a bigger size?",
    "When will the desk lamp arrive?",
  ],
  c3: [
    "The duvet cover isn't what I expected, I'd like a refund",
    "Can I exchange my hiking boots for a size 9?",
    "I need to change the address for my skillet order",
  ],
};

interface Turn {
  requestId?: string;
  decision?: Decision;
  reuse?: string | null;
  program: string;
  done: boolean;
  started: number;
  ms?: number;
  fixed?: boolean;
  note?: string;
}

export default function Page() {
  const [customerId, setCustomerId] = useState("c1");
  const [input, setInput] = useState("");
  const [turn, setTurn] = useState<Turn | null>(null);
  const [screens, setScreens] = useState<Screen[]>([]);
  const [totals, setTotals] = useState({ requests: 0, written: 0, reused: 0 });
  const active = useRef(0);
  const busy = !!turn && !turn.done;
  const name = CUSTOMERS.find((c) => c.id === customerId)!.name;

  const loadScreens = () =>
    fetch("/api/screens")
      .then((r) => r.json())
      .then(setScreens);
  useEffect(() => void loadScreens(), []);

  function switchCustomer(id: string) {
    active.current += 1;
    setCustomerId(id);
    setTurn(null);
  }

  async function reset() {
    active.current += 1;
    setScreens(await fetch("/api/screens", { method: "DELETE" }).then((r) => r.json()));
    setTurn(null);
    setTotals({ requests: 0, written: 0, reused: 0 });
  }

  async function send(text: string) {
    if (busy || !text.trim()) return;
    const id = ++active.current;
    const started = performance.now();
    const update = (patch: Partial<Turn>) => setTurn((t) => t && { ...t, ...patch });
    setInput("");
    setTurn({ program: "", done: false, started });
    setTotals((t) => ({ ...t, requests: t.requests + 1 }));

    try {
      const res = await fetch("/api/turn", {
        method: "POST",
        body: JSON.stringify({ text, customerId }),
      });
      if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      let program = "";
      let reused = false;
      for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
        // Another customer or Reset took over: drop this stream.
        if (id !== active.current) return reader.cancel();
        buffer += chunk.value;
        const lines = buffer.split("\n");
        buffer = lines.pop()!;
        for (const line of lines.filter(Boolean)) {
          const e = JSON.parse(line);
          if (e.type === "decision") {
            reused = !!e.reuse;
            update({ requestId: e.requestId, decision: e.decision, reuse: e.reuse });
          }
          if (e.type === "text") update({ program: (program += e.text).replace(/^```\w*\n?/, "") });
          if (e.type === "screen") {
            update({
              program: e.program,
              done: true,
              ms: performance.now() - started,
              fixed: e.fixed,
            });
            setTotals((t) =>
              reused ? { ...t, reused: t.reused + 1 } : { ...t, written: t.written + 1 },
            );
          }
          if (e.type === "saved") update({ note: `Saved as ${e.screen.id}: ${e.screen.title}.` });
          if (e.type === "not_saved") update({ note: `Not saved: ${e.reason}.` });
          if (e.type === "error") throw new Error(e.message);
        }
      }
    } catch (error) {
      if (id === active.current) update({ done: true, note: (error as Error).message });
    }
    loadScreens();
  }

  return (
    <ThemeProvider mode="light">
      <div className="app">
        <header>
          <strong>Parcel &amp; Co. Help</strong>
          <nav>
            {CUSTOMERS.map((c) => (
              <button
                key={c.id}
                className={c.id === customerId ? "on" : ""}
                onClick={() => switchCustomer(c.id)}
              >
                {c.name}
              </button>
            ))}
            <button onClick={reset}>Reset</button>
          </nav>
        </header>

        <main>
          <h1>Hi {name.split(" ")[0]}, what do you need help with?</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your problem"
            />
            <button disabled={busy || !input.trim()}>Send</button>
          </form>
          <div className="suggestions">
            {SUGGESTIONS[customerId].map((s) => (
              <button key={s} disabled={busy} onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
          {turn && <ScreenView turn={turn} />}
        </main>

        <aside>
          <h2>Behind the screen</h2>
          {turn?.decision ? (
            <DecisionView turn={turn} />
          ) : (
            <p className="muted">Jev picks a saved screen, or the LLM writes a new one.</p>
          )}
          {turn?.fixed && <p>Autofix repaired this screen.</p>}
          {turn?.note && <p>{turn.note}</p>}

          <h2>Saved screens</h2>
          {screens.length === 0 && <p className="muted">None yet.</p>}
          {screens.map((s) => (
            <p key={s.id}>
              {s.id} {s.title} <span className="muted">· used {s.uses}×</span>
            </p>
          ))}

          <p className="muted totals">
            {totals.requests} requests · {totals.written} written by the LLM · {totals.reused}{" "}
            reused
          </p>
        </aside>
      </div>
    </ThemeProvider>
  );
}

function ScreenView({ turn }: { turn: Turn }) {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    if (turn.done) return;
    const timer = setInterval(() => setNow(performance.now()), 100);
    return () => clearInterval(timer);
  }, [turn.done]);

  const tools = useMemo(
    () => ({
      callTool: ({
        name,
        arguments: args,
      }: {
        name: string;
        arguments?: Record<string, unknown>;
      }) =>
        fetch("/api/tools", {
          method: "POST",
          body: JSON.stringify({ requestId: turn.requestId, name, args }),
        }).then((r) => r.json()),
    }),
    [turn.requestId],
  );

  const seconds = ((turn.ms ?? now - turn.started) / 1000).toFixed(2);
  const status = !turn.decision
    ? "Asking Jev"
    : turn.reuse
      ? `Reused ${turn.reuse}, no LLM call`
      : turn.done
        ? "New screen written by the LLM"
        : "Writing a new screen";

  return (
    <section>
      <p className="status">
        {status} · {seconds} s
      </p>
      {turn.program && turn.requestId && (
        <div className="screen">
          <Renderer
            key={turn.requestId}
            response={turn.program}
            library={library}
            isStreaming={!turn.done}
            toolProvider={tools}
          />
        </div>
      )}
    </section>
  );
}

function DecisionView({ turn }: { turn: Turn }) {
  const { ms, screen, item } = turn.decision!;
  const pick = (c: Choice) => `${c.id ? c.label : "none"} (${Math.round(c.p * 100)}%)`;
  return (
    <>
      <p className="muted">Jev answered in {ms} ms</p>
      <p>Saved screen: {pick(screen)}</p>
      <p>Item: {pick(item)}</p>
      <p>{turn.reuse ? `Reusing ${turn.reuse}.` : "No match, so the LLM writes a new screen."}</p>
    </>
  );
}
