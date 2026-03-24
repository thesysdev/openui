import type { AssistantMessage, UserMessage } from "@openuidev/react-headless";

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
