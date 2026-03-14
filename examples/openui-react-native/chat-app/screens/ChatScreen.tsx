import React, { useState, useCallback, useRef } from "react";
import {
  FlatList,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";
import { useStreamingChat, StreamMessage } from "../hooks/useStreamingChat";
import { pushStream } from "../store/streamStore";
import { BotBubble } from "../components/BotBubble";
import { UserBubble } from "../components/UserBubble";
import { ChatInput } from "../components/ChatInput";
import { SuggestedPrompts } from "../components/SuggestedPrompts";

// ─── Message types ────────────────────────────────────────────────────────────

type UserMessage = { id: string; type: "user"; text: string };
type BotMessage = { id: string; type: "bot" };
type ChatMessage = UserMessage | BotMessage;

let _counter = 0;
const uid = () => String(++_counter);

// ─── ChatScreen ───────────────────────────────────────────────────────────────

type Props = { backendUrl: string };

export default function ChatScreen({ backendUrl }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const { sendMessage } = useStreamingChat(backendUrl);
  const historyRef = useRef<StreamMessage[]>([]);

  const handleSend = useCallback(
    async (text: string) => {
      // 1. User message
      setMessages((prev) => [{ id: uid(), type: "user", text }, ...prev]);

      // 2. Conversation history
      const newHistory: StreamMessage[] = [
        ...historyRef.current,
        { role: "user", content: text },
      ];
      historyRef.current = newHistory;

      // 3. Bot placeholder — content lives in the stream store, not here
      const botId = uid();
      pushStream(botId, { openui: "", isStreaming: true });
      setMessages((prev) => [{ id: botId, type: "bot" }, ...prev]);
      setIsStreaming(true);

      // 4. Stream chunks into the store
      await sendMessage(newHistory, (accumulated, isDone) => {
        pushStream(botId, { openui: accumulated, isStreaming: !isDone });
        if (isDone) {
          setIsStreaming(false);
          historyRef.current = [
            ...newHistory,
            { role: "assistant", content: accumulated },
          ];
        }
      });
    },
    [sendMessage]
  );

  const renderItem = useCallback(({ item }: { item: ChatMessage }) => {
    if (item.type === "user") {
      return <UserBubble text={item.text} />;
    }
    return <BotBubble messageId={item.id} />;
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <FlatList
            data={messages}
            renderItem={renderItem}
            keyExtractor={(m) => m.id}
            inverted
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
          />
          {messages.length === 0 && (
            <SuggestedPrompts onSelect={handleSend} />
          )}
          <ChatInput onSend={handleSend} disabled={isStreaming} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  flex: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
});
