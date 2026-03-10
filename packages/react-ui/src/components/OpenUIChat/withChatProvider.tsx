import type { Library } from "@openuidev/lang-react";
import type { AssistantMessage, ChatProviderProps, UserMessage } from "@openuidev/react-headless";
import { ChatProvider } from "@openuidev/react-headless";
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

const DummyThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return children;
};

const CHAT_PROVIDER_PROP_KEYS: Set<keyof Omit<ChatProviderProps, "children">> = new Set([
  "apiUrl",
  "processMessage",
  "threadApiUrl",
  "fetchThreadList",
  "createThread",
  "deleteThread",
  "updateThread",
  "loadThread",
  "streamProtocol",
  "messageFormat",
]);

export function withChatProvider<ExtraProps = {}>(WrappedComponent: React.ComponentType<any>) {
  const WithChatProvider = (props: ChatLayoutProps<ExtraProps>) => {
    const innerProps: Record<string, unknown> = {};
    const chatProviderProps: Record<string, unknown> = {};
    let theme: ThemeProps | undefined;
    let disableThemeProvider = false;

    for (const [key, value] of Object.entries(props)) {
      if (key === "theme") {
        theme = value as ThemeProps;
      } else if (key === "disableThemeProvider") {
        disableThemeProvider = value as boolean;
      } else if (CHAT_PROVIDER_PROP_KEYS.has(key as keyof Omit<ChatProviderProps, "children">)) {
        chatProviderProps[key] = value;
      } else {
        innerProps[key] = value;
      }
    }

    const componentLibrary = innerProps["componentLibrary"] as Library | undefined;
    const customAssistantMessage = innerProps["assistantMessage"];
    const customUserMessage = innerProps["userMessage"];

    const genUIAssistantMessage = useMemo(() => {
      if (customAssistantMessage || !componentLibrary) return undefined;
      return ({ message }: { message: AssistantMessage }) => (
        <GenUIAssistantMessage message={message} library={componentLibrary} />
      );
    }, [customAssistantMessage, componentLibrary]);

    const genUIUserMessage = useMemo(() => {
      if (customUserMessage || !componentLibrary) return undefined;
      return ({ message }: { message: UserMessage }) => <GenUIUserMessage message={message} />;
    }, [customUserMessage, componentLibrary]);

    if (genUIAssistantMessage && !customAssistantMessage) {
      innerProps["assistantMessage"] = genUIAssistantMessage;
    }
    if (genUIUserMessage && !customUserMessage) {
      innerProps["userMessage"] = genUIUserMessage;
    }

    const ThemeProviderComponent = disableThemeProvider ? DummyThemeProvider : ThemeProvider;

    return (
      <ThemeProviderComponent {...theme}>
        <ChatProvider {...(chatProviderProps as any)}>
          <WrappedComponent {...innerProps} />
        </ChatProvider>
      </ThemeProviderComponent>
    );
  };

  WithChatProvider.displayName = `withChatProvider(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;

  return WithChatProvider;
}
