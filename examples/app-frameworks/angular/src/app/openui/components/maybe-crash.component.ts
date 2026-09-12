import { Component, Input } from "@angular/core";

@Component({
  selector: "demo-maybe-crash",
  standalone: true,
  template: `<p class="crash-content">{{ displayText() }}</p>`,
  styles: [
    `
      .crash-content {
        margin: 0;
        padding: 1rem;
        border-radius: 0.9rem;
        background: rgba(244, 63, 94, 0.14);
        border: 1px solid rgba(251, 113, 133, 0.35);
      }
    `,
  ],
})
export class MaybeCrashComponent {
  @Input() props: { text: string; crash?: boolean } | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined = undefined;

  displayText(): string {
    if (this.props?.crash) {
      throw new Error("Intentional render crash for smoke testing");
    }

    return this.props?.text ?? "";
  }
}
