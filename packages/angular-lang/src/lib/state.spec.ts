import { Component, Input } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { injectOpenUiContext } from "./context";
import { createLibrary, defineComponent } from "./library";
import { OpenUiRendererComponent } from "./renderer.component";

@Component({
  selector: "state-reader",
  standalone: true,
  template: `<p class="value">{{ readValue() }}</p>`,
})
class StateReaderComponent {
  @Input() props: { formName?: string; fieldName: string } | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined = undefined;

  private readonly context = injectOpenUiContext();

  readValue(): string {
    const value = this.context.getFieldValue(this.props?.formName, this.props?.fieldName ?? "");
    return value == null ? "" : String(value);
  }
}

@Component({
  selector: "field-writer",
  standalone: true,
  template: `<button class="write" (click)="write()">Write</button>`,
})
class FieldWriterComponent {
  @Input() props: { formName?: string; fieldName: string; value: string } | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined = undefined;

  private readonly context = injectOpenUiContext();

  write(): void {
    if (!this.props) return;
    this.context.setFieldValue(
      this.props.formName,
      "Input",
      this.props.fieldName,
      this.props.value,
      true,
    );
  }
}

@Component({
  selector: "action-trigger",
  standalone: true,
  template: `<button class="fire" (click)="fire()">Fire</button>`,
})
class ActionTriggerComponent {
  @Input() props: {
    label: string;
    formName?: string;
    action?: { type?: string; params?: Record<string, unknown> } | { steps: unknown[] };
  } | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined = undefined;

  private readonly context = injectOpenUiContext();

  fire(): void {
    if (!this.props) return;
    void this.context.triggerAction(
      this.props.label,
      this.props.formName,
      this.props.action as any,
    );
  }
}

describe("OpenUiRendererComponent state foundation", () => {
  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [OpenUiRendererComponent],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("hydrates initial form state and exposes it through getFieldValue", async () => {
    const Reader = defineComponent({
      name: "Reader",
      description: "Reads a field from state",
      props: z.object({
        formName: z.string().optional(),
        fieldName: z.string(),
      }),
      component: StateReaderComponent,
    });

    const library = createLibrary({
      components: [Reader],
      root: "Reader",
    });

    const fixture = TestBed.createComponent(OpenUiRendererComponent);
    fixture.componentRef.setInput("library", library);
    fixture.componentRef.setInput("initialState", {
      profile: {
        email: { value: "ada@example.com", componentType: "Input" },
      },
    });
    fixture.componentRef.setInput("response", 'root = Reader("profile", "email")');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("ada@example.com");
  });

  it("emits stateUpdate when a component writes field state", async () => {
    const Writer = defineComponent({
      name: "Writer",
      description: "Writes a field value",
      props: z.object({
        formName: z.string().optional(),
        fieldName: z.string(),
        value: z.string(),
      }),
      component: FieldWriterComponent,
    });

    const library = createLibrary({
      components: [Writer],
      root: "Writer",
    });

    const fixture = TestBed.createComponent(OpenUiRendererComponent);
    const snapshots: Record<string, unknown>[] = [];
    fixture.componentInstance.stateUpdate.subscribe((state) => snapshots.push(state));

    fixture.componentRef.setInput("library", library);
    fixture.componentRef.setInput(
      "response",
      'root = Writer("profile", "email", "grace@example.com")',
    );
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector("button.write") as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(snapshots.at(-1)).toEqual({
      profile: {
        email: {
          value: "grace@example.com",
          componentType: "Input",
        },
      },
    });
  });

  it("emits default action events with current form payload", async () => {
    const Trigger = defineComponent({
      name: "Trigger",
      description: "Triggers an action",
      props: z.object({
        label: z.string(),
        formName: z.string().optional(),
      }),
      component: ActionTriggerComponent,
    });

    const library = createLibrary({
      components: [Trigger],
      root: "Trigger",
    });

    const fixture = TestBed.createComponent(OpenUiRendererComponent);
    const events: Array<{
      type: string;
      formState?: Record<string, unknown>;
      humanFriendlyMessage: string;
    }> = [];
    fixture.componentInstance.action.subscribe((event) => {
      events.push({
        type: String(event.type),
        formState: event.formState,
        humanFriendlyMessage: event.humanFriendlyMessage,
      });
    });

    fixture.componentRef.setInput("library", library);
    fixture.componentRef.setInput("initialState", {
      profile: {
        email: { value: "linus@example.com", componentType: "Input" },
      },
    });
    fixture.componentRef.setInput("response", 'root = Trigger("Submit", "profile")');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    (fixture.nativeElement.querySelector("button.fire") as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(events.at(-1)).toEqual({
      type: "continue_conversation",
      humanFriendlyMessage: "Submit",
      formState: {
        profile: {
          email: { value: "linus@example.com", componentType: "Input" },
        },
      },
    });
  });
});
