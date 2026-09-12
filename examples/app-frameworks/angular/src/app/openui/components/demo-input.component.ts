import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import {
  injectOpenUiContext,
  setDefaultValue,
} from "@openuidev/angular-lang";

@Component({
  selector: "demo-input-field",
  standalone: true,
  template: `
    <label class="field-shell">
      <span class="field-label">{{ props?.label }}</span>
      <input
        class="field-input"
        [value]="currentValue"
        [placeholder]="props?.placeholder ?? ''"
        (input)="onInput($event)"
        (blur)="onBlur($event)"
      />
    </label>
  `,
  styles: [
    `
      .field-shell {
        display: grid;
        gap: 0.45rem;
      }

      .field-label {
        color: #cbd5e1;
        font-size: 0.95rem;
      }

      .field-input {
        width: 100%;
        border-radius: 0.85rem;
        border: 1px solid rgba(148, 163, 184, 0.22);
        background: rgba(15, 23, 42, 0.72);
        color: #f8fafc;
        padding: 0.8rem 0.95rem;
        outline: none;
      }
    `,
  ],
})
export class DemoInputComponent implements OnChanges {
  @Input() props:
    | {
        formName: string;
        name: string;
        label: string;
        defaultValue?: string;
        placeholder?: string;
      }
    | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined = undefined;

  private readonly openUi = injectOpenUiContext();

  get currentValue(): string {
    const value = this.openUi.getFieldValue(this.props?.formName, this.props?.name ?? "");
    return value == null ? "" : String(value);
  }

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.props) {
      return;
    }

    setDefaultValue({
      formName: this.props.formName,
      componentType: "Input",
      name: this.props.name,
      existingValue: this.openUi.getFieldValue(this.props.formName, this.props.name),
      defaultValue: this.props.defaultValue,
      isStreaming: this.openUi.isStreaming,
      shouldTriggerSaveCallback: false,
    });
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.openUi.setFieldValue(this.props?.formName, "Input", this.props?.name ?? "", value, false);
  }

  onBlur(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.openUi.setFieldValue(this.props?.formName, "Input", this.props?.name ?? "", value, true);
  }
}
