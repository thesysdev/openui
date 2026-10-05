"use client";

import { MarketingTable } from "@/components/marketing-table";
import {
  BRIEFS,
  COST_MODELS,
  FORMATS,
  FORMAT_ORDER,
  type FormatId,
  MODELS,
  type ModelId,
  blankScreens,
  blanksOver,
  completionByModel,
  completionOver,
  costPer1kScreens,
  costPerPass,
  formatLabel,
  runCounts,
  runsOver,
  tokens,
} from "@/lib/benchmark-data";
import type { ReactNode } from "react";
import {
  Chart,
  ChartDataDisclosure,
  Chip,
  DataTable,
  Row,
  styles as s,
  slotClass,
  useVizSkin,
} from "./primitives";

const slotOf = (id: FormatId) => FORMATS.find((f) => f.id === id)!.series;
const markOf = (id: FormatId) => FORMATS.find((f) => f.id === id)!.mark;
const usd = (n: number) => `$${n.toFixed(2)}`;

const ALL_MODELS = MODELS.map((m) => m.id);
const isFullSet = (models: readonly ModelId[]) => models.length === MODELS.length;

/* 1 ─ completion, model by model: the table --------------------------- */

export function CompletionByModel({
  models = ALL_MODELS,
  formats = FORMAT_ORDER,
  sub,
  note,
  flatTable = false,
}: {
  models?: readonly ModelId[];
  formats?: readonly FormatId[];
  sub?: string;
  note?: ReactNode | null;
  flatTable?: boolean;
} = {}) {
  const { vivid } = useVizSkin();
  const shownModels = MODELS.filter((m) => models.includes(m.id));
  const shownFormats = FORMAT_ORDER.filter((f) => formats.includes(f));
  return (
    <Chart
      title="Structural validity by model"
      sub={
        sub ??
        "How often the component graph parses, roots, resolves and validates. Two models clearly favor OpenUI, one clearly favors A2UI, and the other three sit inside the noise band."
      }
      tight
      note={
        note !== undefined ? (
          note
        ) : (
          <>
            {BRIEFS} briefs · {runsOver(models).toLocaleString()} runs per format
            {isFullSet(models) ? "" : ` over ${shownModels.length} of 6 models`}, 184 per cell, one
            uniform condition for every model; gaps under ~3 points are noise.
          </>
        )
      }
    >
      <MarketingTable
        compact
        edgeToEdgeMobile
        className={`${s.benchmarkTable} ${s.tableWide} ${flatTable ? s.tableFlat : ""}`}
      >
        <caption className={s.tableCaption}>
          Structural validity percentage for each model and generative UI format
        </caption>
        <thead>
          <tr>
            <th scope="col">Model</th>
            {FORMATS.filter((f) => shownFormats.includes(f.id)).map((f) => (
              <th key={f.id} scope="col" className={slotClass(f.series)}>
                <span className={s.colHead}>
                  {vivid ? <Chip mark={f.mark} /> : null}
                  {f.label}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shownModels.map((m, ri) => {
            const top = Math.max(...shownFormats.map((id) => completionByModel[m.id][id]));
            return (
              <tr key={m.id} style={{ "--d": `${ri * 45}ms` } as React.CSSProperties}>
                <th scope="row">
                  <span className={s.model}>
                    {vivid ? <Chip mark={m.mark} /> : null}
                    {m.label}
                    <span className={s.vendor}>{m.vendor}</span>
                  </span>
                </th>
                {shownFormats.map((id) => (
                  <td
                    key={id}
                    className={`${slotClass(slotOf(id))} ${s.tip}`}
                    data-tip={`${m.label} × ${formatLabel(id)}. ${runCounts[m.id][id].complete} of ${runCounts[m.id][id].runs} runs complete`}
                  >
                    {completionByModel[m.id][id] === top ? (
                      <span className={s.best}>
                        {vivid ? <span className={s.bestMark} aria-hidden /> : null}
                        {completionByModel[m.id][id].toFixed(1)}
                      </span>
                    ) : (
                      completionByModel[m.id][id].toFixed(1)
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
          {shownModels.length > 1 ? (
            <tr className={s.avgRow}>
              <th scope="row">Average</th>
              {shownFormats.map((id) => {
                const bestMean = shownFormats.reduce((a, b) =>
                  completionOver(b, models) > completionOver(a, models) ? b : a,
                );
                return (
                  <td key={id} className={slotClass(slotOf(id))}>
                    {id === bestMean ? (
                      <span className={s.best}>{completionOver(id, models).toFixed(1)}</span>
                    ) : (
                      completionOver(id, models).toFixed(1)
                    )}
                  </td>
                );
              })}
            </tr>
          ) : null}
        </tbody>
      </MarketingTable>
    </Chart>
  );
}

/* 2 ─ blank screens --------------------------------------------------- */

export function BlankScreens({
  models = ALL_MODELS,
  formats = FORMAT_ORDER,
}: {
  models?: readonly ModelId[];
  formats?: readonly FormatId[];
} = {}) {
  const full = isFullSet(models);
  const shownFormats = FORMAT_ORDER.filter((f) => formats.includes(f));
  const count = (id: FormatId) => (full ? blankScreens[id] : blanksOver(id, models));
  const runs = runsOver(models);
  const worst = Math.max(1, ...shownFormats.map(count));
  const fewest = Math.min(...shownFormats.map(count));
  return (
    <Chart
      title="Fully blank screens"
      sub="Runs where the user saw nothing at all. A broken OpenUI line costs you that line; a broken JSON document costs you the screen."
      note={
        full ? (
          <>
            Out of {runs.toLocaleString()}&#32;runs per format, as each SDK&rsquo;s shipped renderer
            produced them. OpenUI&rsquo;s single blank is an empty API response; A2UI drops a whole
            updateComponents message on any invalid component.
          </>
        ) : (
          <>
            Out of {runs.toLocaleString()}&#32;runs per format over {models.length}&#32;of 6 models,
            as each SDK&rsquo;s shipped renderer produced them.
          </>
        )
      }
    >
      <div className={s.rows}>
        {shownFormats.map((id, i) => (
          <Row
            key={id}
            label={formatLabel(id)}
            mark={markOf(id)}
            tip={`${formatLabel(id)}. ${count(id)} fully blank in ${runs.toLocaleString()} runs`}
          >
            <span className={s.barSlot}>
              <span
                className={`${s.bar} ${slotClass(slotOf(id))} ${id === "openui" ? s.barOurs : ""}`}
                style={
                  {
                    width: `${(count(id) / worst) * 88}%`,
                    "--d": `${i * 90}ms`,
                  } as React.CSSProperties
                }
              />
            </span>
            <span
              className={`${s.value} ${count(id) === fewest ? `${s.valueHi} ${slotClass(slotOf(id))}` : ""}`}
            >
              {count(id)} / {((count(id) / runs) * 100).toFixed(2)}%
            </span>
          </Row>
        ))}
      </div>
    </Chart>
  );
}

/* 3 ─ tokens: system prompt + output in one stacked bar -------------- */

export function TokenOverhead({
  formats = FORMAT_ORDER,
  sub,
  note,
}: {
  formats?: readonly FormatId[];
  sub?: string;
  note?: ReactNode | null;
} = {}) {
  const shown = FORMAT_ORDER.filter((f) => formats.includes(f));
  const total = (id: FormatId) => tokens.systemPrompt[id] + tokens.outputPerScreen[id];
  const max = Math.max(...shown.map(total));

  return (
    <Chart
      title="Token consumption"
      sub={
        sub ??
        "System prompt and model output, stacked into one bar. Shorter bars use fewer tokens."
      }
      note={
        note !== undefined ? (
          note
        ) : (
          <>
            System prompts from each SDK&rsquo;s own generator over the same 70-component catalog;
            output is the mean over all {tokens.outputBasis.runs.toLocaleString()} scored runs
            across the six models. tiktoken o200k on the exact prompts and outputs.
          </>
        )
      }
    >
      <div className={s.tokenRows}>
        {shown.map((id, i) => {
          const prompt = tokens.systemPrompt[id];
          const output = tokens.outputPerScreen[id];
          const combined = total(id);
          return (
            <div
              key={id}
              className={`${s.tokenRow} ${slotClass(slotOf(id))} ${s.tip}`}
              data-tip={`${formatLabel(id)}. ${prompt.toLocaleString()} prompt + ${output.toLocaleString()} output = ${combined.toLocaleString()} tokens per screen`}
            >
              <span className={s.tokenName}>
                <Chip mark={markOf(id)} />
                <span>{formatLabel(id)}</span>
              </span>
              <span className={s.tokenBarTrack}>
                <span
                  className={s.tokenStack}
                  style={
                    {
                      width: `${(combined / max) * 100}%`,
                      "--d": `${i * 90}ms`,
                    } as React.CSSProperties
                  }
                >
                  <span className={s.tokenInput} style={{ width: `${(prompt / combined) * 100}%` }}>
                    {prompt / max >= 0.085 ? (
                      <span className={s.segNum}>
                        {prompt.toLocaleString()}
                        {i === 0 ? " input" : ""}
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={s.tokenOutput}
                    style={{ width: `${(output / combined) * 100}%` }}
                  >
                    {output / max >= 0.085 ? (
                      <span className={s.segNum}>
                        {output.toLocaleString()}
                        {i === 0 ? " output" : ""}
                      </span>
                    ) : null}
                  </span>
                </span>
              </span>
              <span className={s.tokenValue}>
                <strong>{combined.toLocaleString()}</strong>
              </span>
            </div>
          );
        })}
      </div>
    </Chart>
  );
}

/* 3b ─ tokens as a bar table: input | output | total, each column on its
   own scale so the differences stay legible. Page-only. */

const TOKEN_COLS = [
  { key: "prompt", label: "System prompt", val: (id: FormatId) => tokens.systemPrompt[id] },
  { key: "output", label: "Output", val: (id: FormatId) => tokens.outputPerScreen[id] },
] as const;

export function TokenMatrix({
  formats = FORMAT_ORDER,
  sub,
  note,
}: {
  formats?: readonly FormatId[];
  sub?: string;
  note?: ReactNode | null;
} = {}) {
  const shown = FORMAT_ORDER.filter((f) => formats.includes(f));
  const colMax = (col: (typeof TOKEN_COLS)[number]) => Math.max(...shown.map((id) => col.val(id)));
  return (
    <Chart
      title="Token consumption"
      sub={sub ?? "System prompt and output for one screen. Multiples compare with OpenUI."}
      note={
        note !== undefined ? (
          note
        ) : (
          <>
            System prompts from each SDK&rsquo;s own generator over the same 70-component catalog;
            output is the mean over all {tokens.outputBasis.runs.toLocaleString()} scored runs.
          </>
        )
      }
    >
      <div className={`${s.matrix} ${s.matrixPair}`}>
        <div className={s.matrixHead} aria-hidden>
          <span />
          {TOKEN_COLS.map((c) => (
            <span key={c.key}>{c.label}</span>
          ))}
        </div>
        {shown.map((id, ri) => {
          const f = FORMATS.find((x) => x.id === id)!;
          return (
            <div
              key={id}
              className={`${s.matrixRow} ${slotClass(f.series)} ${s.tip}`}
              data-tip={`${formatLabel(id)}: ${tokens.systemPrompt[id].toLocaleString()} input + ${tokens.outputPerScreen[id].toLocaleString()} output = ${(tokens.systemPrompt[id] + tokens.outputPerScreen[id]).toLocaleString()} tokens per screen`}
            >
              <span className={s.tokenName}>
                <Chip mark={f.mark} />
                <span>{f.label}</span>
              </span>
              {TOKEN_COLS.map((c) => {
                const base = c.val("openui");
                const times = c.val(id) / base;
                return (
                  <span key={c.key} className={`${s.matrixCell} ${s.matrixCellDiff}`}>
                    <span className={s.matrixBarWrap}>
                      <span
                        className={`${s.matrixBar} ${
                          id === "openui"
                            ? s.colBarOurs
                            : id === "a2ui"
                              ? s.colBarStriped
                              : s.colBarStripedLight
                        }`}
                        style={
                          {
                            width: `${(c.val(id) / colMax(c)) * 100}%`,
                            "--d": `${ri * 90}ms`,
                          } as React.CSSProperties
                        }
                      />
                    </span>
                    <span className={s.matrixVal}>{c.val(id).toLocaleString()}</span>
                    <span className={s.matrixDiff}>
                      {id !== "openui" ? (
                        <span className={times <= 1 ? s.diffGood : s.diffBad}>
                          {times <= 1 ? "↓" : "↑"}
                          {times.toFixed(1)}×
                        </span>
                      ) : null}
                    </span>
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
      <ChartDataDisclosure label="View token data">
        <DataTable>
          <caption>System prompt and mean output tokens per screen by format</caption>
          <thead>
            <tr>
              <th scope="col">Format</th>
              <th scope="col" data-numeric="true">
                System prompt
              </th>
              <th scope="col" data-numeric="true">
                Mean output
              </th>
              <th scope="col" data-numeric="true">
                Combined
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((format) => (
              <tr key={`data-${format}`}>
                <th scope="row">{formatLabel(format)}</th>
                <td data-numeric="true">{tokens.systemPrompt[format].toLocaleString()}</td>
                <td data-numeric="true">{tokens.outputPerScreen[format].toLocaleString()}</td>
                <td data-numeric="true">
                  {(tokens.systemPrompt[format] + tokens.outputPerScreen[format]).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      </ChartDataDisclosure>
    </Chart>
  );
}

/* 4 ─ cost: the table ------------------------------------------------- */

export function CostPerPass({
  models = ALL_MODELS,
  formats = FORMAT_ORDER,
  sub,
  note,
  flatTable = false,
}: {
  models?: readonly ModelId[];
  formats?: readonly FormatId[];
  sub?: string;
  note?: ReactNode | null;
  flatTable?: boolean;
} = {}) {
  const { vivid } = useVizSkin();
  const shownModels = COST_MODELS.filter((m) => models.includes(m));
  const shownFormats = FORMAT_ORDER.filter((f) => formats.includes(f));
  return (
    <Chart
      title="Cost of one benchmark pass"
      sub={
        sub ??
        "What the same 46 screens cost in each format, at list prices. Cheapest in each row is highlighted."
      }
      tight
      note={
        note !== undefined ? (
          note
        ) : (
          <>
            One pass = {BRIEFS} screens at provider list prices, all six models.
            {` Per 1,000 screens on Opus: $${costPer1kScreens("opus", "openui").toFixed(0)} in OpenUI against $${costPer1kScreens("opus", "a2ui").toFixed(0)} in A2UI and $${costPer1kScreens("opus", "jsonRender").toFixed(0)} in json-render.`}
          </>
        )
      }
    >
      {shownModels.length === 0 ? (
        <p className={s.note}>
          None of the selected models has a public per-token price, so there is nothing to cost. Add
          a priced model to the filter.
        </p>
      ) : (
        <MarketingTable
          compact
          edgeToEdgeMobile
          className={`${s.benchmarkTable} ${flatTable ? s.tableFlat : ""}`}
        >
          <caption className={s.tableCaption}>
            Cost in USD for one 46-screen benchmark pass by model and generative UI format
          </caption>
          <thead>
            <tr>
              <th scope="col">Model</th>
              {FORMATS.filter((f) => shownFormats.includes(f.id)).map((f) => (
                <th key={f.id} scope="col" className={slotClass(f.series)}>
                  <span className={s.colHead}>
                    {vivid ? <Chip mark={f.mark} /> : null}
                    {f.label}
                  </span>
                </th>
              ))}
              {shownFormats.length > 1 && !vivid ? (
                <th scope="col" className={s.deltaHead}>
                  Delta
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {shownModels.map((m, ri) => {
              const model = MODELS.find((x) => x.id === m)!;
              const vals = shownFormats.map((id) => costPerPass[m]![id]);
              const min = Math.min(...vals);
              const max = Math.max(...vals);
              return (
                <tr key={m} style={{ "--d": `${ri * 45}ms` } as React.CSSProperties}>
                  <th scope="row">
                    <span className={s.model}>
                      {vivid ? <Chip mark={model.mark} /> : null}
                      {model.label}
                      <span className={s.vendor}>{model.vendor}</span>
                    </span>
                  </th>
                  {shownFormats.map((id) => {
                    const v = costPerPass[m]![id];
                    const base = costPerPass[m]!.openui;
                    const times = v / base;
                    const showDiff = vivid && id !== "openui" && shownFormats.includes("openui");
                    return (
                      <td
                        key={id}
                        className={`${slotClass(slotOf(id))} ${s.tip}`}
                        data-tip={`${model.label} × ${formatLabel(id)}. ≈ $${costPer1kScreens(m, id).toFixed(0)} per 1,000 screens`}
                      >
                        {v === min ? (
                          <span className={s.best}>
                            {vivid ? <span className={s.bestMark} aria-hidden /> : null}
                            {usd(v)}
                          </span>
                        ) : (
                          usd(v)
                        )}
                        {showDiff ? (
                          <span className={times <= 1 ? s.diffGood : s.diffBad}>
                            {times <= 1 ? "\u2193" : "\u2191"}
                            {times.toFixed(1)}×
                          </span>
                        ) : null}
                      </td>
                    );
                  })}
                  {shownFormats.length > 1 && !vivid ? <td>{(max / min).toFixed(1)}x</td> : null}
                </tr>
              );
            })}
          </tbody>
        </MarketingTable>
      )}
    </Chart>
  );
}
