import { createContext, useContext, useMemo } from "react";

type PrintContextType = {} | null;

export const PrintContext = createContext<PrintContextType>(null);

export const usePrintContext = () => {
  const context = useContext(PrintContext);
  return context;
};

export const PrintContextProvider = ({ children }: { children: React.ReactNode }) => {
  const memoizedValue = useMemo(() => ({}), []);

  return <PrintContext.Provider value={memoizedValue}>{children}</PrintContext.Provider>;
};
