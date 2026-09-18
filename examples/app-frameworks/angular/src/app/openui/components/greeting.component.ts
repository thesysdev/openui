import { Component, Input } from "@angular/core";

@Component({
  selector: "demo-greeting",
  standalone: true,
  template: `<p class="greeting">{{ props?.text }}</p>`,
  styles: [
    `
      .greeting {
        margin: 0;
        padding: 0.9rem 1rem;
        border-radius: 0.9rem;
        background: rgba(59, 130, 246, 0.14);
        border: 1px solid rgba(96, 165, 250, 0.3);
        color: #eff6ff;
      }
    `,
  ],
})
export class GreetingComponent {
  @Input() props: { text: string } | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined = undefined;
}
