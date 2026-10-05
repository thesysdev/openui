import { Component, computed, Input } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod/v4";
import {
  injectGetFieldValue,
  injectIsQueryLoading,
  injectIsStreaming,
  injectOpenUiContext,
} from "./context";
import { createLibrary, defineComponent } from "./library";
import { OpenUiRenderNodeComponent } from "./render-node.component";
import { OpenUiRendererComponent } from "./renderer.component";

@Component({
  selector: "context-probe",
  standalone: true,
  template: `
    <input aria-label="Local input" />
    <span class="field">{{ context.getFieldValue(props?.formName, "email") }}</span>
    <span class="computed-field">{{ field() }}</span>
    <span class="streaming">{{ streaming() }}</span>
    <span class="loading">{{ loading() }}</span>
    <span class="direct-streaming">{{ context.isStreaming }}</span>
    <span class="direct-loading">{{ context.isQueryLoading }}</span>
  `,
})
class ContextProbe {
  @Input() props: { formName?: string } | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined;
  readonly context = injectOpenUiContext();
  readonly getFieldValue = injectGetFieldValue();
  readonly field = computed(() => this.getFieldValue(this.props?.formName, "email"));
  readonly streaming = injectIsStreaming();
  readonly loading = injectIsQueryLoading();
}

@Component({
  selector: "probe-stack",
  standalone: true,
  imports: [OpenUiRenderNodeComponent],
  template: `<openui-render-node
    [value]="props?.children"
    [library]="context.library"
    [context]="context"
  />`,
})
class ProbeStack {
  @Input() props: { children: unknown[] } | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined;
  readonly context = injectOpenUiContext();
}

const Probe = defineComponent({
  name: "Probe",
  description: "Reads context without dynamic props",
  props: z.object({ formName: z.string().optional() }),
  component: ContextProbe,
});
const Stack = defineComponent({
  name: "Stack",
  description: "Contains context readers",
  props: z.object({ children: z.array(Probe.ref) }),
  component: ProbeStack,
});
const library = createLibrary({ components: [Probe, Stack] });

describe("reactive Angular context", () => {
  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [OpenUiRendererComponent],
    }).compileComponents();
  });
  afterEach(() => TestBed.resetTestingModule());

  it.each([
    { response: "root = Probe()", formName: undefined },
    { response: 'root = Probe("profile")', formName: "profile" },
    { response: 'root = Stack([field])\nfield = Probe("profile")', formName: "profile" },
  ])(
    "refreshes static readers and preserves their views: $response",
    async ({ response, formName }) => {
      const fixture = TestBed.createComponent(OpenUiRendererComponent);
      fixture.componentRef.setInput("library", library);
      fixture.componentRef.setInput(
        "initialState",
        formName ? { profile: { email: "before" } } : { email: "before" },
      );
      fixture.componentRef.setInput("response", response);
      fixture.detectChanges();
      await fixture.whenStable();
      const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;
      input.value = "Keep local edits";
      input.focus();
      expect(fixture.nativeElement.querySelector(".field").textContent).toBe("before");
      expect(fixture.nativeElement.querySelector(".computed-field").textContent).toBe("before");

      fixture.componentInstance.context.setFieldValue(formName, "Input", "email", "after");
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector(".field").textContent).toBe("after");
      expect(fixture.nativeElement.querySelector(".computed-field").textContent).toBe("after");
      expect(fixture.nativeElement.querySelector("input")).toBe(input);
      expect(input.value).toBe("Keep local edits");
      expect(document.activeElement).toBe(input);

      fixture.componentInstance.context.store.set(
        formName ?? "email",
        formName ? { email: "direct" } : "direct",
      );
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector(".computed-field").textContent).toBe("direct");
    },
  );

  it("updates both streaming APIs on an unchanged node across repeated transitions", async () => {
    const fixture = TestBed.createComponent(OpenUiRendererComponent);
    fixture.componentRef.setInput("library", library);
    fixture.componentRef.setInput("isStreaming", true);
    fixture.componentRef.setInput("response", "root = Probe()");
    fixture.detectChanges();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector("input");
    for (const streaming of [true, false, true, false]) {
      fixture.componentRef.setInput("isStreaming", streaming);
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector(".streaming").textContent).toBe(String(streaming));
      expect(fixture.nativeElement.querySelector(".direct-streaming").textContent).toBe(
        String(streaming),
      );
      expect(fixture.nativeElement.querySelector("input")).toBe(input);
    }
  });

  it.each(["resolve", "reject"])(
    "updates both loading APIs when a query and refetch %s",
    async (outcome) => {
      let settle!: () => void;
      const fixture = TestBed.createComponent(OpenUiRendererComponent);
      fixture.componentRef.setInput("library", library);
      fixture.componentRef.setInput("toolProvider", {
        slow: () =>
          new Promise((resolve, reject) => {
            settle = () =>
              outcome === "resolve" ? resolve("done") : reject(new Error("Request failed"));
          }),
      });
      fixture.componentRef.setInput("response", 'data = Query("slow", {})\nroot = Probe()');
      fixture.detectChanges();
      await fixture.whenStable();
      const input = fixture.nativeElement.querySelector("input");
      for (let attempt = 0; attempt < 2; attempt++) {
        expect(fixture.nativeElement.querySelector(".loading").textContent).toBe("true");
        expect(fixture.nativeElement.querySelector(".direct-loading").textContent).toBe("true");
        settle();
        await new Promise((resolve) => setTimeout(resolve, 0));
        await fixture.whenStable();
        expect(fixture.nativeElement.querySelector(".loading").textContent).toBe("false");
        expect(fixture.nativeElement.querySelector(".direct-loading").textContent).toBe("false");
        expect(fixture.nativeElement.querySelector("input")).toBe(input);
        if (attempt === 0) {
          await fixture.componentInstance.context.triggerAction("Refetch", undefined, {
            steps: [{ type: "run", statementId: "data", refType: "query" }],
          });
          await fixture.whenStable();
        }
      }
    },
  );
});
