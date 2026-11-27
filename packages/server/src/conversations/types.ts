import type { BaseMessage, MessageContent, ToolCall } from "@langchain/core/messages";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { CloudList, RequestOptions } from "../core/resource";

/**
 * A conversation belongs to a user, in the client's app, so creating one needs them.
 */
export interface ConversationUserOptions extends RequestOptions {
  /** The owner, from your session. Never take it from the browser. */
  userId: string;
}

/** Up to 16 pairs: keys up to 64 characters, values up to 512. */
export type ConversationMetadata = Record<string, string>;

/** A saved conversation. Its messages and tool calls are its items. */
export interface CloudConversation {
  id: string;
  title?: string;
  metadata?: ConversationMetadata;
  /** The user it belongs to. Absent when your org made it without one. */
  userId?: string;
  /** That user's app. */
  appId?: string;
  /** Unix milliseconds. */
  createdAt: number;
}

/** One page of conversations, newest first. */
export type CloudConversationList = CloudList<CloudConversation>;

export interface ListConversationsParams extends RequestOptions {
  /** Only this user's conversations, in every app. From your session, never the browser. */
  userId?: string;
  /** Page size, 1 to 100. */
  limit?: number;
  /** The page after this id: the last page's `lastId`. */
  after?: string;
  /** The page before this id: the last page's `firstId`. */
  before?: string;
}

export interface CreateConversationParams {
  title?: string;
  metadata?: ConversationMetadata;
}

export type UpdateConversationParams = CreateConversationParams;

export type ConversationItemStatus =
  "in_progress" | "completed" | "incomplete" | "failed" | "searching" | "calling";

/**
 * A part of a message: `{ type: "input_text", text }` or `input_image` from the user,
 * `{ type: "output_text", text }` or `refusal` from the assistant.
 */
export interface ConversationContentPart {
  type: string;
  text?: string;
  [field: string]: unknown;
}

/** A message to add. System messages can't be stored: they're instructions, not history. */
export interface ConversationMessageInput {
  type: "message";
  role: "user" | "assistant";
  content: string | ConversationContentPart[];
  status?: ConversationItemStatus;
}

export interface ConversationFunctionCallInput {
  type: "function_call";
  call_id: string;
  name: string;
  /** JSON, as the model wrote it. */
  arguments: string;
  status?: ConversationItemStatus;
}

export interface ConversationFunctionCallOutputInput {
  type: "function_call_output";
  call_id: string;
  output: string;
  status?: ConversationItemStatus;
}

/**
 * An item to add, in OpenAI's Conversations API shape: one read back can be added as is.
 * Chat Completions and LangGraph messages go through `openui.chat` and `openui.langgraph`.
 */
export type ConversationItemInput =
  | ConversationMessageInput
  | ConversationFunctionCallInput
  | ConversationFunctionCallOutputInput
  | { type?: string | null };

/** What every stored item has. OpenAI's shape: snake_case, `created_at` in unix seconds. */
interface ConversationItemBase {
  id: string;
  object: "conversation.item";
  conversation_id: string;
  /** Unix seconds. */
  created_at?: number;
  status?: ConversationItemStatus;
  metadata?: Record<string, unknown>;
}

export interface ConversationMessage extends ConversationItemBase {
  type: "message";
  role: "user" | "assistant" | "system";
  content: string | ConversationContentPart[];
}

export interface ConversationFunctionCall extends ConversationItemBase {
  type: "function_call";
  call_id: string;
  name: string;
  arguments: string;
}

export interface ConversationFunctionCallOutput extends ConversationItemBase {
  type: "function_call_output";
  call_id: string;
  name?: string;
  output?: unknown;
}

/** Items from OpenAI's hosted tools and reasoning. Their fields follow OpenAI's item types. */
export interface ConversationOtherItem extends ConversationItemBase {
  type:
    | "reasoning"
    | "web_search_call"
    | "image_search_call"
    | "knowledge_search_call"
    | "mcp_list_tools"
    | "mcp_approval_request"
    | "mcp_approval_response"
    | "mcp_call"
    | "artifact_call"
    | "unknown";
  [field: string]: unknown;
}

