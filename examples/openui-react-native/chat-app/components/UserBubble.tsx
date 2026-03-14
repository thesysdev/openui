import React from "react";
import { View, Text, StyleSheet } from "react-native";

export function UserBubble({ text }: { text: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  bubble: {
    backgroundColor: "#6366f1",
    borderRadius: 20,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: "80%",
  },
  text: {
    color: "#ffffff",
    fontSize: 16,
    lineHeight: 22,
  },
});
