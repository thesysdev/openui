"use client";

import { openuiLibrary } from "@openuidev/react-ui/genui-lib";
import { OpenUIDashboard } from "@/components/OpenUIDashboard";
import { STARTERS } from "@/starters";

export default function DashboardPage() {
  return <OpenUIDashboard library={openuiLibrary}  />;
}