/** A stored item: narrow on `type`. */
export type ConversationItem =
  | ConversationMessage
  | ConversationFunctionCall
  | ConversationFunctionCallOutput
  | ConversationOtherItem;

/** One page of items, newest first unless you ask for `order: "asc"`. */
export type ConversationItemList = CloudList<ConversationItem>;

export interface ListConversationItemsParams extends RequestOptions {
  /** Page size, 1 to 100. */
  limit?: number;
  /** The page after this id: the last page's `lastId`. */
  after?: string;
  /** The page before this id: the last page's `firstId`. */
  before?: string;
  /** `"asc"` reads a thread from its start, to replay it to a model. */
  order?: "asc" | "desc";
}

/** Only an item's content and status change. */
export interface UpdateConversationItemParams {
  /** The new content, in the item's own shape: a message's string or parts. */
  content?: unknown;
  status?: ConversationItemStatus;
}

/** A conversation's messages and tool calls. */
export interface ConversationItems {
  list(id: string, params?: ListConversationItemsParams): Promise<ConversationItemList>;
  /**
   * Adds items in order and resolves with them as stored. Add only the new turn: earlier
   * items are already there. Up to 100 a call; none makes no call.
   */
  create(
    id: string,
    items: readonly ConversationItemInput[],
    options?: RequestOptions,
  ): Promise<ConversationItem[]>;
  get(id: string, itemId: string, options?: RequestOptions): Promise<ConversationItem>;
  update(
    id: string,
    itemId: string,
    params: UpdateConversationItemParams,
    options?: RequestOptions,
  ): Promise<ConversationItem>;
}

/**
 * Read and manage conversations with the API key, as your org. Before acting on an id from
 * the browser, check the conversation's `userId` is the signed-in user.
 */
export interface Conversations {
  list(params?: ListConversationsParams): Promise<CloudConversationList>;
  /** Creates it for `options.userId`, so their frontend token can read it too. */
  create(
    params: CreateConversationParams,
    options: ConversationUserOptions,
  ): Promise<CloudConversation>;
  get(id: string, options?: RequestOptions): Promise<CloudConversation>;
  update(
    id: string,
    params: UpdateConversationParams,
    options?: RequestOptions,
  ): Promise<CloudConversation>;
  /** Deleted conversations can't be restored. */
  delete(id: string, options?: RequestOptions): Promise<void>;
  readonly items: ConversationItems;
}

/** A conversation's items as one SDK's messages. */
export interface MessageConversationItems<Input, Output> {
  /**
   * Converts the messages to items and adds them in order, then resolves with the items as
   * stored. Add only the new turn: earlier messages are already there.
   */
  create(
    id: string,
    messages: readonly Input[],
    options?: RequestOptions,
  ): Promise<ConversationItem[]>;
  /** The whole thread as messages, oldest first, ready to send to the model. */
  list(id: string, options?: RequestOptions): Promise<Output[]>;
}

/** `openui.conversations`, with items taken and read back as one SDK's messages. */
export interface MessageConversations<Input, Output> extends Omit<Conversations, "items"> {
  readonly items: MessageConversationItems<Input, Output>;
}

/** Conversations whose items are Chat Completions messages. */
export type ChatConversations = MessageConversations<
  ChatCompletionMessageParam,
  ChatCompletionMessageParam
>;

/**
 * A stored message, as LangGraph takes it: pass these to `graph.invoke({ messages })`, whose
 * reducer turns them into LangChain messages.
 */
export type LangGraphHistoryMessage =
  | { role: "human"; content: MessageContent }
  | { role: "ai"; content: string; tool_calls?: ToolCall[] }
  | { role: "tool"; content: string; tool_call_id: string };

/** Conversations whose items are LangGraph's LangChain messages. */
export type LangGraphConversations = MessageConversations<BaseMessage, LangGraphHistoryMessage>;
