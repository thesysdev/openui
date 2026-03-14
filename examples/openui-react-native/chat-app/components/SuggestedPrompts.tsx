import React from "react";
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
} from "react-native";

interface Prompt {
  label: string;
  text: string;
  icon: string;
}

const PROMPTS: Prompt[] = [
  {
    icon: "📊",
    label: "Top languages 2025",
    text: "Show me the top 6 programming languages in 2025 by popularity as a bar chart.",
  },
  {
    icon: "📈",
    label: "Revenue trend",
    text: "Show Apple's annual revenue from 2019 to 2024 as a line chart.",
  },
  {
    icon: "🥧",
    label: "Energy mix",
    text: "Break down global electricity generation by source (coal, gas, nuclear, hydro, solar, wind) as a pie chart.",
  },
  {
    icon: "📉",
    label: "Crypto 6-month trend",
    text: "Show Bitcoin's monthly closing price trend over the last 6 months as a line chart.",
  },
  {
    icon: "🏆",
    label: "Social media users",
    text: "Compare monthly active users across Facebook, YouTube, WhatsApp, Instagram, and TikTok using a bar chart.",
  },
  {
    icon: "🥧",
    label: "Market share",
    text: "Show the global smartphone OS market share between Android, iOS, and others as a pie chart.",
  },
  {
    icon: "📊",
    label: "Coffee shop sales",
    text: "Show fictional monthly sales figures for a coffee shop from January to June as a bar chart.",
  },
  {
    icon: "🌤️",
    label: "Explain something",
    text: "Explain how the water cycle works.",
  },
];

interface Props {
  onSelect: (text: string) => void;
}

export function SuggestedPrompts({ onSelect }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.heading}>Try asking…</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {PROMPTS.map((p) => (
          <TouchableOpacity
            key={p.text}
            style={styles.chip}
            onPress={() => onSelect(p.text)}
            activeOpacity={0.7}
          >
            <Text style={styles.chipIcon}>{p.icon}</Text>
            <Text style={styles.chipLabel}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingBottom: 8,
  },
  heading: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9ca3af",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  row: {
    paddingHorizontal: 12,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipLabel: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
  },
});
