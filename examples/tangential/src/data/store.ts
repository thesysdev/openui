import { seedWorkspaceData } from "@/data/seed";
import type { WorkspaceData } from "@/data/types";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

// Global mutable store for dummy API behavior in local dev.
const globalState = globalThis as typeof globalThis & {
  __linearDashboardStore?: WorkspaceData;
};

export const getStore = (): WorkspaceData => {
  if (!globalState.__linearDashboardStore) {
    globalState.__linearDashboardStore = clone(seedWorkspaceData);
  }
  return globalState.__linearDashboardStore;
};

export const resetStore = (): WorkspaceData => {
  globalState.__linearDashboardStore = clone(seedWorkspaceData);
  return globalState.__linearDashboardStore;
};
