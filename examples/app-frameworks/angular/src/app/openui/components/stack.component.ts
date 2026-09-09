import { Component, Input } from "@angular/core";
import { injectOpenUiContext, RenderNode } from "@openuidev/angular-lang";

@Component({
  selector: "demo-stack",
  standalone: true,
  imports: [RenderNode],
  template: `
    <section class="stack-shell">
      @if (props?.title) {
        <header class="stack-title">{{ props?.title }}</header>
      }
      <openui-render-node
        [value]="renderNode ? renderNode(props?.children) : props?.children"
        [library]="context.library"
        [context]="context"
      />
    </section>
  `,
  styles: [
    `
      .stack-shell {
        display: grid;
        gap: 0.85rem;
        padding: 1rem;
        border-radius: 1rem;
        background: rgba(15, 23, 42, 0.52);
        border: 1px solid rgba(148, 163, 184, 0.18);
      }

      .stack-title {
        font-weight: 700;
        color: #f8fafc;
      }
    `,
  ],
})
export class StackComponent {
  @Input() props: { title?: string; children: unknown[] } | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined = undefined;

  protected readonly context = injectOpenUiContext();
}
