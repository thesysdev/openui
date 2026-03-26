import { useEffect, useState, type FC } from "react";
import { ArtifactContext } from "./ArtifactContext";
import { ChatContext } from "./ChatContext";
import { createArtifactStore } from "./createArtifactStore";
import { createChatStore } from "./createChatStore";
import type { ChatProviderProps } from "./types";

export const ChatProvider: FC<ChatProviderProps> = ({ children, ...config }) => {
  const [chatStore] = useState(() => createChatStore(config));
  const [artifactStore] = useState(() => createArtifactStore());

  // Cross-store subscription: reset artifacts when the active thread changes.
  // useEffect (not inline) so the cleanup function unsubscribes on unmount.
  useEffect(() => {
    const unsubscribe = chatStore.subscribe(
      (state) => state.selectedThreadId,
      () => artifactStore.getState().resetArtifacts(),
    );
    return unsubscribe;
  }, [chatStore, artifactStore]);

  return (
    <ChatContext.Provider value={chatStore}>
      <ArtifactContext.Provider value={artifactStore}>{children}</ArtifactContext.Provider>
    </ChatContext.Provider>
  );
};
