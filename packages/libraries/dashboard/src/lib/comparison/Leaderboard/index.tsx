"use client";
import { defineComponent, type ComponentRenderProps } from "@openuidev/react-lang";
import type { LeaderboardProps } from "../../../components/comparison/Leaderboard";
import { Leaderboard } from "../../../components/comparison/Leaderboard";
import type { Covered, SchemaCoverage } from "../../schemaCoverage";
import { leaderboardPropsSchema, type LeaderboardSchemaProps } from "./schema";

export const LeaderboardComponent = defineComponent({
  name: "Leaderboard",
  props: leaderboardPropsSchema,
  description:
    "Ranked list with inline bars and change vs previous: top channels, pages, campaigns. Shows every item, sorted; a long list scrolls inside the card. limit keeps only the top N.",
  component: LeaderboardView,
});

function LeaderboardView({ props }: ComponentRenderProps<LeaderboardSchemaProps>) {
  return <Leaderboard {...props} />;
}

// Every schema field reaches Leaderboard.
export type LeaderboardSchemaCovered = Covered<
  SchemaCoverage<LeaderboardSchemaProps, LeaderboardProps>
>;
