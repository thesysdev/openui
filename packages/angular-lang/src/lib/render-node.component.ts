import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  DestroyableInjector,
  ElementRef,
  EnvironmentInjector,
  ErrorHandler,
  Injector,
  Input,
  OnChanges,
  OnDestroy,
  Renderer2,
  SimpleChanges,
  Type,
  createComponent,
  inject,
} from "@angular/core";
import type { ElementNode } from "@openuidev/lang-core";
import type { OpenUiContextValue } from "./context";
import type { Library } from "./library";
import { OPENUI_CONTEXT, OPENUI_FORM_NAME } from "./tokens";

function isElementNode(value: unknown): value is ElementNode {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const node = value as Record<string, unknown>;
  return (
    node["type"] === "element" &&
    typeof node["typeName"] === "string" &&
    typeof node["props"] === "object" &&
    node["props"] !== null &&
    typeof node["partial"] === "boolean"
  );
}

class RenderNodeError extends Error {
  constructor(
    message: string,
    readonly componentName?: string,
    readonly statementId?: string,
  ) {
    super(message);
    this.name = "RenderNodeError";
  }
}

interface RenderedEntry {
  key: string;
  host: Node;
  component?: {
    ref: ComponentRef<unknown>;
    injector: DestroyableInjector;
    type: Type<unknown>;
    node: ElementNode;
    context: OpenUiContextValue;
    formName: string | undefined;
  };
}

interface RenderValue {
  key: string;
  value: string | ElementNode;
}

