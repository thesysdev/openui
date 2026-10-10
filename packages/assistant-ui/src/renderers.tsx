"use client";

import {
  useAui,
  type ToolCallMessagePartComponent,
  type ToolCallMessagePartProps,
} from "@assistant-ui/react";
import {
  BuiltinActionType,
  Renderer,
  type ActionEvent,
  type Library,
  type OpenUIError,
  type RendererProps,
} from "@openuidev/react-lang";
import { openuiChatLibrary, ThemeProvider, type ThemeProps } from "@openuidev/react-ui";
import { useCallback, useRef, useState, type ComponentType } from "react";

export interface OpenUIToolArgs extends Record<string, unknown> {
  ui: string;
}

export interface OpenUIPresentResult {
  displayed: true;
}

export interface OpenUIActionResult {
  type: BuiltinActionType.ContinueConversation;
  message: string;
  params: Record<string, unknown>;
  formState?: Record<string, unknown>;
  formName?: string;
}

export type OpenUIErrorFallback = ComponentType<{
  errors: readonly OpenUIError[];
}>;

export type OpenUIRendererProps = Omit<
  RendererProps,
  "response" | "library" | "isStreaming" | "initialState" | "onAction" | "onError"
>;

export interface OpenUIToolUIOptions {
  library?: Library;
  rendererProps?: OpenUIRendererProps;
  /** Theme props passed to <ThemeProvider>. */
  theme?: ThemeProps;
  /** When true, skips wrapping in <ThemeProvider>. */
  disableThemeProvider?: boolean;
  ErrorFallback?: OpenUIErrorFallback | null;
  onError?: (errors: OpenUIError[]) => void;
}

export interface OpenUIContentProps extends OpenUIToolUIOptions {
  response: string;
  isStreaming: boolean;
  initialState?: Record<string, unknown>;
  onAction?: (event: ActionEvent) => void;
}

export const DefaultOpenUIErrorFallback: OpenUIErrorFallback = () => (
  <div role="alert">OpenUI could not render this response.</div>
);

export function OpenUIContent({
  response,
  isStreaming,
  initialState,
  onAction,
  library = openuiChatLibrary,
  rendererProps,
  theme,
  disableThemeProvider,
  ErrorFallback = DefaultOpenUIErrorFallback,
  onError,
}: OpenUIContentProps) {
  const [errors, setErrors] = useState<OpenUIError[]>([]);
  const handleError = useCallback(
    (nextErrors: OpenUIError[]) => {
      setErrors(nextErrors);
      onError?.(nextErrors);
    },
    [onError],
  );

  // Warnings (a program without `root` whose entry renders) are not render failures.
  const failures = errors.filter((error) => error.severity !== "warning");

  const content = (
    <>
      <Renderer
        {...rendererProps}
        response={response}
        library={library}
        isStreaming={isStreaming}
        onError={handleError}
        {...(initialState !== undefined && { initialState })}
        {...(onAction !== undefined && { onAction })}
      />
      {!isStreaming && failures.length > 0 && ErrorFallback !== null && (
        <ErrorFallback errors={failures} />
      )}
    </>
  );

  return disableThemeProvider ? content : <ThemeProvider {...theme}>{content}</ThemeProvider>;
}

export type OpenUIPresentProps = ToolCallMessagePartProps<OpenUIToolArgs, OpenUIPresentResult> &
  OpenUIToolUIOptions;

export function OpenUIPresent({ args, status, ...options }: OpenUIPresentProps) {
  const aui = useAui();
  const onAction = useCallback(
    (event: ActionEvent) => {
      if (event.type === BuiltinActionType.ContinueConversation) {
        aui.thread.append({
          role: "user",
          content: [{ type: "text", text: event.humanFriendlyMessage }],
        });
      } else if (event.type === BuiltinActionType.OpenUrl) {
        const url = event.params?.["url"];
        if (typeof window !== "undefined" && typeof url === "string") {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      }
    },
    [aui],
  );

  return (
    <OpenUIContent
      {...options}
      response={args.ui ?? ""}
      isStreaming={status.type === "running"}
      onAction={onAction}
    />
  );
}

export type OpenUIPromptProps = ToolCallMessagePartProps<OpenUIToolArgs, OpenUIActionResult> &
  OpenUIToolUIOptions;

export function OpenUIPrompt({ args, status, result, addResult, ...options }: OpenUIPromptProps) {
  const completed = useRef(result !== undefined);
  const onAction = (event: ActionEvent) => {
    if (
      result !== undefined ||
      completed.current ||
      event.type !== BuiltinActionType.ContinueConversation
    ) {
      return;
    }

    completed.current = true;
    try {
      addResult({
        type: BuiltinActionType.ContinueConversation,
        message: event.humanFriendlyMessage,
        params: event.params,
        ...(event.formState !== undefined && { formState: event.formState }),
        ...(event.formName !== undefined && { formName: event.formName }),
      });
    } catch (error) {
      completed.current = false;
      throw error;
    }
  };

  return (
    <OpenUIContent
      {...options}
      response={args.ui ?? ""}
      isStreaming={status.type === "running"}
      onAction={onAction}
      {...(result?.formState !== undefined && {
        initialState: result.formState,
      })}
    />
  );
}

export function createOpenUIPresent(
  options: OpenUIToolUIOptions = {},
): ToolCallMessagePartComponent<OpenUIToolArgs, OpenUIPresentResult> {
  return function ConfiguredOpenUIPresent(props) {
    return <OpenUIPresent {...props} {...options} />;
  };
}

export function createOpenUIPrompt(
  options: OpenUIToolUIOptions = {},
): ToolCallMessagePartComponent<OpenUIToolArgs, OpenUIActionResult> {
  return function ConfiguredOpenUIPrompt(props) {
    return <OpenUIPrompt {...props} {...options} />;
  };
}
