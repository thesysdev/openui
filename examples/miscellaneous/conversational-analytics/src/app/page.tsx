"use client";

import { Renderer } from "@openuidev/react-lang";
import { ThemeProvider } from "@openuidev/react-ui";
import { useEffect, useMemo, useRef, useState } from "react";
import { exampleProgram } from "../lib/example-program";
import { defaultFilters, filterSchema, type Filters } from "../lib/filters";
import { readDashboardStream } from "../lib/read-stream";
import { library } from "../library";

export default function Page() {
  const [program, setProgram] = useState(exampleProgram);
  const [question, setQuestion] = useState("Why did gross sales fall in February 2011?");
  const [history, setHistory] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [queryError, setQueryError] = useState("");
  const [parseError, setParseError] = useState("");
  const [label, setLabel] = useState("Example dashboard");
  const [revision, setRevision] = useState(0);
  const [initialState, setInitialState] = useState<Record<string, unknown>>();
  const filters = useRef<Filters>(defaultFilters);
  const controller = useRef<AbortController | null>(null);
  const queryRevision = useRef(0);
  useEffect(() => () => controller.current?.abort(), []);

  const toolProvider = useMemo(
    () => ({
      sales_dashboard: async (args: Record<string, unknown>) => {
        const current = ++queryRevision.current;
        setQueryError("");
        try {
          const response = await fetch("/api/analytics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(args),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Could not load sales data.");
          return data;
        } catch (error) {
          if (current === queryRevision.current)
            setQueryError(error instanceof Error ? error.message : "Could not load sales data.");
          throw error;
        }
      },
    }),
    [],
  );

  function loadExample() {
    controller.current?.abort();
    filters.current = defaultFilters;
    setInitialState(undefined);
    setProgram(exampleProgram);
    setHistory([]);
    setLabel("Example dashboard");
    setError("");
    setParseError("");
    setQueryError("");
    setRevision((value) => value + 1);
  }

  async function ask() {
    if (busy || !question.trim()) return;
    const submitted = question.trim();
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setError("");
    setParseError("");
    let started = false;
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abort.signal,
        body: JSON.stringify({
          question: submitted,
          history: history.slice(-5),
          filters: filters.current,
        }),
      });
      if (!response.ok) throw new Error((await response.json()).error || "Generation failed.");
      if (!response.body) throw new Error("The response had no stream.");
      await readDashboardStream(response.body, (text) => {
        if (!started) {
          started = true;
          setInitialState(undefined);
          setRevision((value) => value + 1);
          setLabel(submitted);
        }
        setProgram(text);
      });
      setHistory((items) => [...items.slice(-4), submitted]);
      setQuestion("");
    } catch (error) {
      setError(
        abort.signal.aborted
          ? "Generation stopped. Load the example or ask again to replace the partial response."
          : error instanceof Error
            ? error.message
            : "Generation failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <ThemeProvider mode="light">
      <main className="notebook">
        <header className="masthead">
          <a
            href="https://www.openui.com/docs/cookbooks/conversational-analytics"
            className="brand"
          >
            OpenUI <span>/ Cookbooks</span>
          </a>
          <a href="https://archive.ics.uci.edu/dataset/352/online+retail">View dataset ↗</a>
        </header>
        <section className="intro">
          <p className="eyebrow">01 / Conversational analytics</p>
          <h1>Retail notebook</h1>
          <p className="lede">Ask a sales question. Explore the answer.</p>
          <p className="scope">
            Real transactions from UCI Online Retail. January to November 2011, compared with the
            previous month.
          </p>
        </section>
        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            void ask();
          }}
        >
          <label htmlFor="question">What would you like to understand?</label>
          <div className="composer-row">
            <input
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={600}
              disabled={busy}
              placeholder="Now show Germany as a bar chart"
            />
            {busy ? (
              <button type="button" onClick={() => controller.current?.abort()}>
                Stop
              </button>
            ) : (
              <button disabled={!question.trim()} type="submit">
                Ask a question ↗
              </button>
            )}
          </div>
          <p className="hint">
            Questions use your configured model. The example dashboard and filters work without an
            API key.
          </p>
        </form>
        <div className="dashboard-heading">
          <div>
            <span className={`status-dot${busy ? " working" : ""}`} />
            {busy ? "Generating dashboard…" : label}
          </div>
          <button type="button" className="quiet" onClick={loadExample} disabled={busy}>
            Load example dashboard
          </button>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {queryError && (
          <div className="error" role="alert">
            <p>{queryError} Any visible results may belong to the previous filter.</p>
            <button
              type="button"
              onClick={() => {
                setInitialState({
                  $country: filters.current.country,
                  $month: filters.current.month,
                });
                setQueryError("");
                setRevision((value) => value + 1);
              }}
            >
              Retry data query
            </button>
          </div>
        )}
        {!busy && parseError && (
          <p className="error" role="alert">
            The model produced an invalid dashboard: {parseError} Try again or load the example.
          </p>
        )}
        <section className="dashboard" aria-label="Sales dashboard" aria-busy={busy}>
          <Renderer
            key={revision}
            response={program}
            library={library}
            isStreaming={busy}
            initialState={initialState}
            toolProvider={toolProvider}
            queryLoader={<p role="status">Refreshing sales data…</p>}
            onStateUpdate={(state) => {
              const parsed = filterSchema.safeParse({
                month: state.$month,
                country: state.$country,
              });
              if (parsed.success) filters.current = parsed.data;
            }}
            onError={(errors) => setParseError(errors.map((item) => item.message).join(" "))}
          />
        </section>
        <details className="source">
          <summary>Inspect the OpenUI Lang</summary>
          <pre>{program}</pre>
        </details>
        <footer>
          <p>
            <strong>About these numbers.</strong> Gross sales include positive-priced,
            positive-quantity invoice lines. Cancellations are excluded. This is not net revenue or
            profit. Country is the transaction country, and the product table shows only ten
            differences.
          </p>
          <p>
            Chen, D. (2015). <a href="https://doi.org/10.24432/C5BW33">Online Retail</a>. UCI
            Machine Learning Repository.{" "}
            <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. The source is
            filtered and aggregated locally; customer IDs are not imported.
          </p>
        </footer>
      </main>
    </ThemeProvider>
  );
}
