import { ApplicationRef, Component, Input, OnDestroy } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import type { ElementNode } from "@openuidev/lang-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { injectFormName, injectOpenUiContext } from "./context";
import { createLibrary, defineComponent } from "./library";
import { OpenUiRenderNodeComponent } from "./render-node.component";
import { OpenUiRendererComponent } from "./renderer.component";

@Component({
  selector: "identity-input",
  standalone: true,
  template: `<input [value]="props?.value ?? ''" (input)="onInput($event)" />
    <span class="edits">{{ edits }}</span
    ><span class="form">{{ formName }}</span>`,
})
class IdentityInput implements OnDestroy {
  static destroyed = 0;
  @Input() props: { value: string } | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined = undefined;
  readonly context = injectOpenUiContext();
  readonly formName = injectFormName();
  edits = 0;

  onInput(event: Event): void {
    this.edits++;
    this.context.setFieldValue(
      undefined,
      "Input",
      "$name",
      (event.target as HTMLInputElement).value,
      false,
    );
  }

  ngOnDestroy(): void {
    IdentityInput.destroyed++;
  }
}

@Component({
  selector: "identity-stack",
  standalone: true,
  imports: [OpenUiRenderNodeComponent],
  template: `<openui-render-node
    [value]="props?.children"
    [library]="context.library"
    [context]="context"
  />`,
})
class IdentityStack {
  @Input() props: { children: unknown[] } | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined = undefined;
  readonly context = injectOpenUiContext();
}

const InputDefinition = defineComponent({
  name: "Input",
  description: "Editable state binding",
  props: z.object({ value: z.string() }),
  component: IdentityInput,
});
const StackDefinition = defineComponent({
  name: "Stack",
  description: "Nested input container",
  props: z.object({ children: z.array(InputDefinition.ref) }),
  component: IdentityStack,
});
const library = createLibrary({ components: [InputDefinition, StackDefinition] });

function node(statementId: string | undefined, value: string, typeName = "Input"): ElementNode {
  return { type: "element", typeName, statementId, partial: false, props: { value } };
}

function directRenderer(value: unknown) {
  const owner = TestBed.createComponent(OpenUiRendererComponent);
  const context = owner.componentInstance.context;
  context.library = library;
  const fixture = TestBed.createComponent(OpenUiRenderNodeComponent);
  fixture.componentRef.setInput("library", library);
  fixture.componentRef.setInput("context", context);
  fixture.componentRef.setInput("value", value);
  fixture.detectChanges();
  return { fixture, context };
}

describe("Angular node reconciliation", () => {
  beforeEach(async () => {
    TestBed.resetTestingModule();
    IdentityInput.destroyed = 0;
    await TestBed.configureTestingModule({
      imports: [OpenUiRendererComponent, OpenUiRenderNodeComponent],
    }).compileComponents();
  });
  afterEach(() => TestBed.resetTestingModule());

  it.each([
    "root = Input($name)",
    "field = Input($name)\nroot = Stack([field])",
    "root = Stack([Input($name)])",
  ])("keeps focus and local state over consecutive keystrokes: %s", async (response) => {
    const fixture = TestBed.createComponent(OpenUiRendererComponent);
    fixture.componentRef.setInput("library", library);
    fixture.componentRef.setInput("initialState", { $name: "" });
    fixture.componentRef.setInput("response", response);
    fixture.detectChanges();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;
    expect(input).not.toBeNull();
    input.focus();
    for (const value of ["a", "ab", "abc"]) {
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector("input")).toBe(input);
      expect(input.isConnected).toBe(true);
      expect(document.activeElement).toBe(input);
      expect(fixture.componentInstance.context.getFieldValue(undefined, "$name")).toBe(value);
    }
    expect(fixture.nativeElement.querySelector(".edits").textContent).toBe("3");
    expect(IdentityInput.destroyed).toBe(0);
  });

  it("updates streamed props without replacing the component", async () => {
    const fixture = TestBed.createComponent(OpenUiRendererComponent);
    fixture.componentRef.setInput("library", library);
    fixture.componentRef.setInput("isStreaming", true);
    fixture.componentRef.setInput("response", 'root = Input("a")');
    fixture.detectChanges();
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector("input") as HTMLInputElement;
    input.focus();
    fixture.componentRef.setInput("response", 'root = Input("abc")');
    fixture.componentRef.setInput("isStreaming", false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector("input")).toBe(input);
    expect(input.value).toBe("abc");
    expect(document.activeElement).toBe(input);
  });

  it("reuses statement identities through insertion/reordering and destroys removed views", () => {
    const { fixture } = directRenderer([node("a", "a"), node("b", "b")]);
    const [a, b] = Array.from(fixture.nativeElement.querySelectorAll("input"));
    fixture.componentRef.setInput("value", [node("b", "B"), node("c", "c"), node("a", "A")]);
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll("input");
    expect(inputs[0]).toBe(b);
    expect(inputs[2]).toBe(a);
    expect(inputs[2].value).toBe("A");
    expect(IdentityInput.destroyed).toBe(0);
    fixture.componentRef.setInput("value", [node("b", "B")]);
    fixture.detectChanges();
    expect(IdentityInput.destroyed).toBe(2);
    fixture.destroy();
    expect(IdentityInput.destroyed).toBe(3);
    expect(TestBed.inject(ApplicationRef).viewCount).toBe(0);
  });

  it("keeps duplicate references distinct and updates text/null/array values", () => {
    const { fixture } = directRenderer(["before", [node("same", "a"), node("same", "b")], null]);
    const before = fixture.nativeElement.firstChild;
    const inputs = Array.from(fixture.nativeElement.querySelectorAll("input"));
    expect(inputs[0]).not.toBe(inputs[1]);
    fixture.componentRef.setInput("value", [
      "after",
      [node("same", "A"), node("same", "B")],
      false,
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.firstChild).toBe(before);
    expect(before.textContent).toBe("after");
    expect(Array.from(fixture.nativeElement.querySelectorAll("input"))).toEqual(inputs);
    expect(fixture.nativeElement.textContent).toContain("false");
    fixture.componentRef.setInput("value", null);
    fixture.detectChanges();
    expect(fixture.nativeElement.childNodes.length).toBe(0);
    expect(IdentityInput.destroyed).toBe(2);
  });

  it("recreates components when their injected context, form, or definition changes", () => {
    const { fixture, context } = directRenderer(node("a", "a"));
    const original = fixture.nativeElement.querySelector("input");
    fixture.componentRef.setInput("formName", "profile");
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector("input")).not.toBe(original);
    expect(fixture.nativeElement.querySelector(".form").textContent).toBe("profile");
    fixture.componentRef.setInput("context", { ...context });
    fixture.detectChanges();
    expect(IdentityInput.destroyed).toBe(2);
    fixture.componentRef.setInput("value", {
      ...node("a", ""),
      typeName: "Stack",
      props: { children: [] },
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector("input")).toBeNull();
    expect(IdentityInput.destroyed).toBe(3);
  });
});
