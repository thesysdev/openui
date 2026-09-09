import { JsonPipe } from "@angular/common";
import { Component, Type, computed, signal } from "@angular/core";
import type { ActionEvent, OpenUIError, ParseResult } from "@openuidev/angular-lang";
import { Renderer } from "@openuidev/angular-lang";
import { library } from "./openui/library";
import { QueryLoaderComponent } from "./openui/components/query-loader.component";
import { scenarios, type ScenarioDefinition } from "./openui/scenarios";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [JsonPipe, Renderer],
  template: `
    <main class="page-shell">
      <section class="hero">
        <div>
          <p class="eyebrow">OpenUI app-framework example</p>
          <h1>Angular 22 playground</h1>
          <p class="lede">
            Smoke-test the local <code>@openuidev/angular-lang</code> package inside a small,
            repo-aligned Angular app.
          </p>
        </div>
        <div class="hero-meta">
          <span>Runtime: Angular 22</span>
          <span>Package source: local repo path alias</span>
        </div>
      </section>

      <section class="toolbar">
        @for (scenario of scenarioList; track scenario.id) {
          <button
            type="button"
            class="scenario-button"
            [class.active]="scenario.id === selectedScenarioId()"
            (click)="applyScenario(scenario)"
          >
            {{ scenario.label }}
          </button>
        }
      </section>

      <section class="layout-grid">
        <article class="panel preview-panel">
          <header class="panel-header">
            <div>
              <h2>Renderer preview</h2>
              <p>{{ currentScenario()?.description }}</p>
            </div>
          </header>

          <div class="renderer-stage">
            <openui-renderer
              [response]="response()"
              [library]="library"
              [isStreaming]="isStreaming()"
              [initialState]="initialState()"
              [toolProvider]="toolProvider"
              [queryLoader]="queryLoader"
              (action)="onAction($event)"
              (stateUpdate)="onStateUpdate($event)"
              (parseResult)="onParseResult($event)"
              (error)="onError($event)"
            />
          </div>
        </article>

        <aside class="panel inspector-panel">
          <section class="inspector-section">
            <h3>Response</h3>
            <pre>{{ response() }}</pre>
          </section>

          <section class="inspector-section">
            <h3>Initial state</h3>
            <pre>{{ initialState() | json }}</pre>
          </section>

          <section class="inspector-section">
            <h3>Last action</h3>
            <pre>{{ lastActionJson() }}</pre>
          </section>

          <section class="inspector-section">
            <h3>Last state update</h3>
            <pre>{{ lastStateUpdateJson() }}</pre>
          </section>

          <section class="inspector-section">
            <h3>Last parse result</h3>
            <pre>{{ lastParseResultSummary() }}</pre>
          </section>

          <section class="inspector-section">
            <h3>Errors</h3>
            <pre>{{ lastErrorsJson() }}</pre>
          </section>
        </aside>
      </section>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        color: #e5e7eb;
      }

      .page-shell {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem 1.25rem 3rem;
        display: grid;
        gap: 1.25rem;
      }

      .hero,
      .panel,
      .toolbar {
        border: 1px solid rgba(148, 163, 184, 0.18);
        background: rgba(15, 23, 42, 0.72);
        backdrop-filter: blur(18px);
        box-shadow: 0 24px 70px rgba(2, 6, 23, 0.28);
      }

      .hero {
        border-radius: 1.35rem;
        padding: 1.5rem;
        display: grid;
        gap: 1rem;
      }

      .eyebrow {
        margin: 0 0 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.78rem;
        color: #7dd3fc;
      }

      h1,
      h2,
      h3,
      p {
        margin: 0;
      }

      h1 {
        font-size: clamp(1.9rem, 3vw, 2.8rem);
      }

      .lede {
        margin-top: 0.75rem;
        max-width: 60ch;
        color: #cbd5e1;
        line-height: 1.55;
      }

      .hero-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
      }

      .hero-meta span {
        border-radius: 999px;
        padding: 0.45rem 0.75rem;
        background: rgba(30, 41, 59, 0.9);
        color: #cbd5e1;
      }

      .toolbar {
        border-radius: 1rem;
        padding: 0.75rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
      }

      .scenario-button {
        border: 1px solid rgba(148, 163, 184, 0.18);
        background: rgba(15, 23, 42, 0.88);
        color: #e2e8f0;
        border-radius: 0.9rem;
        padding: 0.75rem 0.95rem;
        cursor: pointer;
      }

      .scenario-button.active {
        background: linear-gradient(135deg, rgba(37, 99, 235, 0.9), rgba(8, 145, 178, 0.9));
        border-color: rgba(96, 165, 250, 0.45);
      }

      .layout-grid {
        display: grid;
        gap: 1.25rem;
      }

      .panel {
        border-radius: 1.2rem;
        overflow: hidden;
      }

      .panel-header {
        padding: 1.1rem 1.15rem 0;
      }

      .panel-header p {
        margin-top: 0.35rem;
        color: #94a3b8;
      }

      .renderer-stage {
        min-height: 360px;
        padding: 1.15rem;
      }

      .inspector-panel {
        padding: 1rem;
        display: grid;
        gap: 0.9rem;
      }

      .inspector-section {
        display: grid;
        gap: 0.35rem;
      }

      .inspector-section h3 {
        font-size: 0.92rem;
        color: #cbd5e1;
      }

      pre {
        margin: 0;
        overflow: auto;
        white-space: pre-wrap;
        word-break: break-word;
        border-radius: 0.95rem;
        background: rgba(2, 6, 23, 0.7);
        border: 1px solid rgba(148, 163, 184, 0.16);
        color: #cbd5e1;
        padding: 0.85rem;
        line-height: 1.45;
      }

      code {
        color: #f8fafc;
      }

      @media (min-width: 960px) {
        .layout-grid {
          grid-template-columns: minmax(0, 1.65fr) minmax(320px, 0.95fr);
          align-items: start;
        }
      }
    `,
  ],
})
export class App {
  protected readonly library = library;
  protected readonly queryLoader: Type<unknown> = QueryLoaderComponent;
  protected readonly scenarioList = scenarios;
  protected readonly selectedScenarioId = signal(scenarios[0]?.id ?? "static");
  protected readonly response = signal<string | null>(scenarios[0]?.response ?? null);
  protected readonly initialState = signal<Record<string, unknown>>(scenarios[0]?.initialState ?? {});
  protected readonly isStreaming = signal(false);
  protected readonly lastAction = signal<ActionEvent | null>(null);
  protected readonly lastStateUpdate = signal<Record<string, unknown> | null>(null);
  protected readonly lastParseResult = signal<ParseResult | null>(null);
  protected readonly lastErrors = signal<OpenUIError[]>([]);
  protected readonly currentScenario = computed(() =>
    this.scenarioList.find((scenario) => scenario.id === this.selectedScenarioId()) ?? null,
  );

