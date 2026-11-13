import { createOpenUiChatLibrary } from "@lynx-js/genui/openui/chat";

// Created once: the renderer keeps its streaming parser while the library is
// unchanged. The backend builds its system prompt from the same Chat contracts.
export const library = createOpenUiChatLibrary();
