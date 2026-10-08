import { createContext, useContext, useEffect, useMemo } from "react";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

interface AgentInterfaceState {
  isSidebarOpen: boolean;
  isWorkspaceOpen: boolean;
  agentName: string;
  logoUrl: string;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setIsWorkspaceOpen: (isOpen: boolean) => void;
  setAgentName: (name: string) => void;
  setLogoUrl: (url: string) => void;
}

// Whether the desktop sidebar was left open, written by SidebarContainer.
// Collapsed unless the user left it open; also collapsed on the server, where
// storage can't be read.
export const SIDEBAR_OPEN_STORAGE_KEY = "openui-agent-sidebar-open";

const readSidebarOpen = () => {
  try {
    return (
      typeof window !== "undefined" && window.localStorage.getItem(SIDEBAR_OPEN_STORAGE_KEY) === "1"
    );
  } catch {
    return false;
  }
};

export const createAgentInterfaceStore = ({
  logoUrl,
  agentName,
}: {
  logoUrl: string;
  agentName: string;
}) =>
  create<AgentInterfaceState>((set) => ({
    isSidebarOpen: readSidebarOpen(),
    isWorkspaceOpen: false,
    agentName: agentName,
    logoUrl: logoUrl,
    setIsSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),
    setIsWorkspaceOpen: (isOpen: boolean) => set({ isWorkspaceOpen: isOpen }),
    setAgentName: (name: string) => set({ agentName: name }),
    setLogoUrl: (url: string) => set({ logoUrl: url }),
  }));

export const AgentInterfaceStoreContext = createContext<ReturnType<
  typeof createAgentInterfaceStore
> | null>(null);

export const useAgentInterfaceStore = <T,>(selector: (state: AgentInterfaceState) => T): T => {
  const store = useContext(AgentInterfaceStoreContext);
  if (!store) {
    throw new Error("useAgentInterfaceStore must be used within AgentInterfaceStoreProvider");
  }

  return store(useShallow(selector));
};

export const AgentInterfaceStoreProvider = ({
  children,
  agentName,
  logoUrl,
}: {
  children: React.ReactNode;
  logoUrl: string;
  agentName: string;
}) => {
  const shellStore = useMemo(() => createAgentInterfaceStore({ agentName, logoUrl }), []);

  useEffect(() => {
    const { setAgentName, setLogoUrl } = shellStore.getState();
    setAgentName(agentName);
    setLogoUrl(logoUrl);
  }, [agentName, logoUrl]);

  return (
    <AgentInterfaceStoreContext.Provider value={shellStore}>
      {children}
    </AgentInterfaceStoreContext.Provider>
  );
};
