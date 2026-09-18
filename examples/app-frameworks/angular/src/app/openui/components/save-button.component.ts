import { Component, Input } from "@angular/core";
import type { ActionPlan } from "@openuidev/angular-lang";
import { injectOpenUiContext } from "@openuidev/angular-lang";

@Component({
  selector: "demo-save-button",
  standalone: true,
  template: `
    <button type="button" class="save-button" (click)="run()">
      {{ props?.label ?? "Run mutation" }}
    </button>
  `,
  styles: [
    `
      .save-button {
        border: 0;
        border-radius: 0.85rem;
        padding: 0.8rem 1rem;
        background: linear-gradient(135deg, #2563eb, #0891b2);
        color: white;
        cursor: pointer;
        font-weight: 600;
      }
    `,
  ],
})
export class SaveButtonComponent {
  @Input() props: { label: string; mutationId: string } | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined = undefined;

  private readonly openUi = injectOpenUiContext();

  run(): void {
    if (!this.props) {
      return;
    }

    const action: ActionPlan = {
      steps: [{ type: "run", statementId: this.props.mutationId, refType: "mutation" }],
    };

    void this.openUi.triggerAction(this.props.label, undefined, action);
  }
}
