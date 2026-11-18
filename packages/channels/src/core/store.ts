/**
 * In-memory MessageStore: the zero-config default for dev and single-process
 * bots. State is lost on restart; implement MessageStore over Redis or a
 * database for durability.
 */
import type { MessageRef, MessageState, MessageStore } from "./types";

const key = (ref: MessageRef) => `${ref.platform}:${ref.conversationId}:${ref.messageId}`;

export class MemoryStore implements MessageStore {
  private messages = new Map<string, MessageState>();

  async get(ref: MessageRef): Promise<MessageState | undefined> {
    return this.messages.get(key(ref));
  }

  async save(ref: MessageRef, state: MessageState): Promise<void> {
    this.messages.set(key(ref), state);
  }
}
