import { Component, Input } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod/v4";
import { injectOpenUiContext } from "./context";
import { createLibrary, defineComponent } from "./library";
import { OpenUiRendererComponent } from "./renderer.component";

@Component({
  selector: "query-display",
  standalone: true,
  template: `<p class="text">{{ props?.text }}</p>`,
})
class QueryDisplayComponent {
  @Input() props: { text: string } | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined = undefined;
}

@Component({
  selector: "loading-probe",
  standalone: true,
  template: `<p class="loading">{{ context.isQueryLoading ? "loading" : "idle" }}</p>`,
})
class LoadingProbeComponent {
  @Input() props: Record<string, never> | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined = undefined;
  protected readonly context = injectOpenUiContext();
}

@Component({
  selector: "custom-loader",
  standalone: true,
  template: `<p class="custom-loader">custom loader</p>`,
})
class CustomLoaderComponent {}

@Component({
  selector: "run-mutation",
  standalone: true,
  template: `<button class="run" (click)="run()">Run mutation</button>`,
})
class RunMutationComponent {
  @Input() props: { label: string; mutationId: string } | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined = undefined;
  private readonly context = injectOpenUiContext();

  run(): void {
    if (!this.props) return;
    void this.context.triggerAction(this.props.label, undefined, {
      steps: [{ type: "run", statementId: this.props.mutationId, refType: "mutation" }],
    });
  }
}

describe("OpenUiRendererComponent query foundation", () => {
  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [OpenUiRendererComponent],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("renders query results through toolProvider function maps", async () => {
    const Display = defineComponent({
      name: "Display",
      description: "Shows query text",
      props: z.object({
        text: z.string(),
      }),
      component: QueryDisplayComponent,
    });

    const library = createLibrary({
      components: [Display],
      root: "Display",
    });

    const fixture = TestBed.createComponent(OpenUiRendererComponent);
    fixture.componentRef.setInput("library", library);
    fixture.componentRef.setInput("toolProvider", {
      get_message: async () => "Hello from query",
    });
    fixture.componentRef.setInput(
      "response",
      'message = Query("get_message", {})\nroot = Display(message)',
    );
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("Hello from query");
  });

  it("exposes query loading state while requests are in flight", async () => {
    let resolveTool: ((value: unknown) => void) | null = null;

    const Probe = defineComponent({
      name: "Probe",
      description: "Reads query loading state",
      props: z.object({}),
      component: LoadingProbeComponent,
    });

    const library = createLibrary({
      components: [Probe],
      root: "Probe",
    });

    const fixture = TestBed.createComponent(OpenUiRendererComponent);
    fixture.componentRef.setInput("library", library);
    fixture.componentRef.setInput("queryLoader", CustomLoaderComponent);
    fixture.componentRef.setInput("toolProvider", {
      slow_tool: () =>
        new Promise((resolve) => {
          resolveTool = resolve;
        }),
    });
    fixture.componentRef.setInput("response", 'data = Query("slow_tool", {})\nroot = Probe()');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("loading");
    expect(fixture.nativeElement.textContent).toContain("custom loader");

    resolveTool?.("done");
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain("custom loader");
  });

  it("runs registered mutations through action run steps", async () => {
    const mutate = vi.fn(async (args: Record<string, unknown>) => ({ ok: true, args }));

    const Runner = defineComponent({
      name: "Runner",
      description: "Runs a mutation",
      props: z.object({
        label: z.string(),
        mutationId: z.string(),
      }),
      component: RunMutationComponent,
    });

    const library = createLibrary({
      components: [Runner],
      root: "Runner",
    });

    const fixture = TestBed.createComponent(OpenUiRendererComponent);
    fixture.componentRef.setInput("library", library);
    fixture.componentRef.setInput("toolProvider", {
      save_message: mutate,
    });
    fixture.componentRef.setInput(
      "response",
      'save = Mutation("save_message", { value: "done" })\nroot = Runner("Save", "save")',
    );
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector("button.run") as HTMLButtonElement).click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mutate).toHaveBeenCalledWith({ value: "done" });
  });
});
