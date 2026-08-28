import type { AssistantMessage, ChatProviderProps, UserMessage } from "@openuidev/react-headless";
import { ChatProvider } from "@openuidev/react-headless";
import type { Library } from "@openuidev/react-lang";
import { useMemo } from "react";
import { ThemeProps, ThemeProvider } from "../ThemeProvider";
import { GenUIAssistantMessage } from "./GenUIAssistantMessage";
import { GenUIUserMessage } from "./GenUIUserMessage";
import type { SharedChatUIProps } from "./types";

type ThemeWrapperProps = {
  theme?: ThemeProps;
  disableThemeProvider?: boolean;
};

export type ChatLayoutProps<Extra = {}> = Omit<ChatProviderProps, "children"> &
  SharedChatUIProps &
  ThemeWrapperProps &
  Extra;

const DummyThemeProvider = ({ children }: { children: React.ReactNode }) => children;

export function withChatProvider<ExtraProps = {}>(WrappedComponent: React.ComponentType<any>) {
  const WithChatProvider = (props: ChatLayoutProps<ExtraProps>) => {
    const {
      storage,
      llm,
      artifactRenderers,
      artifactCategories,
      artifactAutoOpen,
      theme,
      disableThemeProvider,
      ...innerProps
    } = props as ChatLayoutProps<ExtraProps>;

    const sharedUIProps = innerProps as SharedChatUIProps;
    const componentLibrary = sharedUIProps.componentLibrary as Library | undefined;
    const customAssistantMessage = sharedUIProps.assistantMessage;
    const customUserMessage = sharedUIProps.userMessage;

    const genUIAssistantMessage = useMemo(() => {
      if (customAssistantMessage || !componentLibrary) return undefined;
      return ({ message, isStreaming }: { message: AssistantMessage; isStreaming: boolean }) => (
        <GenUIAssistantMessage
          message={message}
          library={componentLibrary}
          isStreaming={isStreaming}
        />
      );
    }, [customAssistantMessage, componentLibrary]);

    const genUIUserMessage = useMemo(() => {
      if (customUserMessage || !componentLibrary) return undefined;
      return ({ message }: { message: UserMessage }) => <GenUIUserMessage message={message} />;
    }, [customUserMessage, componentLibrary]);

    const finalInnerProps: Record<string, unknown> = { ...innerProps };
    if (genUIAssistantMessage && !customAssistantMessage) {
      finalInnerProps["assistantMessage"] = genUIAssistantMessage;
    }
    if (genUIUserMessage && !customUserMessage) {
      finalInnerProps["userMessage"] = genUIUserMessage;
    }

    const ThemeProviderComponent = disableThemeProvider ? DummyThemeProvider : ThemeProvider;

    return (
      <ThemeProviderComponent {...theme}>
        <ChatProvider
          storage={storage}
          llm={llm}
          artifactRenderers={artifactRenderers}
          artifactCategories={artifactCategories}
          artifactAutoOpen={artifactAutoOpen}
        >
          <WrappedComponent {...finalInnerProps} />
        </ChatProvider>
      </ThemeProviderComponent>
    );
  };

  WithChatProvider.displayName = `withChatProvider(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return WithChatProvider;
}