@Component({
  selector: "openui-render-node",
  standalone: true,
  template: "",
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenUiRenderNodeComponent implements OnChanges, OnDestroy {
  @Input() value: unknown = null;
  @Input() library: Library | null = null;
  @Input() context: OpenUiContextValue | null = null;
  @Input() formName: string | undefined = undefined;

  private readonly applicationRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly hostElement = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);
  private readonly renderer = inject(Renderer2);

  private entries: RenderedEntry[] = [];

  ngOnChanges(_changes: SimpleChanges): void {
    this.renderValue();
  }

  ngOnDestroy(): void {
    this.entries.forEach((entry) => this.destroyEntry(entry));
    this.entries = [];
    this.hostElement.nativeElement.replaceChildren();
  }

  private flattenValue(value: unknown): RenderValue[] {
    const result: RenderValue[] = [];
    const occurrences = new Map<string, number>();
    const visit = (item: unknown, path: number[]): void => {
      if (Array.isArray(item)) {
        item.forEach((child, index) => visit(child, [...path, index]));
      } else if (isElementNode(item)) {
        let key = JSON.stringify(["position", path]);
        if (item.statementId !== undefined) {
          const occurrence = occurrences.get(item.statementId) ?? 0;
          occurrences.set(item.statementId, occurrence + 1);
          key = JSON.stringify(["statement", item.statementId, occurrence]);
        }
        result.push({ key, value: item });
      } else if (
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "boolean"
      ) {
        result.push({ key: JSON.stringify(["position", path]), value: String(item) });
      }
    };
    visit(value, []);
    return result;
  }

  private renderValue(): void {
    const previous = new Map(this.entries.map((entry) => [entry.key, entry]));
    const next: RenderedEntry[] = [];
    const created: RenderedEntry[] = [];
    const updated: RenderedEntry[] = [];
    const nodeUpdates = new Map<RenderedEntry, ElementNode>();
    const textUpdates = new Map<RenderedEntry, string>();

    try {
      for (const { key, value } of this.flattenValue(this.value)) {
        const old = previous.get(key);
        if (typeof value === "string") {
          const entry =
            old && !old.component ? old : { key, host: this.renderer.createText(value) as Node };
          textUpdates.set(entry, value);
          next.push(entry);
          continue;
        }

        const type = this.library?.components[value.typeName]?.component as
          Type<unknown> | undefined;
        if (!type || !this.context) continue;

        let entry: RenderedEntry;
        if (
          old?.component &&
          old.component.type === type &&
          old.component.node.typeName === value.typeName &&
          old.component.context === this.context &&
          old.component.formName === this.formName
        ) {
          entry = old;
          // Record before updating: even a failed detectChanges must be rolled back.
          updated.push(entry);
        } else {
          entry = this.createEntry(key, value, type, this.context);
          created.push(entry);
        }
        this.updateEntry(entry, value);
        nodeUpdates.set(entry, value);
        next.push(entry);
      }
    } catch (error) {
      created.forEach((entry) => this.destroyEntry(entry));
      for (const entry of updated) {
        try {
          this.updateEntry(entry, entry.component!.node);
        } catch {
          // A component may also throw for its last good inputs. Keep its DOM,
          // but do not let the failed view crash subsequent application ticks.
          entry.component!.ref.changeDetectorRef.detach();
        }
      }
      const renderError = error instanceof RenderNodeError ? error : null;
      this.context?.reportError?.({
        source: "runtime",
        code: "render-error",
        component: renderError?.componentName,
        statementId: renderError?.statementId,
        message: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    const retained = new Set(next);
    for (const entry of this.entries) {
      if (!retained.has(entry)) {
        this.destroyEntry(entry);
        this.renderer.removeChild(this.hostElement.nativeElement, entry.host);
      }
    }

    // Do not detach/reinsert unchanged hosts: doing so loses input focus.
    const host = this.hostElement.nativeElement;
    let cursor = host.firstChild;
    for (const entry of next) {
      if (entry.host !== cursor) {
        this.renderer.insertBefore(host, entry.host, cursor);
      }
      cursor = entry.host.nextSibling;
      const text = textUpdates.get(entry);
      if (text !== undefined) this.renderer.setValue(entry.host, text);
      const node = nodeUpdates.get(entry);
      if (node && entry.component) {
        entry.component.node = node;
        this.context?.clearError?.(node.typeName, node.statementId);
      }
    }
    this.entries = next;
  }

  private createEntry(
    key: string,
    node: ElementNode,
    type: Type<unknown>,
    context: OpenUiContextValue,
  ): RenderedEntry {
    const host = this.renderer.createElement("openui-dynamic-host") as HTMLElement;
    this.renderer.setStyle(host, "display", "contents");
    const injector = Injector.create({
      providers: [
        { provide: OPENUI_CONTEXT, useValue: context },
        { provide: OPENUI_FORM_NAME, useValue: this.formName },
        {
          provide: ErrorHandler,
          useValue: {
            handleError(error: unknown) {
              throw error;
            },
          },
        },
      ],
      parent: this.injector,
    });
    let ref: ComponentRef<unknown> | undefined;
    try {
      ref = createComponent(type, {
        environmentInjector: this.environmentInjector,
        elementInjector: injector,
        hostElement: host,
      });
      this.applicationRef.attachView(ref.hostView);
      return {
        key,
        host,
        component: { ref, injector, type, node, context, formName: this.formName },
      };
    } catch (error) {
      if (ref) {
        this.applicationRef.detachView(ref.hostView);
        ref.destroy();
      }
      injector.destroy();
      throw this.renderError(error, node);
    }
  }

  private updateEntry(entry: RenderedEntry, node: ElementNode): void {
    const component = entry.component!;
    try {
      component.ref.setInput("props", node.props);
      component.ref.setInput("renderNode", component.context.renderNode);
      component.ref.setInput("statementId", node.statementId);
      component.ref.changeDetectorRef.reattach();
      component.ref.changeDetectorRef.detectChanges();
    } catch (error) {
      throw this.renderError(error, node);
    }
  }

  private renderError(error: unknown, node: ElementNode): RenderNodeError {
    const message = error instanceof Error ? error.message : String(error);
    return new RenderNodeError(
      `Component ${node.typeName} render failed: ${message}`,
      node.typeName,
      node.statementId,
    );
  }

  private destroyEntry(entry: RenderedEntry): void {
    if (!entry.component) return;
    this.applicationRef.detachView(entry.component.ref.hostView);
    entry.component.ref.destroy();
    entry.component.injector.destroy();
  }
}
