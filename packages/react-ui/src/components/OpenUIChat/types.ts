import type { Library } from "@openuidev/react-lang";
import type { AssistantMessage, UserMessage } from "@openuidev/react-headless";
import { ReactNode } from "react";
import { ScrollVariant } from "../../hooks/useScrollToBottom";
import { ConversationStarterProps } from "../../types/ConversationStarter";

/**
 * Custom component for rendering assistant messages.
 * When provided, replaces the default assistant message rendering entirely
 * (including the container with avatar).
 *
 * @example
 * const MyAssistantMessage: AssistantMessageComponent = ({ message }) => (
 *   <div className="my-assistant-message">
 *     <ReactMarkdown>{message.content ?? ""}</ReactMarkdown>
 *   </div>
 * );
 */
export type AssistantMessageComponent = React.ComponentType<{
  message: AssistantMessage;
}>;

/**
 * Custom component for rendering user messages.
 * When provided, replaces the default user message rendering entirely
 * (including the container).
 *
 * @example
 * const MyUserMessage: UserMessageComponent = ({ message }) => (
 *   <div className="my-user-message">
 *     {typeof message.content === "string" ? message.content : "..."}
 *   </div>
 * );
 */
export type UserMessageComponent = React.ComponentType<{
  message: UserMessage;
}>;

/**
 * Welcome message configuration for OpenUIChat.
 *
 * Can be either:
 * - A custom React component that will be wrapped with WelcomeScreen for styling
 * - An object with title, description, and optional image
 *
 * @example
 * // Props-based configuration
 * const welcomeMessage: WelcomeMessageConfig = {
 *   title: "Hi, I'm AI Assistant",
 *   description: "I can help you with your questions.",
 *   image: { url: "/logo.png" }, // or a ReactNode for custom styling
 * };
 *
 * @example
 * // Custom component
 * const MyCustomWelcome = () => <div>Custom welcome content</div>;
 * const welcomeMessage: WelcomeMessageConfig = MyCustomWelcome;
 */
export type WelcomeMessageConfig =
  | React.ComponentType<any>
  | {
      /** Title text displayed in the welcome screen */
      title?: string;
      /** Description text displayed below the title */
      description?: string;
      /**
       * Image to display in the welcome screen.
       * - `{ url: string }` - Renders with default 64x64 size, rounded corners
       * - `ReactNode` - Full control over styling (e.g., `<img />`, `<Sparkles />`)
       */
      image?: { url: string } | ReactNode;
    };

/**
 * Configuration for conversation starters in OpenUIChat.
 *
 * Conversation starters are clickable prompts shown when the thread is empty,
 * helping users begin a conversation with predefined options.
 *
 * @example
 * const starters: ConversationStartersConfig = {
 *   variant: "short", // "short" for pill buttons, "long" for list items
 *   options: [
 *     { displayText: "Help me get started", prompt: "Help me get started" },
 *     { displayText: "What can you do?", prompt: "What can you do?", icon: <Sparkles /> },
 *   ],
 * };
 */
export interface ConversationStartersConfig {
  /**
   * Visual variant for the conversation starters.
   * - `"short"` - Pill-style buttons that wrap horizontally (default)
   * - `"long"` - Vertical list with separators and hover arrows
   */
  variant?: "short" | "long";
  /**
   * Array of conversation starter options.
   * Each option has displayText, prompt, and optional icon.
   */
  options: ConversationStarterProps[];
}

/**
 * Props passed to a custom composer component.
 */
export type ComposerProps = {
  onSend: (message: string) => void;
  onCancel: () => void;
  isRunning: boolean;
  isLoadingMessages: boolean;
};

/**
 * Custom component for the message input area.
 * When provided, replaces the default composer entirely.
 */
export type ComposerComponent = React.ComponentType<ComposerProps>;

/**
 * Shared UI props for all chat layout variants (FullScreen, Copilot, BottomTray).
 */
export interface SharedChatUIProps {
  logoUrl?: string;
  agentName?: string;
  messageLoading?: React.ComponentType;
  scrollVariant?: ScrollVariant;
  isArtifactActive?: boolean;
  renderArtifact?: () => React.ReactNode;
  welcomeMessage?: WelcomeMessageConfig;
  conversationStarters?: ConversationStartersConfig;
  assistantMessage?: AssistantMessageComponent;
  userMessage?: UserMessageComponent;
  composer?: ComposerComponent;
  /**
   * Component library created via `createLibrary()` from `@openuidev/react-lang`.
   * When provided, assistant messages are rendered using the GenUI `Renderer`
   * instead of the default markdown renderer. If `assistantMessage` is also
   * provided, `assistantMessage` takes priority.
   */
  componentLibrary?: Library;
}
