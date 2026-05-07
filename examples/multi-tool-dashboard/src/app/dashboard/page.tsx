"use client";

import { library } from "@/library";
import { OpenUIDashboard } from "@/components/OpenUIDashboard";
import { DEFAULT_DASHBOARD } from "@/default-dashboard";

export default function DashboardPage() {
  return <OpenUIDashboard library={library} initialDashboardCode={DEFAULT_DASHBOARD} />;
}