  protected readonly toolProvider = {
    get_message: async () => {
      this.isStreaming.set(true);
      await new Promise((resolve) => setTimeout(resolve, 900));
      this.isStreaming.set(false);
      return "Hello from query";
    },
    save_message: async (args: Record<string, unknown>) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { ok: true, args };
    },
  };

  constructor() {
    const initialScenario = this.scenarioList[0];
    if (initialScenario) {
      this.applyScenario(initialScenario);
    }
  }

  protected applyScenario(scenario: ScenarioDefinition): void {
    this.selectedScenarioId.set(scenario.id);
    this.response.set(scenario.response);
    this.initialState.set(scenario.initialState ?? {});
    this.lastErrors.set([]);
    this.lastAction.set(null);
    this.lastStateUpdate.set(null);
    this.lastParseResult.set(null);
  }

  protected onAction(event: ActionEvent): void {
    this.lastAction.set(event);
  }

  protected onStateUpdate(state: Record<string, unknown>): void {
    this.lastStateUpdate.set(state);
  }

  protected onParseResult(result: ParseResult | null): void {
    this.lastParseResult.set(result);
  }

  protected onError(errors: OpenUIError[]): void {
    this.lastErrors.set(errors);
  }

  protected lastActionJson(): string {
    return this.lastAction() ? JSON.stringify(this.lastAction(), null, 2) : "(none)";
  }

  protected lastStateUpdateJson(): string {
    return this.lastStateUpdate() ? JSON.stringify(this.lastStateUpdate(), null, 2) : "(none)";
  }

  protected lastParseResultSummary(): string {
    const result = this.lastParseResult();
    if (!result) {
      return "(none)";
    }

    return JSON.stringify(
      {
        rootType: result.root?.typeName ?? null,
        errors: result.meta.errors,
        unresolved: result.meta.unresolved,
        queryStatements: result.queryStatements.map((statement) => statement.statementId),
        mutationStatements: result.mutationStatements.map((statement) => statement.statementId),
      },
      null,
      2,
    );
  }

  protected lastErrorsJson(): string {
    return this.lastErrors().length > 0 ? JSON.stringify(this.lastErrors(), null, 2) : "[]";
  }
}
