import { createContext, useContext, useMemo } from "react";

export const LayoutContext = createContext<{
  layout: "mobile" | "fullscreen" | "tray" | "copilot";
}>({ layout: "fullscreen" });

export const LayoutContextProvider = ({
  children,
  layout,
}: {
  children: React.ReactNode;
  layout: "mobile" | "fullscreen" | "tray" | "copilot";
}) => {
  const value = useMemo(() => ({ layout }), [layout]);
  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};

export const useLayoutContext = () => {
  const context = useContext(LayoutContext);
  return context;
};
