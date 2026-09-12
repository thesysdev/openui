import { Component, Input } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import type { OpenUIError } from "@openuidev/lang-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod/v4";
import { createLibrary, defineComponent } from "./library";
import { OpenUiRendererComponent } from "./renderer.component";

@Component({
  selector: "maybe-crash",
  standalone: true,
  template: `<p class="content">{{ displayText() }}</p>`,
})
class MaybeCrashComponent {
  @Input() props: { text: string; crash?: boolean } | null = null;
  @Input() renderNode: ((value: unknown) => unknown) | null = null;
  @Input() statementId: string | undefined = undefined;

  displayText(): string {
    if (this.props?.crash) {
      throw new Error("boom");
    }
    return this.props?.text ?? "";
  }
}

describe("OpenUiRendererComponent render error handling", () => {
  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [OpenUiRendererComponent],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it("reports structured render errors, preserves the last good render, and recovers cleanly", async () => {
    const MaybeCrash = defineComponent({
      name: "MaybeCrash",
      description: "Renders text unless crash is enabled",
      props: z.object({
        text: z.string(),
        crash: z.boolean().optional(),
      }),
      component: MaybeCrashComponent,
    });

    const library = createLibrary({
      components: [MaybeCrash],
      root: "MaybeCrash",
    });

    const fixture = TestBed.createComponent(OpenUiRendererComponent);
    const receivedErrors: OpenUIError[][] = [];
    fixture.componentInstance.error.subscribe((errors) => {
      receivedErrors.push(errors);
    });

    fixture.componentRef.setInput("library", library);
    fixture.componentRef.setInput("response", 'root = MaybeCrash("still here", false)');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("still here");
    expect(receivedErrors.at(-1)).toEqual([]);

    fixture.componentRef.setInput("response", 'root = MaybeCrash("still here", true)');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("still here");
    expect(receivedErrors.at(-1)).toEqual([
      expect.objectContaining({
        source: "runtime",
        code: "render-error",
        component: "MaybeCrash",
        message: expect.stringContaining("boom"),
      }),
    ]);

    fixture.componentRef.setInput("response", 'root = MaybeCrash("recovered", false)');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain("recovered");
    expect(receivedErrors.at(-1)).toEqual([]);
  });
});
