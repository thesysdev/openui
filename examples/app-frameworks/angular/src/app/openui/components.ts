import { Component, Directive, Input, signal } from "@angular/core";
import { RenderNode, injectOpenUiContext } from "@openuidev/angular-lang";
import { formMessage } from "./actions";

@Directive()
export class ComponentInputs {
  @Input() props: any = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined;
}

@Component({
  selector: "agent-response",
  imports: [RenderNode],
  template: ` <div class="generated-response">
    <openui-render-node
      [value]="renderNode ? renderNode(props?.children) : props?.children"
      [library]="context.library"
      [context]="context"
    />
  </div>`,
})
export class ResponseComponent extends ComponentInputs {
  readonly context = injectOpenUiContext();
}

@Component({ selector: "agent-heading", template: `<h2 class="ui-heading">{{ props?.text }}</h2>` })
export class HeadingComponent extends ComponentInputs {}

@Component({
  selector: "agent-paragraph",
  template: `<p class="ui-paragraph">{{ props?.text }}</p>`,
})
export class ParagraphComponent extends ComponentInputs {}

@Component({
  selector: "agent-metrics",
  template: ` <div class="ui-metrics">
    @for (item of props?.items ?? []; track $index) {
      <div class="ui-metric">
        <span>{{ item?.label }}</span
        ><strong>{{ item?.value }}</strong
        ><small>{{ item?.detail }}</small>
      </div>
    }
  </div>`,
})
export class MetricsComponent extends ComponentInputs {}

@Component({
  selector: "agent-chart",
  template: ` <section class="ui-card">
    <h3>{{ props?.title }}</h3>
    <div class="ui-bars" role="img" [attr.aria-label]="description()">
      @for (item of props?.items ?? []; track $index) {
        <div class="ui-bar-row">
          <span class="bar-label">{{ item?.label }}</span>
          <div class="bar-track">
            <div class="bar-fill" [style.width.%]="width(item?.value)"></div>
          </div>
          <span class="bar-value">{{ format(item?.value) }} {{ props?.unit }}</span>
        </div>
      }
    </div>
    <p class="ui-caption">{{ props?.caption }}</p>
  </section>`,
})
export class BarChartComponent extends ComponentInputs {
  width(value: number): number {
    return (
      (Math.max(0, Number(value) || 0) /
        Math.max(1, ...(this.props?.items ?? []).map((item: any) => Number(item?.value) || 0))) *
      100
    );
  }
  format(value: number): string {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(
      Number(value) || 0,
    );
  }
  description(): string {
    return `${this.props?.title ?? "Chart"}: ${(this.props?.items ?? []).map((item: any) => `${item?.label}: ${item?.value} ${this.props?.unit ?? ""}`).join(", ")}`;
  }
}

@Component({
  selector: "agent-table",
  template: ` <section class="ui-card table-card">
    <h3>{{ props?.title }}</h3>
    <div class="table-scroll" tabindex="0" role="region" [attr.aria-label]="props?.title">
      <table>
        <thead>
          <tr>
            @for (header of props?.headers ?? []; track $index) {
              <th scope="col">{{ header }}</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of props?.rows ?? []; track $index) {
            <tr>
              @for (cell of row; track $index) {
                <td>{{ cell }}</td>
              }
            </tr>
          }
        </tbody>
      </table>
    </div>
  </section>`,
})
export class DataTableComponent extends ComponentInputs {}

@Component({
  selector: "agent-callout",
  template: `<aside class="ui-callout">
    <span class="callout-icon">↗</span>
    <div>
      <h3>{{ props?.title }}</h3>
      <p>{{ props?.text }}</p>
    </div>
  </aside>`,
})
export class CalloutComponent extends ComponentInputs {}

@Component({
  selector: "agent-checklist",
  template: ` <section class="ui-card">
    <h3>{{ props?.title }}</h3>
    <div class="ui-checklist">
      @for (item of props?.items ?? []; track $index) {
        <label [class.checked]="checked().has($index)"
          ><input
            type="checkbox"
            [checked]="checked().has($index)"
            (change)="toggle($index)"
          /><span>{{ item }}</span></label
        >
      }
    </div>
  </section>`,
})
export class ChecklistComponent extends ComponentInputs {
  readonly checked = signal(new Set<number>());
  toggle(index: number): void {
    this.checked.update((previous) => {
      const next = new Set(previous);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }
}

@Component({
  selector: "agent-followups",
  template: `<div class="ui-followups">
    @for (text of props?.suggestions ?? []; track $index) {
      <button type="button" (click)="ask(text)">{{ text }} <span>↗</span></button>
    }
  </div>`,
})
export class FollowUpsComponent extends ComponentInputs {
  private readonly context = injectOpenUiContext();
  ask(text: string): void {
    if (!this.context.isStreaming) void this.context.triggerAction(text);
  }
}

@Component({
  selector: "agent-choice-form",
  template: ` <form class="ui-card ui-form" (submit)="submit($event)">
    <h3>{{ props?.title }}</h3>
    @for (field of props?.fields ?? []; track $index) {
      <label
        ><span>{{ field?.label }}</span
        ><input
          [name]="field?.name"
          [placeholder]="field?.placeholder ?? ''"
          [value]="values()[field?.name] ?? ''"
          (input)="set(field?.name, $event)"
          required
      /></label>
    }
    <button class="form-submit" type="submit">
      {{ props?.submitLabel ?? "Continue" }} <span>→</span>
    </button>
  </form>`,
})
export class ChoiceFormComponent extends ComponentInputs {
  readonly values = signal<Record<string, string>>({});
  private readonly context = injectOpenUiContext();
  set(name: string, event: Event): void {
    this.values.update((values) => ({
      ...values,
      [name]: (event.target as HTMLInputElement).value,
    }));
  }
  submit(event: Event): void {
    event.preventDefault();
    if (this.context.isStreaming) return;
    void this.context.triggerAction(
      formMessage(this.props?.title ?? "My preferences", this.props?.fields ?? [], this.values()),
    );
  }
}
