import { Component, Input } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { injectOpenUiContext, injectTriggerAction } from "./context";
import { createLibrary, defineComponent } from "./library";
import { OpenUiRenderNodeComponent } from "./render-node.component";
import { OpenUiRendererComponent } from "./renderer.component";

@Component({
  selector: "test-title",
  standalone: true,
  template: `<p class="title">{{ props?.text }}</p>`,
})
class TestTitleComponent {
  @Input() props: { text: string } | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined = undefined;
}

@Component({
  selector: "test-stack",
  standalone: true,
  imports: [OpenUiRenderNodeComponent],
  template: `
    <section class="stack">
      <openui-render-node
        [value]="renderNode ? renderNode(props?.children) : props?.children"
        [library]="context.library"
        [context]="context"
      />
    </section>
  `,
})
class TestStackComponent {
  @Input() props: { children: unknown[] } | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined = undefined;
  protected readonly context = injectOpenUiContext();
}

@Component({
  selector: "test-btn",
  standalone: true,
  template: `<button (click)="trigger(props?.label ?? '', undefined, props?.action)">x</button>`,
})
class TestBtnComponent {
  @Input() props: { label: string; action?: any } | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined = undefined;
  protected readonly trigger = injectTriggerAction();
}

describe("OpenUiRendererComponent", () => {
  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [OpenUiRendererComponent],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("delivers a bare @ToAssistant step", async () => {
    const Btn = defineComponent({
      name: "Btn",
      description: "",
      props: z.object({ label: z.string(), action: z.any().optional() }),
      component: TestBtnComponent,
    });
    const library = createLibrary({ components: [Btn], root: "Btn" });

    const fixture = TestBed.createComponent(OpenUiRendererComponent);
    const events: Array<{ type: string; humanFriendlyMessage: string }> = [];
    fixture.componentInstance.action.subscribe((e) => events.push(e));
    fixture.componentRef.setInput("library", library);
    fixture.componentRef.setInput("response", 'root = Btn("x", @ToAssistant("Hi"))');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.nativeElement.querySelector("button").click();
    await fixture.whenStable();
    expect(events.map((e) => [e.type, e.humanFriendlyMessage])).toEqual([
      ["continue_conversation", "Hi"],
    ]);
  });

  it("renders a simple root component from OpenUI source", async () => {
    const Title = defineComponent({
      name: "Title",
      description: "Simple title text",
      props: z.object({
        text: z.string(),
      }),
      component: TestTitleComponent,
    });

    const library = createLibrary({
      components: [Title],
      root: "Title",
    });

    const fixture = TestBed.createComponent(OpenUiRendererComponent);
    fixture.componentRef.setInput("library", library);
    fixture.componentRef.setInput("response", 'root = Title("Hello Angular")');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("Hello Angular");
  });

  it("renders nested component references through openui-render-node", async () => {
    const Title = defineComponent({
      name: "Title",
      description: "Simple title text",
      props: z.object({
        text: z.string(),
      }),
      component: TestTitleComponent,
    });

    const Stack = defineComponent({
      name: "Stack",
      description: "Vertical layout",
      props: z.object({
        children: z.array(z.union([Title.ref])),
      }),
      component: TestStackComponent,
    });

    const library = createLibrary({
      components: [Title, Stack],
      root: "Stack",
    });

    const fixture = TestBed.createComponent(OpenUiRendererComponent);
    fixture.componentRef.setInput("library", library);
    fixture.componentRef.setInput(
      "response",
      'root = Stack([title1])\ntitle1 = Title("Nested content")',
    );
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("Nested content");
  });

  it("emits structured parser errors for invalid source", async () => {
    const Title = defineComponent({
      name: "Title",
      description: "Simple title text",
      props: z.object({
        text: z.string(),
      }),
      component: TestTitleComponent,
    });

    const library = createLibrary({
      components: [Title],
      root: "Title",
    });

    const fixture = TestBed.createComponent(OpenUiRendererComponent);
    const receivedErrors: Array<{ code: string; message: string }> = [];
    const receivedResults: Array<unknown> = [];

    fixture.componentInstance.error.subscribe((errors) => {
      receivedErrors.push(...errors.map((error) => ({ code: error.code, message: error.message })));
    });

    fixture.componentInstance.parseResult.subscribe((result) => {
      receivedResults.push(result);
    });

    fixture.componentRef.setInput("library", library);
    fixture.componentRef.setInput("response", 'root = Ghost("missing")');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(receivedResults.some((result) => result !== null && typeof result === "object")).toBe(
      true,
    );
    expect(receivedErrors.some((error) => error.code === "unknown-component")).toBe(true);
  });
});
