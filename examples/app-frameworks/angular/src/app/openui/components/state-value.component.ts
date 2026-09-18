import { Component, Input } from "@angular/core";
import { injectOpenUiContext } from "@openuidev/angular-lang";

@Component({
  selector: "demo-state-value",
  standalone: true,
  template: `
    <div class="state-value">
      <span class="label">{{ props?.label }}</span>
      <code>{{ value }}</code>
    </div>
  `,
  styles: [
    `
      .state-value {
        display: grid;
        gap: 0.4rem;
        padding: 0.9rem 1rem;
        border-radius: 0.9rem;
        background: rgba(15, 23, 42, 0.56);
        border: 1px solid rgba(148, 163, 184, 0.2);
      }

      .label {
        color: #94a3b8;
        font-size: 0.9rem;
      }

      code {
        color: #f8fafc;
      }
    `,
  ],
})
export class StateValueComponent {
  @Input() props: { formName: string; name: string; label: string } | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined = undefined;

  private readonly openUi = injectOpenUiContext();

  get value(): string {
    const current = this.openUi.getFieldValue(this.props?.formName, this.props?.name ?? "");
    return current == null || current === "" ? "(empty)" : String(current);
  }
}
