import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

type Props = {
  title?: string;
  message: string;
  hint?: string;
};

export default function ErrorScreen({ title = "Configuration Error", message, hint }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>⚠️</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {hint ? (
          <View style={styles.hintBox}>
            <Text style={styles.hintLabel}>How to fix</Text>
            <Text style={styles.hint}>{hint}</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  iconBox: {
    marginBottom: 8,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
  },
  hintBox: {
    marginTop: 16,
    backgroundColor: "#1e1e2e",
    borderRadius: 10,
    padding: 16,
    width: "100%",
    gap: 6,
  },
  hintLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#6c7086",
  },
  hint: {
    fontFamily: "Courier",
    fontSize: 12,
    color: "#cdd6f4",
    lineHeight: 20,
  },
});
