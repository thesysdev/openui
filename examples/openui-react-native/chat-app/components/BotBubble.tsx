import React from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { Renderer } from "@openuidev/react-lang";
import { library } from "../library";
import { useStreamContent } from "../store/streamStore";

export function BotBubble({ messageId }: { messageId: string }) {
  const content = useStreamContent(messageId);
  const openui = content?.openui ?? "";
  const isStreaming = content?.isStreaming ?? true;

  if (!openui) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <Renderer response={openui} library={library} isStreaming={isStreaming} />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: "flex-start",
  },
  wrapper: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
});
