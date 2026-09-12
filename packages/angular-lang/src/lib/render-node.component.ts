import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
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

  private componentRefs: ComponentRef<unknown>[] = [];

  ngOnChanges(_changes: SimpleChanges): void {
    this.renderValue(this.value, this.library, this.context, this.formName);
  }

  ngOnDestroy(): void {
    this.destroyComponentRefs(this.componentRefs);
    this.componentRefs = [];
    this.hostElement.nativeElement.replaceChildren();
  }

  private renderValue(
    value: unknown,
    library: Library | null,
    context: OpenUiContextValue | null,
    formName: string | undefined,
  ): void {
    const stagingHost = this.renderer.createElement("openui-staging-host") as HTMLElement;
    this.renderer.setStyle(stagingHost, "display", "contents");
    const nextComponentRefs: ComponentRef<unknown>[] = [];

    try {
      this.appendValue(stagingHost, value, library, context, formName, nextComponentRefs);

      const nextChildren = Array.from(stagingHost.childNodes);
      this.destroyComponentRefs(this.componentRefs);
      this.componentRefs = nextComponentRefs;
      this.hostElement.nativeElement.replaceChildren();
      for (const child of nextChildren) {
        this.renderer.appendChild(this.hostElement.nativeElement, child);
      }
    } catch (error) {
      this.destroyComponentRefs(nextComponentRefs);
      const message = error instanceof Error ? error.message : String(error);
      const renderError = error instanceof RenderNodeError ? error : null;
      context?.reportError?.({
        source: "runtime",
        code: "render-error",
        component: renderError?.componentName,
        statementId: renderError?.statementId,
        message,
      });
    }
  }

  private appendValue(
    parent: HTMLElement,
    value: unknown,
    library: Library | null,
    context: OpenUiContextValue | null,
    formName: string | undefined,
    componentRefs: ComponentRef<unknown>[],
  ): void {
    if (value == null) {
      return;
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      this.renderer.appendChild(parent, this.renderer.createText(String(value)));
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        this.appendValue(parent, item, library, context, formName, componentRefs);
      }
      return;
    }

    if (isElementNode(value)) {
      this.appendElementNode(parent, value, library, context, formName, componentRefs);
    }
  }

  private appendElementNode(
    parent: HTMLElement,
    node: ElementNode,
    library: Library | null,
    context: OpenUiContextValue | null,
    formName: string | undefined,
    componentRefs: ComponentRef<unknown>[],
  ): void {
    if (!library || !context) {
      return;
    }

    const componentDef = library.components[node.typeName];
    if (!componentDef) {
      return;
    }

    const childHost = this.renderer.createElement("openui-dynamic-host") as HTMLElement;
    this.renderer.setStyle(childHost, "display", "contents");
    this.renderer.appendChild(parent, childHost);

    const childInjector = Injector.create({
      providers: [
        { provide: OPENUI_CONTEXT, useValue: context },
        { provide: OPENUI_FORM_NAME, useValue: formName },
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

    let componentRef: ComponentRef<unknown> | null = null;

    try {
      componentRef = createComponent(componentDef.component as Type<unknown>, {
        environmentInjector: this.environmentInjector,
        elementInjector: childInjector,
        hostElement: childHost,
      });

      this.applicationRef.attachView(componentRef.hostView);
      componentRef.setInput("props", node.props);
      componentRef.setInput("renderNode", context.renderNode);
      componentRef.setInput("statementId", node.statementId);
      componentRef.changeDetectorRef.detectChanges();
      context.clearError?.(node.typeName, node.statementId);
      componentRefs.push(componentRef);
    } catch (error) {
      if (componentRef) {
        this.applicationRef.detachView(componentRef.hostView);
        componentRef.destroy();
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new RenderNodeError(
        `Component ${node.typeName} render failed: ${message}`,
        node.typeName,
        node.statementId,
      );
    }
  }

  private destroyComponentRefs(componentRefs: ComponentRef<unknown>[]): void {
    for (const componentRef of componentRefs) {
      this.applicationRef.detachView(componentRef.hostView);
      componentRef.destroy();
    }
  }
}
