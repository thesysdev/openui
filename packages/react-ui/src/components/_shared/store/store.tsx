import { createContext, useContext, useEffect, useRef } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

interface ShellState {
  isSidebarOpen: boolean;
  agentName: string;
  logoUrl: string;
  showAssistantLogo: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setAgentName: (name: string) => void;
  setLogoUrl: (url: string) => void;
  setShowAssistantLogo: (show: boolean) => void;
}

export const createShellStore = ({
  logoUrl,
  agentName,
  showAssistantLogo,
}: {
  logoUrl: string;
  agentName: string;
  showAssistantLogo: boolean;
}) =>
  create<ShellState>((set) => ({
    isSidebarOpen: true,
    agentName: agentName,
    logoUrl: logoUrl,
    showAssistantLogo,
    setIsSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),
    setAgentName: (name: string) => set({ agentName: name }),
    setLogoUrl: (url: string) => set({ logoUrl: url }),
    setShowAssistantLogo: (show: boolean) => set({ showAssistantLogo: show }),
  }));

export const ShellStoreContext = createContext<ReturnType<typeof createShellStore> | null>(null);

export const useShellStore = <T,>(selector: (state: ShellState) => T): T => {
  const store = useContext(ShellStoreContext);
  if (!store) {
    throw new Error("useShellStore must be used within ShellStoreProvider");
  }

  return store(useShallow(selector));
};

export const ShellStoreProvider = ({
  children,
  agentName,
  logoUrl,
  showAssistantLogo = false,
}: {
  children: React.ReactNode;
  logoUrl: string;
  agentName: string;
  showAssistantLogo?: boolean;
}) => {
  const shellStoreRef = useRef<ReturnType<typeof createShellStore> | null>(null);
  if (!shellStoreRef.current) {
    shellStoreRef.current = createShellStore({ agentName, logoUrl, showAssistantLogo });
  }
  const shellStore = shellStoreRef.current;

  useEffect(() => {
    const { setAgentName, setLogoUrl, setShowAssistantLogo } = shellStore.getState();
    setAgentName(agentName);
    setLogoUrl(logoUrl);
    setShowAssistantLogo(showAssistantLogo);
  }, [agentName, logoUrl, shellStore, showAssistantLogo]);

  return <ShellStoreContext.Provider value={shellStore}>{children}</ShellStoreContext.Provider>;
};
