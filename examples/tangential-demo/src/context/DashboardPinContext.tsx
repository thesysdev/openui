"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export interface PinnedDashboard {
  code: string;
  messageId: string;
}

interface DashboardPinContextValue {
  pinnedDashboard: PinnedDashboard | null;
  pinDashboard: (code: string, messageId: string) => void;
  unpinDashboard: () => void;
}

const DashboardPinContext = createContext<DashboardPinContextValue | null>(null);

export function DashboardPinProvider({ children }: { children: React.ReactNode }) {
  const [pinnedDashboard, setPinnedDashboard] = useState<PinnedDashboard | null>(null);

  const pinDashboard = useCallback((code: string, messageId: string) => {
    setPinnedDashboard({ code, messageId });
  }, []);

  const unpinDashboard = useCallback(() => {
    setPinnedDashboard(null);
  }, []);

  const value = useMemo(
    () => ({
      pinnedDashboard,
      pinDashboard,
      unpinDashboard,
    }),
    [pinnedDashboard, pinDashboard, unpinDashboard],
  );

  return <DashboardPinContext.Provider value={value}>{children}</DashboardPinContext.Provider>;
}

export function useDashboardPin() {
  const context = useContext(DashboardPinContext);
  if (!context) {
    throw new Error("useDashboardPin must be used within DashboardPinProvider");
  }
  return context;
}
